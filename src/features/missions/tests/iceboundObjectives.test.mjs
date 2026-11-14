import assert from 'node:assert/strict'
import test from 'node:test'
import { ICEBOUND_OBJECTIVES, ICEBOUND_SITES, validateObjective, getMissionStatus, resolveReconnaissance,
  evaluateResearchSite, selectResearchSite, getReconnaissanceData } from '../engine/icebound/index.ts'
import { fixture, act, selected, commit, deepFreeze } from './iceboundTestSupport.mjs'

test('six stable objectives have valid references, complete metadata and no prerequisite cycles', () => {
  assert.equal(ICEBOUND_OBJECTIVES.length, 6)
  const ids = ICEBOUND_OBJECTIVES.map((item) => item.id)
  assert.equal(new Set(ids).size, 6)
  function visit(id, path = []) {
    assert.ok(!path.includes(id))
    const objective = ICEBOUND_OBJECTIVES.find((item) => item.id === id)
    assert.ok(objective)
    assert.ok(objective.title && objective.completionCondition && objective.scienceReferenceIds.length && objective.feedbackId)
    for (const prerequisite of objective.prerequisites) visit(prerequisite, [...path, id])
  }
  ids.forEach((id) => visit(id))
})
test('recon is locked before Sol 3, outside outpost, after Sol 10, or with a terminal outcome', () => {
  const early = fixture()
  early.game.sol = 2
  assert.equal(validateObjective(early, 'icebound.recon').status, 'locked')
  for (const patch of [{ sol: 2 }, { phase: 'landing' }, { sol: 11 }, { outcome: 'failure' }]) {
    const context = fixture()
    context.game = { ...context.game, ...patch }
    assert.equal(validateObjective(context, 'icebound.recon').eligible, false)
    assert.equal(resolveReconnaissance(context).proposedEffects, null)
  }
})
test('availability never completes objectives automatically', () => {
  const context = fixture()
  assert.equal(getMissionStatus(context).status, 'available')
  assert.equal(getMissionStatus(context).completedCount, 0)
  assert.equal(validateObjective(context, 'icebound.site-selection').status, 'locked')
  assert.deepEqual(context.mission.completedObjectives, [])
})
test('valid recon yields deterministic fictional observations and unlocks site selection', () => {
  const context = fixture()
  const first = resolveReconnaissance(context)
  assert.deepEqual(first, resolveReconnaissance(context))
  const next = commit(context, first)
  assert.equal(next.mission.observations.length, 3)
  assert.ok(next.mission.observations.every((item) => item.fictional && item.scienceReferenceIds.length))
  assert.equal(validateObjective(next, 'icebound.site-selection').status, 'available')
  assert.equal(validateObjective(next, 'icebound.recon').status, 'completed')
  assert.equal(resolveReconnaissance(next).allowed, false)
  const detached = getReconnaissanceData(next)
  detached[0].explanation = 'changed copy'
  assert.notEqual(detached[0].explanation, next.mission.observations[0].explanation)
})
test('missing recon capability, readiness, communications, resources or slots blocks without effects', () => {
  for (const mutate of [
    (c) => { c.readiness.deployedEquipment = [] },
    (c) => { c.readiness.roverOperational = false },
    (c) => { c.readiness.roverEnergyReady = false },
    (c) => { c.readiness.communicationsReady = false },
    (c) => { c.game.resources.power = 0 },
    (c) => { c.game.actionsRemaining = 0 },
    (c) => { c.game.preparation.status = 'editing' },
  ]) {
    const context = fixture(); mutate(context)
    const result = resolveReconnaissance(context)
    assert.equal(result.allowed, false)
    assert.equal(result.proposedEffects, null)
  }
})
test('an approved baseline survey capability is a valid rover-equivalent for recon only', () => {
  const context = fixture()
  context.readiness.deployedEquipment = []
  context.readiness.baselineCapabilities = ['recon']
  context.readiness.roverOperational = false
  assert.equal(resolveReconnaissance(context).allowed, true)
})
test('site selection requires reconnaissance, a known site and actual method access', () => {
  assert.equal(selectResearchSite(fixture(), 'icebound.lumen-shelf').allowed, false)
  const context = act(fixture(), { type: 'RECON' })
  assert.equal(selectResearchSite(context, 'made-up-site').allowed, false)
  context.readiness.crewAvailable = false
  assert.equal(evaluateResearchSite(context, 'icebound.echo-ridge').allowed, false)
  assert.equal(evaluateResearchSite(context, 'icebound.lumen-shelf').allowed, true)
  const next = act(context, { type: 'SELECT_SITE', siteId: 'icebound.lumen-shelf' })
  assert.equal(selectResearchSite(next, 'icebound.cinder-flats').allowed, false)
  assert.deepEqual(evaluateResearchSite(next, 'icebound.lumen-shelf').site, ICEBOUND_SITES[0])
})
test('recon and site functions do not mutate frozen context', () => {
  const context = deepFreeze(selected())
  const before = structuredClone(context)
  evaluateResearchSite(context, 'icebound.lumen-shelf')
  selectResearchSite(context, 'icebound.lumen-shelf')
  assert.deepEqual(context, before)
})
