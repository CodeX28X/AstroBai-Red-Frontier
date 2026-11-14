import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialGameState } from '../../../shared/store/gameReducer.ts'
import { resolveStoryDecision, STORY_DECISION_OBJECTIVE_PREFIX } from '../resolveStoryDecision.ts'

function stateAt(phase, completedDecisionIds = []) {
  return {
    ...createInitialGameState(),
    phase,
    objectives: completedDecisionIds.map((id) => ({
      id: `${STORY_DECISION_OBJECTIVE_PREFIX}${id}`,
      completed: true,
    })),
  }
}

test('resolves a launch choice to travel with proposed effects only', () => {
  const state = stateAt('launch')
  const result = resolveStoryDecision(state, 'launch-extra-oxygen')
  assert.equal(result.allowed, true)
  assert.equal(result.nextPhase, 'travel')
  assert.deepEqual(result.proposedEffects[0]?.resourceDeltas, { oxygen: 20, food: -10 })
  assert.equal(state.phase, 'launch')
  assert.equal(state.resources.oxygen, 100)
})

test('resolves a travel choice to landing', () => {
  const result = resolveStoryDecision(stateAt('travel', ['launch-extra-oxygen']), 'travel-immediate-repair')
  assert.equal(result.allowed, true)
  assert.equal(result.nextPhase, 'landing')
})

test('resolves a landing choice to outpost', () => {
  const result = resolveStoryDecision(
    stateAt('landing', ['launch-extra-oxygen', 'travel-immediate-repair']),
    'landing-safe-zone',
  )
  assert.equal(result.allowed, true)
  assert.equal(result.nextPhase, 'outpost')
})

test('does not mutate a frozen input state for invalid actions', () => {
  const state = stateAt('travel')
  Object.freeze(state.resources)
  Object.freeze(state.objectives)
  Object.freeze(state)
  const result = resolveStoryDecision(state, 'launch-extra-food')
  assert.equal(result.allowed, false)
  assert.deepEqual(state.objectives, [])
})

test('rejected decisions contain no proposed effects', () => {
  const result = resolveStoryDecision(stateAt('launch'), 'not-a-story-option')
  assert.equal(result.allowed, false)
  assert.ok(result.reason)
  assert.deepEqual(result.proposedEffects, [])
  assert.equal(result.nextPhase, null)
})

test('a completed story decision cannot award effects again', () => {
  const state = stateAt('launch', ['launch-extra-oxygen'])
  const result = resolveStoryDecision(state, 'launch-extra-oxygen')
  assert.equal(result.allowed, false)
  assert.match(result.reason ?? '', /already been made/)
  assert.deepEqual(result.proposedEffects, [])
})

test('each accepted outcome includes feedback and a completed decision marker', () => {
  const outcomes = [
    resolveStoryDecision(stateAt('launch'), 'launch-extra-oxygen'),
    resolveStoryDecision(stateAt('travel', ['launch-extra-oxygen']), 'travel-immediate-repair'),
    resolveStoryDecision(
      stateAt('landing', ['launch-extra-oxygen', 'travel-immediate-repair']),
      'landing-safe-zone',
    ),
  ]

  for (const result of outcomes) {
    assert.equal(result.allowed, true)
    assert.ok(result.feedbackId)
    assert.ok(result.completedDecisionId)
    assert.equal(result.proposedEffects[0]?.objectiveChanges[0]?.objectiveId, result.completedDecisionId)
  }
})

test('reports minimum resource requirements and rejects an unaffordable choice without clamping', () => {
  const state = stateAt('launch')
  state.resources.food = 5
  const result = resolveStoryDecision(state, 'launch-extra-oxygen')
  assert.equal(result.allowed, false)
  assert.deepEqual(result.resourceRequirements, { food: 10 })
  assert.match(result.reason ?? '', /needs 10, and you have 5/)
  assert.deepEqual(result.proposedEffects, [])
  assert.equal(state.resources.food, 5)
})
