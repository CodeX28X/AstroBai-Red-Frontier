import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialGameState, gameReducer, INITIAL_GAME_STATE, GameActionRejectedError } from './gameReducer.ts'

test('creates the initial menu state and resources', () => {
  const state = createInitialGameState()
  assert.equal(state.phase, 'menu')
  assert.equal(state.sol, 0)
  assert.deepEqual(state.resources, { power: 100, oxygen: 100, water: 100, food: 100 })
  assert.deepEqual(state, INITIAL_GAME_STATE)
})

test('starts the game in launch phase', () => {
  const initial = createInitialGameState()
  const started = gameReducer(initial, { type: 'START_GAME' })
  assert.equal(started.phase, 'launch')
  assert.equal(initial.phase, 'menu')
})

test('advances a sol without changing resources', () => {
  const started = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  const advanced = gameReducer(started, { type: 'ADVANCE_SOL' })
  assert.equal(advanced.sol, 1)
  assert.deepEqual(advanced.resources, started.resources)
})

test('enforces the maximum sol', () => {
  const started = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  const atLimit = { ...started, sol: started.actionLimits.maxSol }
  assert.throws(
    () => gameReducer(atLimit, { type: 'ADVANCE_SOL' }),
    GameActionRejectedError,
  )
})

test('caps the mission at ten sols', () => {
  const started = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  assert.equal(started.actionLimits.maxSol, 10)

  const solNine = { ...started, sol: 9 }
  const solTen = gameReducer(solNine, { type: 'ADVANCE_SOL' })

  assert.equal(solTen.sol, 10)
  assert.throws(() => gameReducer(solTen, { type: 'ADVANCE_SOL' }), /maximum sol reached/)
})

test('rejects advancing after the game reaches a terminal outcome', () => {
  const started = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  const terminal = { ...started, outcome: 'failure' }
  assert.throws(() => gameReducer(terminal, { type: 'ADVANCE_SOL' }), /game is terminal/)
})

test('rejects starting outside the menu phase', () => {
  const started = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  assert.throws(() => gameReducer(started, { type: 'START_GAME' }), /only start from menu/)
})

test('reset returns a fresh initial state', () => {
  const started = gameReducer(createInitialGameState(), { type: 'START_GAME' })
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
  assert.equal(state.resources.power, 100)
})

