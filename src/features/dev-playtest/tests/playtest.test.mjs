import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const cache = join(root, 'node_modules/.cache')
mkdirSync(cache, { recursive: true })
const scratch = mkdtempSync(join(cache, 'playtest-tests-'))
after(() => { assert.ok(resolve(scratch).startsWith(resolve(cache) + sep)); rmSync(scratch, { recursive: true, force: true }) })
const exports = {
  'src/features/dev-playtest/PlaytestShell.tsx': ['PlaytestShell'],
  'src/shared/store/GameContext.ts': ['GameContext'],
  'src/shared/store/GameProvider.tsx': ['GameProvider'],
  'src/shared/store/gameReducer.ts': ['gameReducer', 'createInitialGameState'],
  'src/shared/store/gameReducerWithFeedback.ts': ['gameReducerWithFeedback'],
  'src/shared/store/iceboundSelectors.ts': ['selectIceboundView'],
}
writeFileSync(join(scratch, 'entry.ts'), Object.entries(exports).map(([path, names]) =>
  'export { '+names.join(', ')+' } from '+JSON.stringify(join(root, path).replaceAll('\\', '/'))+';').join('\n'))
await build({ configFile: false, root, logLevel: 'silent', build: {
  outDir: scratch, emptyOutDir: false, minify: false,
  lib: { entry: join(scratch, 'entry.ts'), formats: ['cjs'], fileName: () => 'tests.cjs' },
  rolldownOptions: { external: ['react', 'react/jsx-runtime'] },
} })
const api = createRequire(import.meta.url)(join(scratch, 'tests.cjs'))
// Minimal presentation-environment inputs for B's media/visibility initializers.
// Effects do not run during server rendering; gameplay always uses the real reducer.
globalThis.document = { visibilityState: 'visible' }
globalThis.window = { matchMedia: () => ({ matches: false }) }
function html(state) {
  return renderToStaticMarkup(React.createElement(api.GameContext.Provider, {
    value: { state, dispatch() { assert.fail('render dispatched') } },
  }, React.createElement(api.PlaytestShell)))
}
const equipment = ['field-rover', 'repair-toolkit', 'soil-analysis-kit', 'sample-container-set', 'portable-oxygen-kit']
function run(options = {}) {
  let state = api.createInitialGameState(options)
  const send = action => { state = api.gameReducerWithFeedback(state, action); return state }
  const mission = intent => send({ type: 'ICEBOUND_COMMAND', intent, expectedMissionRevision: state.icebound.revision })
  const start = () => {
    send({ type: 'START_GAME' })
    for (const equipmentId of equipment) send({ type: 'SET_EQUIPMENT_QUANTITY', equipmentId, quantity: 1 })
    send({ type: 'REVIEW_MANIFEST' }); send({ type: 'CONFIRM_MANIFEST' })
    assert.equal(state.preparation.status, 'confirmed')
    send({ type: 'BEGIN_LAUNCH' }); assert.equal(state.phase, 'launch')
    send({ type: 'COMPLETE_LAUNCH' }); assert.equal(state.phase, 'landing')
    send({ type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' })
    assert.equal(state.facilities.habitat, 'operational')
    assert.deepEqual(state.resources, { power: 95, oxygen: 100, water: 100, food: 95 })
    for (let i = 0; i < 3; i++) send({ type: 'ADVANCE_SOL' })
  }
  const investigate = (activity = 'surface-sampling') => {
    mission({ type: 'RECON' }); mission({ type: 'SELECT_SITE', siteId: 'icebound.lumen-shelf' })
    send({ type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan: { siteId: state.icebound.selectedSiteId, method: 'rover-only',
      activity, equipmentIds: equipment, supplies: { power: 30, oxygen: 15, water: 8, food: 8 } } })
    send({ type: 'REVIEW_ICEBOUND_EXPEDITION_PLAN' })
    assert.equal(state.iceboundPlanning.review.allowed, true)
    send({ type: 'CONFIRM_ICEBOUND_EXPEDITION_PLAN', revision: state.iceboundPlanning.revision })
    mission({ type: 'EXECUTE_EXPEDITION' }); assert.equal(state.actionsRemaining, 0)
    send({ type: 'ADVANCE_SOL' }); mission({ type: 'COLLECT_SAMPLE', method: activity })
  }
  const finish = () => { while (state.sol < 10) send({ type: 'ADVANCE_SOL' }); send({ type: 'ENTER_DEBRIEF' }) }
  return { get state() { return state }, send, mission, start, investigate, finish }
}

test('default legitimate menu-to-debrief playthrough preserves the missing laboratory restriction', () => {
  const game = run()
  assert.match(html(game.state), /Start game/)
  game.start(); game.investigate()
  game.mission({ type: 'ANALYZE_SAMPLE', sampleId: game.state.icebound.samples[0].id })
  assert.equal(game.state.feedback.code, 'LAB_UNAVAILABLE')
  assert.equal(game.state.icebound.analyses.length, 0)
  assert.match(html(game.state), /Laboratory unavailable/)
  game.finish()
  assert.equal(game.state.phase, 'debrief')
  assert.equal(game.state.outcome, 'success')
  assert.equal(game.state.sol, 10)
  assert.equal(game.state.icebound.report, null)
  assert.match(html(game.state), /Incomplete investigation/)
})

for (const [activity, conclusion] of [
  ['surface-sampling', 'no-accessible-ice-detected'],
  ['subsurface-drilling', 'supports-accessible-ice'],
]) test('labeled installed-capability preset completes the science loop: '+conclusion, () => {
  const game = run({ installedCapabilities: ['lab-analysis', 'drilling'] })
  game.start(); game.investigate(activity)
  const id = game.state.icebound.samples[0].id
  game.mission({ type: 'ANALYZE_SAMPLE', sampleId: id }); game.mission({ type: 'GENERATE_REPORT' })
  assert.equal(game.state.icebound.report.conclusion, conclusion)
  assert.equal(game.state.missions.icebound, 'completed')
  assert.equal(game.state.icebound.completedObjectives.length, 6)
  assert.equal(game.state.sol, 4)
  const before = structuredClone(game.state)
  html(game.state); html(game.state) // Remount stage presentation, retaining the central state.
  assert.deepEqual(game.state, before)
  game.mission({ type: 'ANALYZE_SAMPLE', sampleId: id })
  assert.deepEqual(game.state.resources, before.resources)
  assert.equal(game.state.actionsRemaining, before.actionsRemaining)
  game.finish(); assert.equal(game.state.outcome, 'success')
  assert.match(html(game.state), /Completed investigation/)
})

test('preparation review blocks dependencies and invalidates stale reviews; confirmation locks cargo', () => {
  const game = run()
  game.send({ type: 'START_GAME' })
  game.send({ type: 'SET_EQUIPMENT_QUANTITY', equipmentId: 'portable-battery-bank', quantity: 1 })
  game.send({ type: 'REVIEW_MANIFEST' }); assert.equal(game.state.preparation.latestReview.allowed, false)
  game.send({ type: 'CONFIRM_MANIFEST' }); assert.notEqual(game.state.preparation.status, 'confirmed')
  game.send({ type: 'SET_EQUIPMENT_QUANTITY', equipmentId: 'folding-solar-array', quantity: 1 })
  assert.equal(game.state.preparation.reviewedRevision, null)
  game.send({ type: 'REVIEW_MANIFEST' }); game.send({ type: 'CONFIRM_MANIFEST' })
  const manifest = structuredClone(game.state.preparation.manifest)
  game.send({ type: 'SET_EQUIPMENT_QUANTITY', equipmentId: 'folding-solar-array', quantity: 0 })
  assert.deepEqual(game.state.preparation.manifest, manifest)
  assert.match(html(game.state), /disabled/)
})

test('slot limits and thrown reducer rejections produce feedback without altering gameplay', () => {
  const game = run(); game.start()
  for (const actionId of ['one', 'two', 'three']) game.send({ type: 'SPEND_ACTION_SLOT', category: 'operation', actionId })
  assert.equal(game.state.actionsRemaining, 0)
  assert.equal(game.state.feedback.kind, 'error')
  assert.match(html(game.state), /role="alert"/)
  const resources = structuredClone(game.state.resources)
  game.send({ type: 'ADVANCE_SOL' })
  assert.equal(game.state.actionsRemaining, 2)
  assert.deepEqual(game.state.resources, resources)
  game.finish()
  game.send({ type: 'ADVANCE_SOL' })
  assert.equal(game.state.feedback.kind, 'error')
  assert.equal(game.state.sol, 10)
  game.send({ type: 'RESET_GAME' })
  assert.deepEqual(game.state, api.createInitialGameState())
})

test('landing replay, invalid site and direct plan approval cannot bypass central validation', () => {
  const game = run(); game.start()
  const before = structuredClone(game.state)
  game.send({ type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' })
  game.mission({ type: 'SELECT_SITE', siteId: 'unknown' })
  game.send({ type: 'ICEBOUND_COMMAND', intent: { type: 'APPROVE_PLAN', plan: {} } })
  assert.deepEqual(game.state.resources, before.resources)
  assert.deepEqual(game.state.icebound, before.icebound)
  assert.equal(game.state.feedback.kind, 'error')
})

test('standalone production entry exposes only a development-server notice', async () => {
  const result = await build({ configFile: false, root, logLevel: 'silent', build: {
    write: false, minify: false, rolldownOptions: { input: join(root, 'src/features/dev-playtest/index.html') },
  } })
  const artifacts = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output)
  const scripts = artifacts.filter(item => item.type === 'chunk').map(item => item.code).join('\n')
  assert.match(scripts, /Playtest is available on the development server only/)
  assert.doesNotMatch(scripts, /Create expedition draft|LAB\/DRILL TEST PRESET/)
})

