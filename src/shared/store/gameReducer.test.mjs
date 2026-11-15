import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialGameState, gameReducer, getActionSlotCost, INITIAL_GAME_STATE, GameActionRejectedError } from './gameReducer.ts'

function createOutpostState() {
  let state = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  state = gameReducer(state, { type: 'REVIEW_MANIFEST' })
  state = gameReducer(state, { type: 'CONFIRM_MANIFEST' })
  state = gameReducer(state, { type: 'BEGIN_LAUNCH' })
  state = gameReducer(state, { type: 'COMPLETE_LAUNCH' })
  state = gameReducer(state, { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' })
  return state
}

test('creates the initial menu state and resources', () => {
  const state = createInitialGameState()
  assert.equal(state.phase, 'menu')
  assert.equal(state.sol, 0)
  assert.equal(state.completedSol, 0)
  assert.equal(state.actionsRemaining, 3)
  assert.equal(state.actionLimits.maxActionsPerSol, state.actionsRemaining)
  assert.deepEqual(state.resources, { power: 0, oxygen: 0, water: 0, food: 0 })
  assert.deepEqual(state, INITIAL_GAME_STATE)
})

test('starts the game in preparation phase', () => {
  const initial = createInitialGameState()
  const started = gameReducer(initial, { type: 'START_GAME' })
  assert.equal(started.phase, 'preparation')
  assert.equal(initial.phase, 'menu')
})

test('advances a sol with exactly one unit consumed per resource', () => {
  const started = createOutpostState()
  const advanced = gameReducer(started, { type: 'ADVANCE_SOL' })
  assert.equal(started.sol, 1)
  assert.equal(started.completedSol, 0)
  assert.equal(advanced.sol, 2)
  assert.equal(advanced.completedSol, 1)
  assert.equal(advanced.actionsRemaining, 3)
  for(const key of Object.keys(started.resources))assert.equal(advanced.resources[key],started.resources[key]-1)
})

test('major action categories cost one slot while inspection and allocation are free', () => {
  for (const category of ['operation', 'repair', 'event-response', 'exploration']) {
    assert.equal(getActionSlotCost(category), 1)
  }
  assert.equal(getActionSlotCost('facility-inspection'), 0)
  assert.equal(getActionSlotCost('power-allocation'), 0)
})

test('spends one slot for each valid major action in the outpost', () => {
  const outpost = { ...createInitialGameState(), phase: 'outpost' }
  const afterFirst = gameReducer(outpost, {
    type: 'SPEND_ACTION_SLOT',
    actionId: 'repair-array-sol-1',
    category: 'repair',
  })
  const afterSecond = gameReducer(afterFirst, {
    type: 'SPEND_ACTION_SLOT',
    actionId: 'icebound-recon-sol-1',
    category: 'exploration',
  })

  assert.equal(outpost.actionsRemaining, 3)
  assert.equal(afterFirst.actionsRemaining, 2)
  assert.equal(afterSecond.actionsRemaining, 1)
  assert.deepEqual(afterSecond.spentActionIds, ['repair-array-sol-1', 'icebound-recon-sol-1'])
})

test('rejected major actions leave action slots unchanged', () => {
  const outpost = { ...createInitialGameState(), phase: 'outpost' }
  const afterOne = gameReducer(outpost, {
    type: 'SPEND_ACTION_SLOT',
    actionId: 'repair-array-sol-1',
    category: 'repair',
  })

  assert.throws(
    () => gameReducer(afterOne, {
      type: 'SPEND_ACTION_SLOT',
      actionId: 'repair-array-sol-1',
      category: 'repair',
    }),
    /already been completed/,
  )
  assert.throws(
    () => gameReducer(afterOne, {
      type: 'SPEND_ACTION_SLOT',
      actionId: '   ',
      category: 'operation',
    }),
    /action ID is required/,
  )
  const outsideOutpost = { ...afterOne, phase: 'launch' }
  assert.throws(
    () => gameReducer(outsideOutpost, {
      type: 'SPEND_ACTION_SLOT',
      actionId: 'invalid-phase-action',
      category: 'operation',
    }),
    /only available at the outpost/,
  )
  assert.equal(afterOne.actionsRemaining, 2)
  assert.deepEqual(afterOne.spentActionIds, ['repair-array-sol-1'])
  assert.equal(outsideOutpost.actionsRemaining, 2)
})

test('rejects a fourth major action without consuming another slot', () => {
  const outpost = { ...createInitialGameState(), phase: 'outpost' }
  const afterOne = gameReducer(outpost, {
    type: 'SPEND_ACTION_SLOT',
    actionId: 'action-1',
    category: 'operation',
  })
  const afterTwo = gameReducer(afterOne, {
    type: 'SPEND_ACTION_SLOT',
    actionId: 'action-2',
    category: 'event-response',
  })

  const afterThree = gameReducer(afterTwo, { type: 'SPEND_ACTION_SLOT', actionId: 'action-3', category: 'exploration' })
  assert.throws(
    () => gameReducer(afterThree, {
      type: 'SPEND_ACTION_SLOT',
      actionId: 'action-4',
      category: 'exploration',
    }),
    /no major actions remain/,
  )
  assert.equal(afterThree.actionsRemaining, 0)
  assert.equal(afterThree.spentActionIds.length, 3)
})

test('successful sol advancement resets action slots to three', () => {
  const outpost = createOutpostState()
  const spent = gameReducer(outpost, {
    type: 'SPEND_ACTION_SLOT',
    actionId: 'action-1',
    category: 'operation',
  })
  const advanced = gameReducer(spent, { type: 'ADVANCE_SOL' })

  assert.equal(advanced.sol, 2)
  assert.equal(advanced.actionsRemaining, 3)
})

test('enforces the maximum sol', () => {
  const started = createOutpostState()
  const atLimit = { ...started, sol: started.actionLimits.maxSol, completedSol: started.actionLimits.maxSol, actionsRemaining: 0 }
  assert.throws(
    () => gameReducer(atLimit, { type: 'ADVANCE_SOL' }),
    GameActionRejectedError,
  )
  assert.equal(atLimit.actionsRemaining, 0)
})

test('caps the mission at ten sols', () => {
  const started = createOutpostState()
  assert.equal(started.actionLimits.maxSol, 10)

  const solNine = { ...started, sol: 9, completedSol: 9 }
  const solTen = gameReducer(solNine, { type: 'ADVANCE_SOL' })

  assert.equal(solTen.sol, 10)
  assert.equal(solTen.completedSol, 9)
  assert.equal(gameReducer(solTen, { type: 'ENTER_DEBRIEF' }).feedback.kind, 'error')
  const finished = gameReducer(solTen, { type: 'ADVANCE_SOL' })
  assert.equal(finished.completedSol, 10)
  assert.equal(finished.sol, 10)
  assert.throws(() => gameReducer(finished, { type: 'ADVANCE_SOL' }), /maximum sol reached/)
})

test('rejects advancing after the game reaches a terminal outcome', () => {
  const started = createOutpostState()
  const terminal = { ...started, outcome: 'failure' }
  assert.throws(() => gameReducer(terminal, { type: 'ADVANCE_SOL' }), /game is terminal/)
})

test('rejects starting outside the menu phase', () => {
  const started = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  const rejected = gameReducer(started, { type: 'START_GAME' })
  assert.equal(rejected.phase, 'preparation')
  assert.equal(rejected.feedback?.kind, 'error')
  assert.match(rejected.feedback?.message ?? '', /only available during menu/)
})

test('reset returns a fresh initial state', () => {
  const started = createOutpostState()
  const advanced = gameReducer(started, { type: 'ADVANCE_SOL' })
  const reset = gameReducer(advanced, { type: 'RESET_GAME' })
  assert.deepEqual(reset, INITIAL_GAME_STATE)
  assert.notEqual(reset.resources, INITIAL_GAME_STATE.resources)
})

test('does not mutate existing states', () => {
  const initial = createInitialGameState()
  const originalResources = initial.resources
  const started = gameReducer(initial, { type: 'START_GAME' })
  assert.equal(initial.phase, 'menu')
  assert.equal(initial.sol, 0)
  assert.equal(initial.resources, originalResources)
  assert.equal(started.resources, originalResources)
})

test('rejects actions that are not implemented', () => {
  const state = createInitialGameState()
  assert.throws(
    () => gameReducer(state, { type: 'UPDATE_RESOURCES', deltas: { power: -10 } }),
    /action is not implemented/,
  )
  assert.equal(state.resources.power, 0)
})

