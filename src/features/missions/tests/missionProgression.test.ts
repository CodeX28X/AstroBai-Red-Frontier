// @ts-nocheck -- Tests run with Node's native TypeScript stripping.
import assert from 'node:assert/strict'
import test from 'node:test'
import { validateMissionTransition } from '../engine/progression/missionProgression.ts'
import { LANDING_SITES } from '../data/landingSites.ts'
import { createPreparationState, preparationEngine } from '../engine/preparation/preparationEngine.ts'

function context(phase, extra = {}) {
  return { phase, outcome: null, objectives: [], completedSol: 0, preparation: null, ...extra }
}
function confirmedManifest() {
  const initial = createPreparationState({ missionId: 'icebound', baselineId: 'fictional-predeployed-outpost-v1', optionalCargo: [] }, 20)
  const reviewed = preparationEngine(initial, { type: 'REVIEW_MANIFEST' }).state
  return preparationEngine(reviewed, { type: 'CONFIRM_MANIFEST' }).state
}
function applyProposal(state, result) {
  assert.equal(result.allowed, true)
  return { ...state, phase: result.nextPhase, objectives: [
    ...state.objectives,
    ...result.effects.flatMap((effect) => effect.objectiveChanges.map((item) => ({ id: item.objectiveId, completed: item.completed }))),
  ] }
}

test('START_GAME proposes preparation only from menu', () => {
  assert.equal(validateMissionTransition(context('menu'), { type: 'START_GAME' }).nextPhase, 'preparation')
  assert.equal(validateMissionTransition(context('launch'), { type: 'START_GAME' }).code, 'WRONG_PHASE')
})
test('preparation requires a confirmed current manifest', () => {
  assert.equal(validateMissionTransition(context('preparation'), { type: 'BEGIN_LAUNCH' }).code, 'MANIFEST_NOT_CONFIRMED')
  const preparation = confirmedManifest()
  assert.equal(validateMissionTransition(context('preparation', { preparation }), { type: 'BEGIN_LAUNCH' }).nextPhase, 'launch')
  assert.equal(validateMissionTransition(context('preparation', { preparation: { ...preparation, revision: 1 } }), { type: 'BEGIN_LAUNCH' }).allowed, false)
})
test('launch transitions directly to landing', () => {
  assert.equal(validateMissionTransition(context('launch'), { type: 'COMPLETE_LAUNCH' }).nextPhase, 'landing')
})
test('valid site selection proposes outpost and explicit resource requirements', () => {
  const result = validateMissionTransition(context('landing'), { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' })
  assert.equal(result.nextPhase, 'outpost')
  assert.deepEqual(result.resourceRequirements, { power: 1 })
  assert.deepEqual(result.effects[0].resourceDeltas, { power: -1, oxygen: 1 })
})
test('wrong-phase actions cannot skip phases', () => {
  for (const type of ['BEGIN_LAUNCH', 'COMPLETE_LAUNCH', 'SELECT_LANDING_SITE', 'ENTER_DEBRIEF']) {
    assert.equal(validateMissionTransition(context('menu'), { type, siteId: 'landing-safe-zone' }).allowed, false)
  }
})
test('recorded transitions cannot repeat even if the phase is replayed', () => {
  const result = validateMissionTransition(context('launch', {
    objectives: [{ id: 'mission-transition:launch:landing', completed: true }],
  }), { type: 'COMPLETE_LAUNCH' })
  assert.equal(result.code, 'ALREADY_COMPLETED')
  assert.deepEqual(result.effects, [])
})
test('invalid landing choices have no effects', () => {
  const result = validateMissionTransition(context('landing'), { type: 'SELECT_LANDING_SITE', siteId: 'unknown' })
  assert.equal(result.code, 'INVALID_LANDING_SITE')
  assert.deepEqual(result.effects, [])
})
test('landing proposals cannot be awarded twice or changed to another site', () => {
  const original = context('landing')
  const first = validateMissionTransition(original, { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' })
  const applied = applyProposal(original, first)
  assert.equal(validateMissionTransition(applied, { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' }).allowed, false)
  const replayed = validateMissionTransition({ ...applied, phase: 'landing' }, { type: 'SELECT_LANDING_SITE', siteId: 'landing-research-zone' })
  assert.equal(replayed.code, 'ALREADY_COMPLETED')
  assert.deepEqual(replayed.effects, [])
})
test('legacy landing completion markers also prevent duplicate rewards', () => {
  const result = validateMissionTransition(context('landing', { objectives: [{ id: 'story-decision:landing-safe-zone', completed: true }] }), { type: 'SELECT_LANDING_SITE', siteId: 'landing-research-zone' })
  assert.equal(result.code, 'ALREADY_COMPLETED')
})
test('completed Sol 10 permits debrief and evaluates survival success', () => {
  assert.equal(validateMissionTransition(context('outpost', { completedSol: 9 }), { type: 'ENTER_DEBRIEF' }).allowed, false)
  const result = validateMissionTransition(context('outpost', { completedSol: 10 }), { type: 'ENTER_DEBRIEF' })
  assert.equal(result.nextPhase, 'debrief')
  assert.deepEqual(result.debrief, { outcome: 'success', reason: 'sol-10-completed' })
})
test('terminal outcomes permit debrief and override Sol 10 success', () => {
  for (const outcome of ['success', 'failure']) {
    const result = validateMissionTransition(context('outpost', { outcome, completedSol: 10 }), { type: 'ENTER_DEBRIEF' })
    assert.equal(result.debrief.outcome, outcome)
    assert.equal(result.debrief.reason, 'terminal-outcome')
  }
  assert.equal(validateMissionTransition(context('launch', { outcome: 'failure' }), { type: 'COMPLETE_LAUNCH' }).code, 'TERMINAL_OUTCOME')
})
test('complete MVP progression never requires travel or return', () => {
  let state = context('menu', { preparation: confirmedManifest() })
  const phases = ['menu']
  for (const intent of [
    { type: 'START_GAME' }, { type: 'BEGIN_LAUNCH' }, { type: 'COMPLETE_LAUNCH' },
    { type: 'SELECT_LANDING_SITE', siteId: LANDING_SITES[0].id },
  ]) {
    state = applyProposal(state, validateMissionTransition(state, intent))
    phases.push(state.phase)
  }
  state = { ...state, completedSol: 10 }
  state = applyProposal(state, validateMissionTransition(state, { type: 'ENTER_DEBRIEF' }))
  phases.push(state.phase)
  assert.deepEqual(phases, ['menu', 'preparation', 'launch', 'landing', 'outpost', 'debrief'])
})
test('validation is deterministic and does not mutate context', () => {
  const state = context('landing')
  const before = structuredClone(state)
  const intent = { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' }
  assert.deepEqual(validateMissionTransition(state, intent), validateMissionTransition(state, intent))
  assert.deepEqual(state, before)
})
