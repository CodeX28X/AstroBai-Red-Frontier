import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialGameState } from '../../../shared/store/gameReducer.ts'
import { validateStoryDecision } from '../validateStoryDecision.ts'

function stateAt(phase, outcome = null) {
  return { ...createInitialGameState(), phase, outcome }
}

test('accepts a launch decision and returns its proposal', () => {
  const result = validateStoryDecision(stateAt('launch'), 'launch-extra-oxygen', { decidedChapters: [] })
  assert.equal(result.valid, true)
  if (result.valid) {
    assert.equal(result.decision.nextPhase, 'travel')
    assert.deepEqual(result.decision.resourceEffectProposal, { oxygen: 20, food: -10 })
  }
})

test('rejects an unknown option', () => {
  const result = validateStoryDecision(stateAt('launch'), 'not-a-real-option', { decidedChapters: [] })
  assert.deepEqual(result, {
    valid: false,
    reason: 'unknown-option',
    message: 'No story decision exists for option "not-a-real-option".',
  })
})

test('rejects a decision in the wrong phase', () => {
  const result = validateStoryDecision(stateAt('travel'), 'launch-extra-oxygen', { decidedChapters: [] })
  assert.equal(result.valid, false)
  if (!result.valid) assert.equal(result.reason, 'wrong-phase')
})

test('rejects a repeated chapter decision', () => {
  const result = validateStoryDecision(stateAt('launch'), 'launch-extra-food', {
    decidedChapters: ['launch'],
  })
  assert.equal(result.valid, false)
  if (!result.valid) assert.equal(result.reason, 'duplicate-chapter')
})

test('rejects decisions after a terminal outcome', () => {
  const withOutcome = validateStoryDecision(stateAt('launch', 'failure'), 'launch-extra-food', { decidedChapters: [] })
  const debrief = validateStoryDecision(stateAt('debrief'), 'launch-extra-food', { decidedChapters: [] })
  assert.equal(withOutcome.valid, false)
  assert.equal(debrief.valid, false)
  if (!withOutcome.valid) assert.equal(withOutcome.reason, 'terminal-outcome')
  if (!debrief.valid) assert.equal(debrief.reason, 'terminal-outcome')
})

test('checks chapter prerequisites before allowing a choice', () => {
  const withoutLaunch = validateStoryDecision(stateAt('travel'), 'travel-immediate-repair', {
    decidedChapters: [],
  })
  const afterLaunch = validateStoryDecision(stateAt('travel'), 'travel-immediate-repair', {
    decidedChapters: ['launch'],
  })
  assert.equal(withoutLaunch.valid, false)
  assert.equal(afterLaunch.valid, true)
})

test('keeps the supplied game state unchanged', () => {
  const state = stateAt('launch')
  const before = structuredClone(state)
  validateStoryDecision(state, 'launch-extra-oxygen', { decidedChapters: [] })
  assert.deepEqual(state, before)
})
