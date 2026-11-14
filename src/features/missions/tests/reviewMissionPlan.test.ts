// @ts-nocheck -- Node's built-in test runner supplies these test module types at runtime.
import assert from 'node:assert/strict'
import test from 'node:test'
import { reviewMissionPlan } from '../engine/preparation/reviewMissionPlan.ts'

function manifest(optionalCargo = []) {
  return {
    missionId: 'icebound',
    baselineId: 'fictional-predeployed-outpost-v1',
    optionalCargo,
  }
}

function codes(items) {
  return items.map((item) => item.code)
}

const wellPreparedCargo = [
  { equipmentId: 'folding-solar-array', quantity: 1 },
  { equipmentId: 'portable-battery-bank', quantity: 1 },
  { equipmentId: 'repair-toolkit', quantity: 1 },
  { equipmentId: 'spare-parts-crate', quantity: 1 },
  { equipmentId: 'dust-shield-panels', quantity: 1 },
  { equipmentId: 'soil-analysis-kit', quantity: 1 },
  { equipmentId: 'sample-container-set', quantity: 1 },
]

test('a valid mission plan is allowed and keeps critical assumptions separate', () => {
  const review = reviewMissionPlan(manifest(), 20)
  assert.equal(review.allowed, true)
  assert.deepEqual(review.blockers, [])
  assert.equal(review.criticalReadinessAssumptions[0]?.severity, 'assumption')
  assert.ok(review.criticalReadinessAssumptions[0]?.explanation.includes('not a real flight-readiness certification'))
})

test('an overweight mission receives a blocker and cannot be confirmed', () => {
  const review = reviewMissionPlan(manifest([
    { equipmentId: 'repair-toolkit', quantity: 1 },
  ]), 1)
  assert.equal(review.allowed, false)
  assert.ok(codes(review.blockers).includes('manifest-capacity-exceeded'))
})

test('a missing required dependency is a blocker', () => {
  const review = reviewMissionPlan(manifest([
    { equipmentId: 'portable-battery-bank', quantity: 1 },
  ]), 10)
  assert.equal(review.allowed, false)
  assert.ok(codes(review.blockers).includes('manifest-missing-dependency'))
})

test('missing optional backup power is a warning and does not block confirmation', () => {
  const review = reviewMissionPlan(manifest([
    { equipmentId: 'repair-toolkit', quantity: 1 },
  ]), 10)
  assert.equal(review.allowed, true)
  assert.ok(codes(review.warnings).includes('optional-power-backup-missing'))
})

test('limited optional repair and shelter upgrades are advisory warnings', () => {
  const review = reviewMissionPlan(manifest(), 20)
  assert.equal(review.allowed, true)
  assert.ok(codes(review.warnings).includes('optional-repair-toolkit-missing'))
  assert.ok(codes(review.warnings).includes('optional-shelter-upgrade-missing'))
  assert.ok(review.warnings.every((item) => item.severity === 'warning'))
})

test('a science kit without sample containers receives a selection-specific recommendation', () => {
  const review = reviewMissionPlan(manifest([
    { equipmentId: 'soil-analysis-kit', quantity: 1 },
  ]), 10)
  assert.equal(review.allowed, true)
  assert.ok(codes(review.recommendations).includes('science-support-tools-missing'))
})

test('a well-prepared mission receives positive feedback without contradictory advice', () => {
  const review = reviewMissionPlan(manifest(wellPreparedCargo), 25)
  assert.equal(review.allowed, true)
  assert.deepEqual(review.blockers, [])
  assert.deepEqual(review.warnings, [])
  assert.deepEqual(review.recommendations, [])
  assert.ok(codes(review.positiveFeedback).includes('optional-plan-well-prepared'))
})

test('repeated reviews do not modify the manifest', () => {
  const input = manifest(wellPreparedCargo.map((entry) => ({ ...entry })))
  for (const entry of input.optionalCargo) Object.freeze(entry)
  Object.freeze(input.optionalCargo)
  Object.freeze(input)
  const before = structuredClone(input)

  assert.deepEqual(reviewMissionPlan(input, 25), reviewMissionPlan(input, 25))
  assert.deepEqual(input, before)
})

test('review feedback codes are stable and non-contradictory', () => {
  const review = reviewMissionPlan(manifest([
    { equipmentId: 'soil-analysis-kit', quantity: 1 },
  ]), 10)
  const allItems = [
    ...review.blockers,
    ...review.warnings,
    ...review.recommendations,
    ...review.positiveFeedback,
    ...review.criticalReadinessAssumptions,
  ]
  const allCodes = allItems.map((item) => item.code)

  const repeated = reviewMissionPlan(manifest([
    { equipmentId: 'soil-analysis-kit', quantity: 1 },
  ]), 10)
  const repeatedCodes = [
    ...repeated.blockers,
    ...repeated.warnings,
    ...repeated.recommendations,
    ...repeated.positiveFeedback,
    ...repeated.criticalReadinessAssumptions,
  ].map((item) => item.code)
  assert.deepEqual(allCodes, repeatedCodes)
  assert.equal(new Set(allCodes).size, allCodes.length)
  assert.ok(allItems.every((item) => item.code.length > 0 && item.severity && item.explanation.length > 0))
  assert.ok(review.positiveFeedback.length === 0 || (review.warnings.length === 0 && review.recommendations.length === 0))
})
