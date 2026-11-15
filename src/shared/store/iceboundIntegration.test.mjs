import assert from 'node:assert/strict'
import test from 'node:test'
import { maintainOutpost } from './gameplayTestSupport.mjs'
import { createInitialGameState, gameReducer, INITIAL_GAME_STATE } from './gameReducer.ts'
import { applyIceboundResolution } from './iceboundIntegration.ts'
import { selectIceboundContext, selectIceboundView } from './iceboundSelectors.ts'
import { iceboundEngine, reviewExpeditionPlan } from '../../features/missions/engine/icebound/index.ts'

const cargo = ['field-rover', 'repair-toolkit', 'soil-analysis-kit', 'sample-container-set', 'portable-oxygen-kit']
function dispatch(state, intent, expectedMissionRevision) {
  return gameReducer(state, { type: 'ICEBOUND_COMMAND', intent, expectedMissionRevision })
}
function outpost(options = {}, equipment = cargo) {
  let state = createInitialGameState({ runId: 'integration-run', installedCapabilities: ['lab-analysis', 'drilling'], ...options })
  state = gameReducer(state, { type: 'START_GAME' })
  for (const equipmentId of equipment) state = gameReducer(state, { type: 'SET_EQUIPMENT_QUANTITY', equipmentId, quantity: 1 })
  for (const type of ['REVIEW_MANIFEST', 'CONFIRM_MANIFEST', 'BEGIN_LAUNCH', 'COMPLETE_LAUNCH']) state = gameReducer(state, { type })
  return gameReducer(state, { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' })
}
function ready(options = {}, equipment = cargo) {
  let state = outpost(options, equipment)
  while (state.sol < 3) state = gameReducer(maintainOutpost(state), { type: 'ADVANCE_SOL' })
  return state
}
function selected(siteId = 'icebound.lumen-shelf', options = {}) {
  let state = dispatch(ready(options), { type: 'RECON' })
  return dispatch(state, { type: 'SELECT_SITE', siteId })
}
function plan(siteId = 'icebound.lumen-shelf', method = 'rover-only', activity = 'subsurface-drilling') {
  return { siteId, method, activity, equipmentIds: [...cargo], supplies: { power: 2, oxygen: 1, water: 1, food: 1 } }
}
function reviewed(state = selected(), requested = plan()) {
  state = gameReducer(state, { type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan: requested })
  return gameReducer(state, { type: 'REVIEW_ICEBOUND_EXPEDITION_PLAN' })
}
function confirmed(state = reviewed()) {
  return gameReducer(state, { type: 'CONFIRM_ICEBOUND_EXPEDITION_PLAN', revision: state.iceboundPlanning.revision })
}
function sampled(options = {}, siteId = 'icebound.lumen-shelf', method = 'rover-only', activity = 'subsurface-drilling') {
  let state = confirmed(reviewed(selected(siteId, options), plan(siteId, method, activity)))
  state = dispatch(state, { type: 'EXECUTE_EXPEDITION' })
  state = gameReducer(state, { type: 'ADVANCE_SOL' })
  return dispatch(state, { type: 'COLLECT_SAMPLE', method: activity })
}
function gameplay(state) { const { feedback: _feedback, ...rest } = state; return rest }
function assertRejected(before, after) {
  assert.equal(after.feedback?.kind, 'error')
  assert.deepEqual(gameplay(after), gameplay(before))
}
function freeze(value) {
  for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child)
  return Object.freeze(value)
}

test('ICEBOUND initializes locked without starting objectives and readiness is explicit', () => {
  const state = createInitialGameState()
  assert.deepEqual(state.icebound.completedObjectives, [])
  assert.equal(state.missions.icebound, 'locked')
  assert.equal(selectIceboundView(state).activeObjective, null)
  assert.deepEqual(state.appliedResolutionIds, [])
  assert.ok(['recon','rover','eva','surface-sampling','drilling','sample-handling','lab-analysis'].every(capability => state.iceboundReadiness.baselineCapabilities.includes(capability)))
  assert.equal(state.iceboundReadiness.laboratoryOperational, false)
})
test('landing deploys exactly confirmed equipment and commissions the declared baseline', () => {
  const state = outpost()
  assert.equal(state.facilities.habitat, 'operational')
  assert.equal(state.iceboundReadiness.communicationsReady, true)
  assert.deepEqual(state.iceboundReadiness.deployedEquipment.map((item) => item.equipmentId), state.preparation.manifest.optionalCargo.map((item) => item.equipmentId))
  const empty = outpost({}, [])
  assert.equal(empty.iceboundReadiness.roverOperational, true)
  assert.deepEqual(empty.iceboundReadiness.deployedEquipment, [])
})
test('phase, Sol 3 and prerequisites guard the same engine through the store', () => {
  const initial = createInitialGameState()
  assertRejected(initial, dispatch(initial, { type: 'RECON' }))
  const early = outpost()
  assertRejected(early, dispatch(early, { type: 'RECON' }))
  const state = ready()
  assert.equal(selectIceboundView(state).objectives.find((item) => item.id === 'icebound.recon').eligible, true)
  assertRejected(state, dispatch(state, { type: 'SELECT_SITE', siteId: 'icebound.lumen-shelf' }))
  assertRejected(state, dispatch(state, { type: 'EXECUTE_EXPEDITION' }))
  assertRejected(state, dispatch(state, { type: 'GENERATE_REPORT' }))
})
test('recon stores D observations and charges its resources and action once', () => {
  const state = ready()
  const proposal = iceboundEngine(selectIceboundContext(state), { type: 'RECON' })
  const next = dispatch(state, { type: 'RECON' })
  assert.deepEqual(next.icebound, proposal.proposedEffects.nextMissionState)
  assert.equal(next.resources.power, state.resources.power - 1)
  assert.equal(next.actionsRemaining, 2)
  assert.equal(next.icebound.observations.length, 3)
  assert.equal(next.iceboundEvents.length, 1)
  assert.equal(next.appliedResolutionIds.length, 1)
  assert.equal(next.missions.icebound, 'active')
  assertRejected(next, dispatch(next, { type: 'RECON' }))
})
test('operational readiness still blocks recon with no deductions', () => {
  for (const state of [{ ...ready(), iceboundReadiness: { ...ready().iceboundReadiness, roverOperational: false } }]) {
    assertRejected(state, dispatch(state, { type: 'RECON' }))
  }
})
test('site selection stores D site ID and cannot be changed or repeated', () => {
  const state = dispatch(ready(), { type: 'RECON' })
  assertRejected(state, dispatch(state, { type: 'SELECT_SITE', siteId: 'invalid' }))
  const next = dispatch(state, { type: 'SELECT_SITE', siteId: 'icebound.lumen-shelf' })
  assert.equal(next.icebound.selectedSiteId, 'icebound.lumen-shelf')
  assertRejected(next, dispatch(next, { type: 'SELECT_SITE', siteId: 'icebound.cinder-flats' }))
})
test('plan review uses D findings, costs no resources/slots, and does not complete objectives', () => {
  const state = selected()
  const next = reviewed(state)
  assert.deepEqual(next.resources, state.resources)
  assert.equal(next.actionsRemaining, state.actionsRemaining)
  assert.deepEqual(next.icebound, state.icebound)
  assert.equal(next.iceboundPlanning.reviewedRevision, next.iceboundPlanning.revision)
  assert.deepEqual(next.iceboundPlanning.review, reviewExpeditionPlan(selectIceboundContext(state), plan()))
  assert.equal(next.icebound.approvedPlan, null)
  assert.equal(next.appliedResolutionIds.length, state.appliedResolutionIds.length)
})
test('editing a plan increments revision, invalidates review, and stale confirmation is rejected', () => {
  const state = reviewed()
  const revision = state.iceboundPlanning.revision
  const unchanged = gameReducer(state, { type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan: plan() })
  assert.equal(unchanged, state)
  const edited = gameReducer(state, { type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan: plan('icebound.lumen-shelf', 'combined') })
  assert.equal(edited.iceboundPlanning.revision, revision + 1)
  assert.equal(edited.iceboundPlanning.review, null)
  assertRejected(edited, gameReducer(edited, { type: 'CONFIRM_ICEBOUND_EXPEDITION_PLAN', revision }))
  assertRejected(edited, gameReducer(edited, { type: 'CONFIRM_ICEBOUND_EXPEDITION_PLAN', revision: revision + 1 }))
})
test('critical blockers prevent confirmation; warnings and recommendations do not', () => {
  const blocked = reviewed(selected(), { ...plan(), equipmentIds: ['unknown-tool'] })
  assert.equal(blocked.iceboundPlanning.review.allowed, false)
  assertRejected(blocked, confirmed(blocked))
  const state = reviewed()
  assert.ok(state.iceboundPlanning.review.warnings.length)
  const next = confirmed(state)
  assert.ok(next.icebound.approvedPlan)
  assert.equal(next.iceboundPlanning.draft, null)
  assert.equal(next.iceboundPlanning.confirmedAtRevision, next.iceboundPlanning.revision)
  assert.equal(next.actionsRemaining, state.actionsRemaining)
  assert.deepEqual(next.resources, state.resources)
  assertRejected(next, confirmed(next))
  assertRejected(next, gameReducer(next, { type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan: plan() }))
})
test('confirmation rechecks readiness changed since review', () => {
  const state = reviewed()
  const changed = { ...state, resources: { ...state.resources, power: 0 } }
  assertRejected(changed, confirmed(changed))
})
test('clients cannot bypass review by submitting D APPROVE_PLAN directly or fabricated success', () => {
  const state = selected()
  assertRejected(state, dispatch(state, { type: 'APPROVE_PLAN', plan: plan() }))
  assertRejected(state, gameReducer(state, { type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan: {} }))
  assertRejected(state, dispatch(state, { type: 'COLLECT_SAMPLE', method: 'invented-method', success: true }))
})
for (const method of ['rover-only', 'astronaut-team', 'combined']) {
  test(`a confirmed ${method} expedition executes through actual shared actions`, () => {
    const state = confirmed(reviewed(selected(), plan('icebound.lumen-shelf', method)))
    const proposal = iceboundEngine(selectIceboundContext(state), { type: 'EXECUTE_EXPEDITION' })
    const next = dispatch(state, { type: 'EXECUTE_EXPEDITION' })
    assert.equal(next.icebound.expedition.plan.method, method)
    assert.equal(next.actionsRemaining, 1)
    assert.deepEqual(next.icebound, proposal.proposedEffects.nextMissionState)
    assertRejected(next, dispatch(next, { type: 'EXECUTE_EXPEDITION' }))
  })
}
test('execution revalidates resource, action, equipment, crew and hazard changes after confirmation', () => {
  const state = confirmed(reviewed(selected(), plan('icebound.lumen-shelf', 'combined')))
  const changedStates = [
    { ...state, resources: { ...state.resources, power: 0 } },
    { ...state, actionsRemaining: 0 },
    { ...state, iceboundReadiness: { ...state.iceboundReadiness, crewSafeForEva: false } },
    { ...state, iceboundReadiness: { ...state.iceboundReadiness, roverEnergyReady: false } },
    { ...state, iceboundReadiness: { ...state.iceboundReadiness, weather: 'blocked' } },
    { ...state, iceboundReadiness: { ...state.iceboundReadiness, deployedEquipment: state.iceboundReadiness.deployedEquipment.map((item) => item.equipmentId === 'field-rover' ? { ...item, status: 'offline' } : item) } },
  ]
  for (const changed of changedStates) assertRejected(changed, dispatch(changed, { type: 'EXECUTE_EXPEDITION' }))
  assert.ok(dispatch(state, { type: 'EXECUTE_EXPEDITION' }).icebound.expedition)
})
test('sampling and analysis are separate operations across C sol resets', () => {
  const executed = dispatch(confirmed(), { type: 'EXECUTE_EXPEDITION' })
  assert.equal(executed.actionsRemaining, 1)
  assert.deepEqual(executed.icebound.samples, [])
  assert.equal(dispatch(executed, { type: 'COLLECT_SAMPLE', method: 'subsurface-drilling' }).icebound.samples.length, 1)
  const advanced = gameReducer(executed, { type: 'ADVANCE_SOL' })
  assert.deepEqual(advanced.icebound, executed.icebound)
  for(const key of Object.keys(executed.resources))assert.equal(advanced.resources[key],executed.resources[key]-1)
  assert.equal(advanced.actionsRemaining, 3)
  const next = dispatch(advanced, { type: 'COLLECT_SAMPLE', method: 'subsurface-drilling' })
  assert.equal(next.icebound.samples.length, 1)
  assert.deepEqual(next.icebound.analyses, [])
  assert.equal(next.icebound.samples[0].expeditionId, executed.icebound.expedition.id)
  assertRejected(next, dispatch(next, { type: 'COLLECT_SAMPLE', method: 'subsurface-drilling' }))
})
for (const [site, method, activity, scenarioId, classification] of [
  ['icebound.lumen-shelf', 'rover-only', 'subsurface-drilling', 'icebound.training-v1', 'supports-accessible-ice'],
  ['icebound.lumen-shelf', 'rover-only', 'subsurface-drilling', 'icebound.dry-v1', 'no-accessible-ice-detected'],
  ['icebound.echo-ridge', 'astronaut-team', 'subsurface-drilling', 'icebound.training-v1', 'inconclusive'],
]) {
  test(`store preserves D scientific classification: ${classification}`, () => {
    let state = sampled({ scenarioId }, site, method, activity)
    const intent = { type: 'ANALYZE_SAMPLE', sampleId: state.icebound.samples[0].id }
    const proposal = iceboundEngine(selectIceboundContext(state), intent)
    state = dispatch(state, intent)
    assert.deepEqual(state.icebound.analyses, proposal.proposedEffects.nextMissionState.analyses)
    assert.equal(state.icebound.analyses[0].classification, classification)
    assert.equal(state.outcome, null)
    assertRejected(state, dispatch(state, intent))
    state = dispatch(state, { type: 'GENERATE_REPORT' })
    assert.equal(state.missions.icebound, 'completed')
    assert.equal(state.icebound.report.completionStatus, 'complete')
    assert.equal(state.icebound.report.conclusion, classification)
    assert.equal(state.outcome, null)
    assertRejected(state, dispatch(state, { type: 'GENERATE_REPORT' }))
  })
}
test('standard lab is installed; an actual lab fault still blocks analysis', () => {
  const readyState = sampled({ installedCapabilities: [] }, 'icebound.lumen-shelf', 'rover-only', 'surface-sampling')
  assert.equal(readyState.iceboundReadiness.laboratoryOperational, true)
  const state = { ...readyState, iceboundReadiness: { ...readyState.iceboundReadiness, laboratoryOperational: false } }
  assertRejected(state, dispatch(state, { type: 'ANALYZE_SAMPLE', sampleId: state.icebound.samples[0].id }))
  assert.equal(selectIceboundView(state).report.completionStatus, 'incomplete')
  assert.equal(selectIceboundView(state).report.conclusion, null)
})
test('analysis rejects missing samples, unavailable lab and insufficient current power', () => {
  const state = sampled()
  for (const changed of [
    { ...state, resources: { ...state.resources, power: 0 } },
    { ...state, iceboundReadiness: { ...state.iceboundReadiness, laboratoryOperational: false } },
    { ...state, facilities: { ...state.facilities, habitat: 'offline' } },
  ]) assertRejected(changed, dispatch(changed, { type: 'ANALYZE_SAMPLE', sampleId: state.icebound.samples[0].id }))
  assertRejected(state, dispatch(state, { type: 'ANALYZE_SAMPLE', sampleId: 'unknown' }))
})
test('incomplete analysis exposes D diagnostic feedback without a scientific negative or costs', () => {
  const state = sampled()
  const unusable = { ...state, icebound: { ...state.icebound, samples: state.icebound.samples.map((sample) => ({ ...sample, status: 'unusable' })) } }
  const result = dispatch(unusable, { type: 'ANALYZE_SAMPLE', sampleId: unusable.icebound.samples[0].id })
  assertRejected(unusable, result)
  assert.equal(result.feedback.analysis.classification, 'analysis-incomplete')
  assert.equal(selectIceboundView(result).report.conclusion, null)
})
test('atomic applicator rejects stale/replayed effects, resource underflows and late objective conflicts', () => {
  const state = ready()
  const proposal = iceboundEngine(selectIceboundContext(state), { type: 'RECON' })
  const committed = applyIceboundResolution(state, proposal)
  assertRejected(committed, applyIceboundResolution(committed, proposal))
  const staleSol = gameReducer(state, { type: 'ADVANCE_SOL' })
  assertRejected(staleSol, applyIceboundResolution(staleSol, proposal))
  for (const value of [-1000, Number.NaN]) {
    const invalid = structuredClone(proposal)
    invalid.proposedEffects.resourceDeltas.power = value
    assertRejected(state, applyIceboundResolution(state, invalid))
  }
  for (const alter of [
    (effect) => { effect.actionSlotCost = -1 },
    (effect) => { effect.actionSlotCost = 0.5 },
    (effect) => { effect.resourceDeltas.inventedResource = -1 },
    (effect) => { effect.equipmentStatusChanges = [{ equipmentId: 'not-in-cargo', status: 'offline' }] },
  ]) {
    const invalid = structuredClone(proposal)
    alter(invalid.proposedEffects)
    assertRejected(state, applyIceboundResolution(state, invalid))
  }
  const conflicted = { ...state, objectives: [...state.objectives, { id: 'icebound.recon', completed: true }] }
  assertRejected(conflicted, applyIceboundResolution(conflicted, proposal))
  const duplicate = { ...state, appliedResolutionIds: [proposal.resolutionId] }
  assertRejected(duplicate, applyIceboundResolution(duplicate, proposal))
})
test('no action allows negative slots, stale command revisions, or arbitrary runtime actions', () => {
  const state = ready()
  assertRejected(state, dispatch(state, { type: 'RECON' }, -1))
  const used = { ...state, actionsRemaining: 0 }
  assertRejected(used, dispatch(used, { type: 'RECON' }))
  assert.throws(() => gameReducer(state, { type: 'APPLY_FABRICATED_SUCCESS', success: true }), /unsupported action/)
})
test('terminal outcomes and debrief reject every new ICEBOUND operation without game changes', () => {
  for (const state of [{ ...ready(), outcome: 'failure' }, { ...ready(), phase: 'debrief' }]) {
    for (const intent of [{ type: 'RECON' }, { type: 'EXECUTE_EXPEDITION' }, { type: 'GENERATE_REPORT' }]) assertRejected(state, dispatch(state, intent))
    assertRejected(state, gameReducer(state, { type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan: plan() }))
  }
})
test('reset clears progress, review, samples, reports, events, costs and applied IDs', () => {
  let state = sampled()
  state = dispatch(state, { type: 'ANALYZE_SAMPLE', sampleId: state.icebound.samples[0].id })
  state = dispatch(state, { type: 'GENERATE_REPORT' })
  const reset = gameReducer(state, { type: 'RESET_GAME' })
  assert.deepEqual(reset, createInitialGameState({ runId: 'integration-run', installedCapabilities: ['lab-analysis', 'drilling'] }))
  assert.deepEqual(gameReducer(createInitialGameState(), { type: 'RESET_GAME' }), INITIAL_GAME_STATE)
})
test('full reducer-only ICEBOUND playthrough completes by Sol 4 and preserves the ten-sol debrief', () => {
  let state = sampled()
  state = dispatch(state, { type: 'ANALYZE_SAMPLE', sampleId: state.icebound.samples[0].id })
  state = dispatch(state, { type: 'GENERATE_REPORT' })
  assert.equal(state.sol, 4)
  assert.equal(state.actionsRemaining, 1)
  assert.deepEqual(state.resources, { power: 3, oxygen: 7, water: 6, food: 6 })
  assert.equal(state.appliedResolutionIds.length, 7)
  assert.equal(state.iceboundEvents.length, 7)
  assert.equal(state.spentActionIds.filter(id=>id.startsWith('icebound:')).length, 4)
  assert.equal(state.icebound.completedObjectives.length, 6)
  assert.equal(selectIceboundView(state).status, 'completed')
  const report = state.icebound.report
  while (state.completedSol < 10) state = gameReducer(maintainOutpost(state), { type: 'ADVANCE_SOL' })
  assert.equal(state.icebound.report, report)
  state = gameReducer(state, { type: 'ENTER_DEBRIEF' })
  assert.equal(state.phase, 'debrief')
  assert.equal(state.outcome, 'success')
  assert.equal(state.icebound.report, report)
})
test('success and rejection are deterministic, immutable and do not alias client plans', () => {
  const state = freeze(ready())
  const before = structuredClone(state)
  assert.deepEqual(dispatch(state, { type: 'RECON' }), dispatch(state, { type: 'RECON' }))
  assert.deepEqual(state, before)
  const requested = plan()
  const drafted = gameReducer(selected(), { type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan: requested })
  requested.equipmentIds.pop()
  requested.supplies.power = 0
  assert.deepEqual(drafted.iceboundPlanning.draft, plan())
})
