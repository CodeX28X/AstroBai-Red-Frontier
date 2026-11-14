import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const project = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const cache = join(project, 'node_modules/.cache')
mkdirSync(cache, { recursive: true })
const scratch = mkdtempSync(join(cache, 'icebound-ui-tests-'))
after(() => {
  assert.ok(resolve(scratch).startsWith(resolve(cache) + sep))
  rmSync(scratch, { recursive: true, force: true })
})
const exports = {
  'src/features/mars-map/integration/iceboundExploration.ts': ['selectIceboundExploration', 'iceboundMapCommand'],
  'src/features/mars-map/integration/useIceboundExploration.ts': ['useIceboundExploration'],
  'src/features/mars-map/integration/IceboundSiteDetails.tsx': ['IceboundSiteDetails'],
  'src/features/mars-map/components/mars/ExplorationSite.tsx': ['ExplorationSite'],
  'src/features/mars-map/demo/iceboundPreviewSetup.ts': ['iceboundPreviewSetup'],
  'src/features/missions/index.ts': ['ICEBOUND_SITES'],
  'src/shared/store/gameReducer.ts': ['gameReducer', 'createInitialGameState'],
  'src/shared/store/GameContext.ts': ['GameContext'],
}
writeFileSync(join(scratch, 'entry.ts'), Object.entries(exports).map(([path, names]) =>
  'export { ' + names.join(', ') + ' } from ' + JSON.stringify(join(project, path).replaceAll('\\', '/')) + ';'
).join('\n'))
await build({
  configFile: false, root: project, logLevel: 'silent',
  build: { outDir: scratch, emptyOutDir: false, minify: false,
    lib: { entry: join(scratch, 'entry.ts'), formats: ['cjs'], fileName: () => 'ui.cjs' },
    rolldownOptions: { external: ['react', 'react/jsx-runtime'] } },
})
const api = createRequire(import.meta.url)(join(scratch, 'ui.cjs'))
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props))
const ready = (options = {}) => api.iceboundPreviewSetup.reduce(api.gameReducer, api.createInitialGameState(options))
const command = (state, siteId) => api.gameReducer(state, api.iceboundMapCommand(state, siteId))
const progress = state => ({ mission: state.icebound, resources: state.resources,
  slots: state.actionsRemaining, objectives: state.objectives, events: state.iceboundEvents, ids: state.appliedResolutionIds })
function hook(state, dispatch = () => assert.fail('render dispatched')) {
  let value
  function Probe() { value = api.useIceboundExploration(); return null }
  render(api.GameContext.Provider, { value: { state, dispatch }, children: React.createElement(Probe) })
  return value
}
function selectionButton(element) {
  return React.Children.toArray(element.props.children).find(child => React.isValidElement(child) && child.type === 'button')
}

test('the debug setup confirms real cargo and commissions the outpost at Sol 3 without invented readiness', () => {
  const state = ready()
  const preparation = state.preparation
  assert.equal(preparation.status, 'confirmed')
  assert.equal(preparation.confirmedAtRevision, preparation.revision)
  assert.equal(preparation.reviewedRevision, preparation.revision)
  assert.equal(preparation.latestReview.allowed, true)
  assert.equal(preparation.manifest.missionId, 'icebound')
  assert.deepEqual(preparation.manifest.optionalCargo.map(item => item.equipmentId),
    api.iceboundPreviewSetup.filter(action => action.type === 'SET_EQUIPMENT_QUANTITY').map(action => action.equipmentId))
  assert.deepEqual(state.iceboundReadiness.deployedEquipment,
    preparation.manifest.optionalCargo.map(item => ({ equipmentId: item.equipmentId, status: 'operational' })))
  assert.equal(state.facilities.habitat, 'operational')
  assert.equal(state.iceboundReadiness.laboratoryOperational, false)
  assert.deepEqual(state.iceboundReadiness.baselineCapabilities, [])
  assert.equal(state.phase, 'outpost')
  assert.equal(state.sol, 3)
  assert.equal(state.outcome, null)
  assert.equal(state.actionsRemaining, 2)
  assert.equal(state.actionLimits.maxSol, 10)
  assert.deepEqual(state.resources, { power: 95, oxygen: 100, water: 100, food: 95 })
  assert.deepEqual(state.icebound.completedObjectives, [])
  assert.deepEqual(state.icebound.observations, [])
  assert.equal(hook(state).recon.eligible, true)
})

test('hook reconnaissance commits exact resources, slot, observations and progress once; selection is free', () => {
  let state = ready()
  const dispatch = action => { state = api.gameReducer(state, action) }
  hook(state, dispatch).reconnoitre()
  assert.deepEqual(state.resources, { power: 92, oxygen: 100, water: 100, food: 95 })
  assert.equal(state.actionsRemaining, 1)
  assert.equal(state.icebound.revision, 1)
  assert.deepEqual(state.icebound.completedObjectives, ['icebound.recon'])
  assert.equal(state.icebound.observations.length, api.ICEBOUND_SITES.length)
  assert.equal(state.iceboundEvents.length, 1)
  assert.equal(state.appliedResolutionIds.length, 1)
  const before = structuredClone(progress(state))
  hook(state, dispatch).reconnoitre()
  assert.deepEqual(progress(state), before)
  assert.equal(state.feedback.kind, 'error')
  assert.ok(state.feedback.message.length > 0)
  hook(state, dispatch).selectSite(api.ICEBOUND_SITES[0].id)
  assert.deepEqual(state.resources, before.resources)
  assert.equal(state.actionsRemaining, 1)
  assert.equal(state.icebound.revision, 2)
  assert.equal(state.iceboundEvents.length, 2)
})

test('preview commands respect exhausted slots, the real Sol 10 boundary and terminal debrief', () => {
  let state = ready()
  for (const actionId of ['qa-first', 'qa-second']) {
    state = api.gameReducer(state, { type: 'SPEND_ACTION_SLOT', category: 'operation', actionId })
  }
  assert.equal(hook(state).recon.eligible, false)
  assert.ok(hook(state).recon.issues.some(issue => issue.code === 'INSUFFICIENT_ACTIONS'))
  const exhausted = command(state)
  assert.deepEqual(progress(exhausted), progress(state))
  assert.equal(hook(exhausted).feedback.kind, 'error')
  while (state.sol < 10) state = api.gameReducer(state, { type: 'ADVANCE_SOL' })
  assert.equal(state.actionsRemaining, 2)
  assert.equal(hook(state).recon.eligible, true)
  assert.throws(() => api.gameReducer(state, { type: 'ADVANCE_SOL' }), /maximum sol reached/)
  state = api.gameReducer(state, { type: 'ENTER_DEBRIEF' })
  assert.equal(state.phase, 'debrief')
  assert.equal(state.outcome, 'success')
  assert.equal(hook(state).recon.eligible, false)
  for (const siteId of [undefined, api.ICEBOUND_SITES[0].id]) {
    const result = command(state, siteId)
    assert.deepEqual(progress(result), progress(state))
    assert.equal(hook(result).feedback.kind, 'error')
    assert.match(hook(result).feedback.message, /active outpost mission/)
  }
})

test('real ICEBOUND definitions render as locked inspectable markers before reconnaissance', () => {
  const state = ready()
  const before = structuredClone(state)
  const view = hook(state)
  assert.deepEqual(view.sites.map(site => site.id), api.ICEBOUND_SITES.map(site => site.id))
  for (const site of view.sites) {
    assert.equal(site.status, 'locked')
    assert.equal(site.observation, undefined)
    const html = render(api.ExplorationSite, { site, selected: false, onSelect() {} })
    assert.ok(html.includes(site.label))
    assert.match(html, /site-locked/)
    const detail = render(api.IceboundSiteDetails, { site, onSelect() {} })
    assert.match(detail, /disabled/)
    assert.match(detail, /Fictional scenario/)
    assert.match(detail, /Science sources/)
    assert.doesNotMatch(detail, /Watch out for:/)
    assert.match(detail, /earlier investigation|reconnaissance/i)
  }
  assert.deepEqual(state, before)
})

test('reconnaissance unlocks engine-approved sites and reveals recorded observations and sources', () => {
  const state = command(ready())
  const view = hook(state)
  for (const site of view.sites) {
    assert.equal(site.status, 'available')
    assert.deepEqual(site.observation, state.icebound.observations.find(item => item.siteId === site.id))
    const html = render(api.IceboundSiteDetails, { site, onSelect() {} })
    assert.match(html, /Ground:/)
    assert.match(html, /Watch out for:/)
    assert.match(html, /You can use:/)
    assert.match(html, /science.nasa.gov/)
    assert.match(html, /not an analysis result/)
    assert.doesNotMatch(html, /disabled/)
  }
  const noCrew = { ...state, iceboundReadiness: { ...state.iceboundReadiness, crewAvailable: false } }
  const echo = hook(noCrew).sites.find(site => site.id === 'icebound.echo-ridge')
  assert.equal(echo.status, 'locked')
  assert.match(render(api.IceboundSiteDetails, { site: echo, onSelect() {} }), /cannot be reached/)
})

test('real selection button dispatches the revision-aware action and reflects central selection on render', () => {
  let state = command(ready())
  const dispatched = []
  const view = hook(state, action => { dispatched.push(action); state = api.gameReducer(state, action) })
  const site = view.sites[0]
  const before = structuredClone(state)
  const button = selectionButton(api.IceboundSiteDetails({ site, onSelect: view.selectSite }))
  assert.equal(button.props.disabled, false)
  button.props.onClick()
  assert.deepEqual(dispatched, [{ type: 'ICEBOUND_COMMAND', intent: { type: 'SELECT_SITE', siteId: site.id },
    expectedMissionRevision: before.icebound.revision }])
  assert.deepEqual(state.resources, before.resources)
  assert.equal(state.actionsRemaining, before.actionsRemaining)
  const updated = hook(state)
  assert.equal(updated.selectedSiteId, site.id)
  assert.equal(updated.sites[0].selected, true)
  assert.match(render(api.ExplorationSite, { site: updated.sites[0], selected: true, onSelect() {} }), /aria-pressed="true"/)
  assert.match(render(api.IceboundSiteDetails, { site: updated.sites[0], onSelect() {} }), /Research site selected/)
  assert.equal(hook(api.createInitialGameState()).selectedSiteId, null)
})

test('invalid IDs, locked prerequisites, early sols and terminal games cannot change mission progress', () => {
  const initial = ready()
  const recon = command(initial)
  for (const [state, id] of [
    [initial, api.ICEBOUND_SITES[0].id],
    [{ ...initial, sol: 2 }, api.ICEBOUND_SITES[0].id],
    [recon, 'invented-site'],
    [{ ...recon, outcome: 'failure' }, api.ICEBOUND_SITES[0].id],
  ]) {
    const before = structuredClone(progress(state))
    const view = hook(state)
    let next
    const wired = hook(state, action => { next = api.gameReducer(state, action) })
    wired.selectSite(id) // Even a forged callback must pass the reducer.
    assert.deepEqual(progress(next), before)
    if (id !== 'invented-site') assert.equal(view.sites[0].canSelect, false)
  }
})

test('replayed reconnaissance and site requests never duplicate costs or mission effects', () => {
  let state = ready()
  const dispatch = action => { state = api.gameReducer(state, action) }
  const first = hook(state, dispatch)
  first.reconnoitre()
  assert.equal(state.actionsRemaining, 1)
  assert.equal(state.iceboundEvents.length, 1)
  const afterRecon = structuredClone(progress(state))
  first.reconnoitre() // Stale captured callback.
  hook(state, dispatch).reconnoitre() // Fresh callback, already completed objective.
  assert.deepEqual(progress(state), afterRecon)
  hook(state, dispatch).selectSite(api.ICEBOUND_SITES[0].id)
  const afterSelection = structuredClone(progress(state))
  hook(state, dispatch).selectSite(api.ICEBOUND_SITES[0].id)
  hook(state, dispatch).selectSite(api.ICEBOUND_SITES[1].id)
  assert.deepEqual(progress(state), afterSelection)
})

test('accepted expedition and negative science report update the existing assignment and completion visuals', () => {
  let state = command(ready({ installedCapabilities: ['lab-analysis'] }))
  state = command(state, api.ICEBOUND_SITES[0].id)
  const plan = { siteId: state.icebound.selectedSiteId, method: 'rover-only', activity: 'surface-sampling',
    equipmentIds: state.preparation.manifest.optionalCargo.map(item => item.equipmentId),
    supplies: { power: 30, oxygen: 15, water: 8, food: 8 } }
  state = api.gameReducer(state, { type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan })
  state = api.gameReducer(state, { type: 'REVIEW_ICEBOUND_EXPEDITION_PLAN' })
  state = api.gameReducer(state, { type: 'CONFIRM_ICEBOUND_EXPEDITION_PLAN', revision: state.iceboundPlanning.revision })
  const run = intent => { state = api.gameReducer(state, { type: 'ICEBOUND_COMMAND', intent }) }
  run({ type: 'EXECUTE_EXPEDITION' })
  let site = hook(state).sites[0]
  assert.equal(site.assignment, 'rover')
  assert.equal(site.status, 'active')
  state = api.gameReducer(state, { type: 'ADVANCE_SOL' })
  run({ type: 'COLLECT_SAMPLE', method: 'surface-sampling' })
  run({ type: 'ANALYZE_SAMPLE', sampleId: state.icebound.samples[0].id })
  run({ type: 'GENERATE_REPORT' })
  const completed = hook(state)
  site = completed.sites[0]
  assert.equal(state.icebound.report.conclusion, 'no-accessible-ice-detected')
  assert.equal(site.status, 'completed')
  assert.equal(completed.completionNotice.message, state.icebound.report.findings[0].conclusion)
  assert.match(render(api.ExplorationSite, { site, selected: true, onSelect() {} }), /site-completed/)
  assert.equal(state.sol, 4)
})

