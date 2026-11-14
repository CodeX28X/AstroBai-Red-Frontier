import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialGameState, gameReducer, INITIAL_GAME_STATE } from './gameReducer.ts'

function prepare(state = createInitialGameState()) {
  state = gameReducer(state, { type: 'START_GAME' })
  state = gameReducer(state, { type: 'REVIEW_MANIFEST' })
  state = gameReducer(state, { type: 'CONFIRM_MANIFEST' })
  return state
}

function reachOutpost(state = prepare()) {
  state = gameReducer(state, { type: 'BEGIN_LAUNCH' })
  state = gameReducer(state, { type: 'COMPLETE_LAUNCH' })
  return gameReducer(state, { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' })
}

test('START_GAME enters preparation in the centralized state', () => {
  const initial = createInitialGameState()
  const started = gameReducer(initial, { type: 'START_GAME' })
  assert.equal(started.phase, 'preparation')
  assert.equal(started.preparation.status, 'editing')
  assert.equal(started.preparation.revision, 0)
  assert.equal(initial.phase, 'menu')
})

test('equipment can be added, updated, and removed without changing gameplay resources', () => {
  let state = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  const resources = state.resources
  state = gameReducer(state, { type: 'SET_EQUIPMENT_QUANTITY', equipmentId: 'repair-toolkit', quantity: 1 })
  assert.deepEqual(state.preparation.manifest.optionalCargo, [{ equipmentId: 'repair-toolkit', quantity: 1 }])
  state = gameReducer(state, { type: 'SET_EQUIPMENT_QUANTITY', equipmentId: 'repair-toolkit', quantity: 2 })
  assert.equal(state.preparation.manifest.optionalCargo[0]?.quantity, 2)
  state = gameReducer(state, { type: 'SET_EQUIPMENT_QUANTITY', equipmentId: 'repair-toolkit', quantity: 0 })
  assert.deepEqual(state.preparation.manifest.optionalCargo, [])
  assert.equal(state.preparation.revision, 3)
  assert.equal(state.resources, resources)
})

test('unknown equipment is rejected with feedback and no preparation changes', () => {
  const started = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  const rejected = gameReducer(started, { type: 'SET_EQUIPMENT_QUANTITY', equipmentId: 'not-in-catalog', quantity: 1 })
  assert.deepEqual(rejected.preparation, started.preparation)
  assert.deepEqual(rejected.resources, started.resources)
  assert.equal(rejected.feedback?.kind, 'error')
  assert.match(rejected.feedback?.message ?? '', /not in the catalog/)
})

test('Mission Control review stores structured feedback and capacity blockers prevent confirmation', () => {
  let state = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  state = { ...state, preparation: { ...state.preparation, cargoCapacityUnits: 1 } }
  state = gameReducer(state, { type: 'SET_EQUIPMENT_QUANTITY', equipmentId: 'folding-solar-array', quantity: 1 })
  state = gameReducer(state, { type: 'REVIEW_MANIFEST' })
  assert.equal(state.preparation.reviewedRevision, state.preparation.revision)
  assert.equal(state.preparation.latestReview?.allowed, false)
  assert.ok(state.preparation.latestReview?.blockers.length)
  assert.equal(state.feedback?.kind, 'success')
  assert.match(state.feedback?.message ?? '', /Mission Control/)

  const rejected = gameReducer(state, { type: 'CONFIRM_MANIFEST' })
  assert.notEqual(rejected.preparation.status, 'confirmed')
  assert.equal(rejected.feedback?.kind, 'error')
})

test('changing equipment invalidates a prior review and stale reviews cannot be confirmed', () => {
  let state = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  state = gameReducer(state, { type: 'SET_EQUIPMENT_QUANTITY', equipmentId: 'repair-toolkit', quantity: 1 })
  state = gameReducer(state, { type: 'REVIEW_MANIFEST' })
  state = gameReducer(state, { type: 'SET_EQUIPMENT_QUANTITY', equipmentId: 'dust-shield-panels', quantity: 1 })
  assert.equal(state.preparation.latestReview, null)
  assert.equal(state.preparation.reviewedRevision, null)
  state = gameReducer(state, { type: 'REVIEW_MANIFEST' })
  state = {
    ...state,
    preparation: { ...state.preparation, revision: state.preparation.revision + 1 },
  }
  const rejected = gameReducer(state, { type: 'CONFIRM_MANIFEST' })
  assert.equal(rejected.preparation.status, 'reviewed')
  assert.equal(rejected.feedback?.kind, 'error')
  assert.match(rejected.feedback?.message ?? '', /changed after review/)
})

test('a valid manifest confirms once, allows warnings, and cannot be edited afterward', () => {
  let state = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  state = gameReducer(state, { type: 'REVIEW_MANIFEST' })
  assert.ok(state.preparation.latestReview?.recommendations.length)
  state = gameReducer(state, { type: 'CONFIRM_MANIFEST' })
  assert.equal(state.preparation.status, 'confirmed')
  assert.equal(state.preparation.confirmedAtRevision, state.preparation.revision)
  assert.equal(state.resources.power, 5)

  const repeated = gameReducer(state, { type: 'CONFIRM_MANIFEST' })
  assert.equal(repeated.preparation.confirmedAtRevision, state.preparation.confirmedAtRevision)
  assert.equal(repeated.feedback?.kind, 'error')
  const edited = gameReducer(state, { type: 'SET_EQUIPMENT_QUANTITY', equipmentId: 'repair-toolkit', quantity: 1 })
  assert.deepEqual(edited.preparation.manifest, state.preparation.manifest)
  assert.equal(edited.feedback?.kind, 'error')
})

test('launch requires confirmation and transitions directly to landing', () => {
  let state = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  const rejected = gameReducer(state, { type: 'BEGIN_LAUNCH' })
  assert.equal(rejected.phase, 'preparation')
  assert.equal(rejected.feedback?.kind, 'error')

  state = prepare()
  const launched = gameReducer(state, { type: 'BEGIN_LAUNCH' })
  assert.equal(launched.phase, 'launch')
  const landedAtMars = gameReducer(launched, { type: 'COMPLETE_LAUNCH' })
  assert.equal(landedAtMars.phase, 'landing')
  assert.equal(landedAtMars.resources.power, state.resources.power)
  assert.equal(landedAtMars.resources.food, state.resources.food)
})

test('invalid landing sites are rejected; valid landing effects are applied once', () => {
  let state = gameReducer(prepare(), { type: 'BEGIN_LAUNCH' })
  state = gameReducer(state, { type: 'COMPLETE_LAUNCH' })
  const invalid = gameReducer(state, { type: 'SELECT_LANDING_SITE', siteId: 'unknown-site' })
  assert.equal(invalid.phase, 'landing')
  assert.equal(invalid.selectedLandingSite, null)
  assert.deepEqual(invalid.resources, state.resources)
  assert.equal(invalid.feedback?.kind, 'error')

  const outpost = gameReducer(state, { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' })
  assert.equal(outpost.phase, 'outpost')
  assert.equal(outpost.selectedLandingSite, 'landing-safe-zone')
  assert.equal(outpost.resources.power, state.resources.power - 1)
  assert.equal(outpost.resources.oxygen, state.resources.oxygen + 1)
  const duplicate = gameReducer(outpost, { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' })
  assert.equal(duplicate.phase, 'outpost')
  assert.deepEqual(duplicate.resources, outpost.resources)
  assert.equal(duplicate.objectives.length, outpost.objectives.length)
  assert.equal(duplicate.feedback?.kind, 'error')
})

test('invalid resource requirements do not partially commit landing effects', () => {
  let state = gameReducer(prepare(), { type: 'BEGIN_LAUNCH' })
  state = gameReducer(state, { type: 'COMPLETE_LAUNCH' })
  state = { ...state, resources: { ...state.resources, power: 0 } }
  const rejected = gameReducer(state, { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' })
  assert.equal(rejected.phase, 'landing')
  assert.equal(rejected.selectedLandingSite, null)
  assert.deepEqual(rejected.objectives, state.objectives)
  assert.deepEqual(rejected.resources, state.resources)
  assert.equal(rejected.feedback?.kind, 'error')
})

test('outpost sol progression and action limits remain intact; completed Sol 10 permits debrief', () => {
  let state = reachOutpost()
  const initialResources = state.resources
  state = gameReducer(state, { type: 'SPEND_ACTION_SLOT', actionId: 'sol-1-action-1', category: 'operation' })
  state = gameReducer(state, { type: 'SPEND_ACTION_SLOT', actionId: 'sol-1-action-2', category: 'repair' })
  assert.equal(state.actionsRemaining, 0)
  assert.throws(() => gameReducer(state, {
    type: 'SPEND_ACTION_SLOT', actionId: 'sol-1-action-3', category: 'exploration',
  }), /no major actions remain/)

  for (let sol = 1; sol <= 10; sol += 1) state = gameReducer(state, { type: 'ADVANCE_SOL' })
  assert.equal(state.sol, 10)
  assert.equal(state.completedSol, 10)
  assert.equal(state.actionsRemaining, 0)
  assert.equal(state.resources, initialResources)
  state = gameReducer(state, { type: 'ENTER_DEBRIEF' })
  assert.equal(state.phase, 'debrief')
  assert.equal(state.outcome, 'success')
  assert.throws(() => gameReducer(state, { type: 'ADVANCE_SOL' }), /game is terminal/)
})

test('terminal outcomes permit debrief before Sol 10 without an Earth-return phase', () => {
  const state = { ...reachOutpost(), outcome: 'failure' }
  const debrief = gameReducer(state, { type: 'ENTER_DEBRIEF' })
  assert.equal(state.phase, 'outpost')
  assert.equal(debrief.phase, 'debrief')
  assert.equal(debrief.outcome, 'failure')
  assert.ok(!['travel', 'return'].includes(debrief.phase))
})

test('reset restores all mission, preparation, sol, resource, and feedback state', () => {
  const altered = gameReducer(reachOutpost(), { type: 'ADVANCE_SOL' })
  const reset = gameReducer(altered, { type: 'RESET_GAME' })
  assert.deepEqual(reset, INITIAL_GAME_STATE)
  assert.notEqual(reset.preparation, INITIAL_GAME_STATE.preparation)
})

test('invalid mission transitions preserve gameplay data and expose readable feedback', () => {
  const initial = createInitialGameState()
  const rejected = gameReducer(initial, { type: 'COMPLETE_LAUNCH' })
  assert.equal(rejected.phase, initial.phase)
  assert.deepEqual(rejected.resources, initial.resources)
  assert.deepEqual(rejected.objectives, initial.objectives)
  assert.equal(rejected.feedback?.kind, 'error')
  assert.match(rejected.feedback?.message ?? '', /only available during launch/)
})

test('mission transitions reject resource balances outside the safe range atomically', () => {
  const initial = createInitialGameState()
  const unsafe = { ...initial, resources: { ...initial.resources, power: 101 } }
  const rejected = gameReducer(unsafe, { type: 'START_GAME' })
  assert.equal(rejected.phase, 'menu')
  assert.deepEqual(rejected.resources, unsafe.resources)
  assert.deepEqual(rejected.objectives, unsafe.objectives)
  assert.equal(rejected.feedback?.kind, 'error')
  assert.match(rejected.feedback?.message ?? '', /power balance is outside its safe range/)
})
