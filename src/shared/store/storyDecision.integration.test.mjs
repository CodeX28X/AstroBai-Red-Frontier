import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialGameState, gameReducer, INITIAL_GAME_STATE } from './gameReducer.ts'
import { STORY_DECISION_OBJECTIVE_PREFIX } from '../../features/missions/resolveStoryDecision.ts'

function choose(state, optionId) {
  return gameReducer(state, { type: 'CHOOSE_STORY_OPTION', optionId })
}

test('plays the opening story from menu through outpost', () => {
  let state = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  assert.equal(state.phase, 'launch')

  state = choose(state, 'launch-extra-oxygen')
  assert.equal(state.phase, 'travel')
  assert.deepEqual(state.resources, { power: 100, oxygen: 120, water: 100, food: 90 })

  state = choose(state, 'travel-immediate-repair')
  assert.equal(state.phase, 'landing')
  assert.deepEqual(state.resources, { power: 90, oxygen: 125, water: 100, food: 90 })

  state = choose(state, 'landing-safe-zone')
  assert.equal(state.phase, 'outpost')
  assert.deepEqual(state.resources, { power: 85, oxygen: 125, water: 100, food: 85 })
  assert.equal(state.feedback?.kind, 'success')
  assert.equal(state.objectives.length, 3)
  assert.ok(state.objectives.every((objective) => objective.id.startsWith(STORY_DECISION_OBJECTIVE_PREFIX)))
})

test('repeating a choice does not apply its effects twice', () => {
  const started = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  const afterChoice = choose(started, 'launch-extra-oxygen')
  const repeated = choose(afterChoice, 'launch-extra-oxygen')

  assert.equal(repeated.phase, 'travel')
  assert.deepEqual(repeated.resources, afterChoice.resources)
  assert.equal(repeated.objectives.length, afterChoice.objectives.length)
  assert.equal(repeated.feedback?.kind, 'error')
})

test('invalid decisions preserve gameplay state and provide readable feedback', () => {
  const started = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  const rejected = choose(started, 'not-an-option')

  assert.equal(rejected.phase, started.phase)
  assert.deepEqual(rejected.resources, started.resources)
  assert.deepEqual(rejected.objectives, started.objectives)
  assert.equal(rejected.feedback?.kind, 'error')
  assert.match(rejected.feedback?.message ?? '', /No story decision exists/)
})

test('reset returns the shared store to its initial state', () => {
  const started = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  const changed = choose(started, 'launch-extra-oxygen')
  const reset = gameReducer(changed, { type: 'RESET_GAME' })
  assert.deepEqual(reset, INITIAL_GAME_STATE)
})

test('accepted opening choices never leave a negative resource balance', () => {
  let state = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  state = choose(state, 'launch-extra-food')
  state = choose(state, 'travel-backup-equipment')
  state = choose(state, 'landing-research-zone')

  for (const balance of Object.values(state.resources)) {
    assert.ok(balance >= 0)
  }
})
