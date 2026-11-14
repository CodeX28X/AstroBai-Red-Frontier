import assert from 'node:assert/strict'
import test from 'node:test'
import { iceboundEngine, getMissionStatus, createIceboundState, ICEBOUND_OBJECTIVES, ICEBOUND_SCIENCE_SOURCES,
  ICEBOUND_SITES, ICEBOUND_SCENARIOS, ICEBOUND_BALANCE } from '../engine/icebound/index.ts'
import { EQUIPMENT_CATALOG } from '../data/equipmentCatalog.ts'
import { fixture, act, commit, plan, nextSol, deepFreeze } from './iceboundTestSupport.mjs'

test('a complete ICEBOUND investigation fits the real two-slot sol loop and 10-sol mission', () => {
  let context = fixture()
  const initialResources = { ...context.game.resources }
  const intents = [
    { type: 'RECON' }, { type: 'SELECT_SITE', siteId: 'icebound.lumen-shelf' },
    { type: 'APPROVE_PLAN', plan: plan() }, { type: 'EXECUTE_EXPEDITION' },
  ]
  for (const intent of intents) context = act(context, intent)
  assert.equal(context.game.actionsRemaining, 0)
  assert.equal(iceboundEngine(context, { type: 'COLLECT_SAMPLE', method: 'subsurface-drilling' }).allowed, false)
  context = nextSol(context)
  assert.equal(context.game.actionsRemaining, 2)
  context = act(context, { type: 'COLLECT_SAMPLE', method: 'subsurface-drilling' })
  context = act(context, { type: 'ANALYZE_SAMPLE', sampleId: context.mission.samples[0].id })
  context = act(context, { type: 'GENERATE_REPORT' })
  assert.equal(context.game.sol, 4)
  assert.equal(context.game.missions.icebound, 'completed')
  assert.equal(getMissionStatus(context).completedCount, 6)
  assert.equal(context.mission.report.conclusion, 'supports-accessible-ice')
  assert.equal(context.game.resources.power, initialResources.power - 14)
  assert.equal(context.mission.costs.reduce((sum, cost) => sum + cost.actionSlots, 0), 4)
  assert.ok(Object.values(context.game.resources).every((value) => value >= 0))
  assert.ok(context.mission.report.reconnaissance.length === 3)
  assert.equal(context.mission.report.expeditionObservations.length, 1)
  assert.equal(context.mission.report.expeditionObservations[0].fictional, true)
})
test('central commit rejects replayed or stale proposals, with no partial resource writes', () => {
  const context = fixture()
  const proposal = iceboundEngine(context, { type: 'RECON' })
  const committed = commit(context, proposal)
  const before = structuredClone(committed)
  assert.throws(() => commit(committed, proposal), /stale mission revision/)
  assert.deepEqual(committed, before)
  assert.equal(iceboundEngine(committed, { type: 'RECON' }).proposedEffects, null)
  assert.throws(() => commit(nextSol(context), proposal), /stale sol/)
  const depleted = { ...context, game: { ...context.game, resources: { ...context.game.resources, power: 0 } } }
  assert.throws(() => commit(depleted, proposal))
  assert.equal(depleted.mission.revision, 0)
})
test('every rejected operation has no proposed gameplay effects or event', () => {
  const context = fixture()
  for (const intent of [
    { type: 'SELECT_SITE', siteId: 'icebound.lumen-shelf' }, { type: 'APPROVE_PLAN', plan: plan() },
    { type: 'EXECUTE_EXPEDITION' }, { type: 'COLLECT_SAMPLE', method: 'subsurface-drilling' },
    { type: 'ANALYZE_SAMPLE', sampleId: 'none' }, { type: 'GENERATE_REPORT' },
  ]) {
    const result = iceboundEngine(context, intent)
    assert.equal(result.allowed, false)
    assert.equal(result.proposedEffects, null)
    assert.equal(result.event, null)
    assert.ok(result.code && result.reason)
  }
})
test('stable hook IDs and source references are valid and all public scenarios are fictional', () => {
  const sources = new Set(ICEBOUND_SCIENCE_SOURCES.map((source) => source.id))
  for (const objective of ICEBOUND_OBJECTIVES) assert.ok(objective.scienceReferenceIds.every((id) => sources.has(id)))
  assert.ok(ICEBOUND_SITES.every((site) => site.fictional && site.hazards.length && site.scienceReferenceIds.every((id) => sources.has(id))))
  assert.ok(ICEBOUND_SCENARIOS.every((scenario) => scenario.fictional))
  const result = iceboundEngine(fixture(), { type: 'RECON' })
  assert.equal(result.event.objectiveId, 'icebound.recon')
  assert.ok(result.event.eventId && result.event.feedbackId)
  assert.ok(result.event.scienceReferenceIds.every((id) => sources.has(id)))
})
test('distinct mission runs have distinct proposal/sample namespaces', () => {
  const first = fixture()
  const second = { ...first, mission: createIceboundState('different-run') }
  assert.notEqual(iceboundEngine(first, { type: 'RECON' }).resolutionId, iceboundEngine(second, { type: 'RECON' }).resolutionId)
})
test('catalog and confirmed manifest remain intact and no unapproved global store is created', () => {
  const context = deepFreeze(fixture())
  const manifest = structuredClone(context.game.preparation)
  const ids = EQUIPMENT_CATALOG.map((item) => item.id)
  iceboundEngine(context, { type: 'RECON' })
  assert.deepEqual(context.game.preparation, manifest)
  assert.deepEqual(EQUIPMENT_CATALOG.map((item) => item.id), ids)
})
test('invalid game-balancing configuration is rejected instead of granting negative costs', () => {
  const context = { ...fixture(), balance: { ...ICEBOUND_BALANCE, recon: { power: -5 } } }
  assert.equal(iceboundEngine(context, { type: 'RECON' }).code, 'INVALID_BALANCE')
})

test('global objective markers prevent replay even if the mission projection is stale', () => {
  const context = fixture()
  context.game.objectives.push({ id: 'icebound.recon', completed: true })
  assert.equal(iceboundEngine(context, { type: 'RECON' }).proposedEffects, null)
})
