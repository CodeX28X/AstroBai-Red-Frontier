import assert from 'node:assert/strict'
import test from 'node:test'
import { reviewExpeditionPlan, validateExpeditionPlan, createExpeditionPlan, resolveExpedition,
  approveExpeditionPlan } from '../engine/icebound/index.ts'
import { selected, plan, act, deepFreeze, executed } from './iceboundTestSupport.mjs'

for (const method of ['rover-only', 'astronaut-team', 'combined']) {
  test(`valid ${method} planning has distinct costs and non-blocking advice`, () => {
    const review = reviewExpeditionPlan(selected(), plan('icebound.lumen-shelf', method))
    assert.equal(review.allowed, true)
    assert.equal(review.actionSlotCost, 1)
    assert.equal(review.requiredResources.oxygen ?? 0, method === 'rover-only' ? 0 : 1)
  })
}
test('planning checks actual deployed confirmed inventory and selected tools', () => {
  const context = selected()
  for (const equipmentIds of [['unknown-tool'], ['field-rover'], ['field-rover', 'field-rover']]) {
    assert.equal(validateExpeditionPlan(context, { ...plan(), equipmentIds }).allowed, false)
  }
  context.readiness.deployedEquipment.find((item) => item.equipmentId === 'sample-container-set').status = 'offline'
  assert.equal(validateExpeditionPlan(context, plan()).allowed, false)
})
test('drilling requires explicit capability; tools do not magically supply a drill', () => {
  const context = selected()
  context.readiness.baselineCapabilities = ['lab-analysis']
  assert.equal(reviewExpeditionPlan(context, plan()).allowed, false)
  assert.equal(reviewExpeditionPlan(context, plan('icebound.lumen-shelf', 'rover-only', 'surface-sampling')).allowed, true)
})
test('site and expedition method must be compatible', () => {
  assert.equal(reviewExpeditionPlan(selected('icebound.echo-ridge'), plan('icebound.echo-ridge', 'rover-only')).allowed, false)
  assert.equal(reviewExpeditionPlan(selected('icebound.echo-ridge'), plan('icebound.echo-ridge', 'astronaut-team')).allowed, true)
  assert.equal(reviewExpeditionPlan(selected('icebound.cinder-flats'), plan('icebound.cinder-flats', 'astronaut-team')).allowed, false)
})
test('resource, action, supply, crew and hazard constraints are hard blockers', () => {
  for (const change of [
    (c) => { c.game.resources.power = 0 }, (c) => { c.game.actionsRemaining = 0 },
    (c) => { c.readiness.roverEnergyReady = false }, (c) => { c.readiness.crewSafeForEva = false },
    (c) => { c.readiness.communicationsReady = false }, (c) => { c.readiness.weather = 'blocked' },
    (c) => { c.readiness.radiation = 'blocked' },
  ]) {
    const context = selected(); change(context)
    assert.equal(reviewExpeditionPlan(context, plan('icebound.lumen-shelf', 'combined')).allowed, false)
  }
  assert.equal(reviewExpeditionPlan(selected(), { ...plan(), supplies: {} }).allowed, false)
  assert.equal(reviewExpeditionPlan(selected(), { ...plan(), supplies: { power: -1 } }).allowed, false)
})
test('advisories are relevant warnings; approved protection mitigates hard hazards', () => {
  const context = selected()
  context.readiness.weather = 'caution'
  const review = reviewExpeditionPlan(context, plan())
  assert.equal(review.allowed, true)
  assert.ok(review.warnings.length)
  context.readiness.weather = 'blocked'
  context.game.protection.storm = true
  assert.equal(reviewExpeditionPlan(context, plan()).allowed, true)
})
test('execution revalidates changed resources and equipment after approval', () => {
  const context = act(selected(), { type: 'APPROVE_PLAN', plan: plan() })
  assert.equal(resolveExpedition(context).allowed, true)
  context.game.resources.power = 0
  assert.equal(resolveExpedition(context).proposedEffects, null)
  context.game.resources.power = 3
  context.readiness.roverOperational = false
  assert.equal(resolveExpedition(context).proposedEffects, null)
})
test('execution cannot repeat and rejected plans change no state', () => {
  const context = deepFreeze(selected())
  const before = structuredClone(context)
  assert.equal(approveExpeditionPlan(context, { ...plan(), equipmentIds: [] }).allowed, false)
  assert.deepEqual(context, before)
  assert.equal(resolveExpedition(executed()).allowed, false)
})
test('plan creation copies without adding missing equipment or altering declared supplies', () => {
  const request = plan()
  const result = createExpeditionPlan(request)
  assert.deepEqual(result, request)
  result.equipmentIds.pop()
  assert.notDeepEqual(result, request)
})

test('successful execution proposals are detached from a frozen approved plan and state', () => {
  const context = deepFreeze(act(selected(), { type: 'APPROVE_PLAN', plan: plan() }))
  const before = structuredClone(context)
  const proposal = resolveExpedition(context)
  assert.equal(proposal.allowed, true)
  proposal.proposedEffects.nextMissionState.expedition.plan.equipmentIds.pop()
  assert.deepEqual(context, before)
})
