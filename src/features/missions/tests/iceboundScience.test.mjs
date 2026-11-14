import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSampling, analyzeSamples, evaluateSampleAnalysis, generateScienceReport, resolveScienceReport,
  ICEBOUND_SCIENCE_SOURCES, getMissionStatus } from '../engine/icebound/index.ts'
import { sampled, executed, selected, fixture, act, plan, nextSol, deepFreeze } from './iceboundTestSupport.mjs'

test('sampling requires an executed expedition and the approved method', () => {
  const notExecuted = act(selected(), { type: 'APPROVE_PLAN', plan: plan() })
  assert.equal(resolveSampling(notExecuted, 'subsurface-drilling').allowed, false)
  assert.equal(resolveSampling(executed(), 'surface-sampling').code, 'METHOD_NOT_APPROVED')
})
test('collection produces stable unique IDs, consistent metadata, and no duplicate samples', () => {
  const context = executed()
  const first = resolveSampling(context, 'subsurface-drilling')
  assert.deepEqual(first, resolveSampling(context, 'subsurface-drilling'))
  const sample = first.proposedEffects.nextMissionState.samples[0]
  assert.equal(sample.siteId, context.mission.expedition.plan.siteId)
  assert.equal(sample.expeditionId, context.mission.expedition.id)
  assert.equal(sample.scenarioId, context.mission.scenarioId)
  assert.equal(sample.quality.handling, 'sealed')
  assert.equal(resolveSampling(sampled(), 'subsurface-drilling').allowed, false)
})
test('sampling rechecks tools, consumables, hazards and current slots', () => {
  for (const change of [
    (c) => { c.readiness.baselineCapabilities = ['lab-analysis'] },
    (c) => { c.readiness.deployedEquipment.find((item) => item.equipmentId === 'sample-container-set').status = 'damaged' },
    (c) => { c.game.resources.power = 0 }, (c) => { c.game.actionsRemaining = 0 },
    (c) => { c.readiness.weather = 'blocked' },
  ]) {
    const context = executed(); change(context)
    assert.equal(resolveSampling(context, 'subsurface-drilling').proposedEffects, null)
  }
})

for (const [site, method, activity, expected] of [
  ['icebound.lumen-shelf', 'rover-only', 'subsurface-drilling', 'supports-accessible-ice'],
  ['icebound.lumen-shelf', 'rover-only', 'surface-sampling', 'no-accessible-ice-detected'],
  ['icebound.cinder-flats', 'rover-only', 'subsurface-drilling', 'no-accessible-ice-detected'],
  ['icebound.echo-ridge', 'astronaut-team', 'subsurface-drilling', 'inconclusive'],
]) {
  test(`laboratory classifies ${site} ${activity} as ${expected}`, () => {
    const context = sampled(site, method, activity)
    const result = analyzeSamples(context, context.mission.samples[0].id)
    assert.equal(result.allowed, true, result.reason)
    const analysis = result.proposedEffects.nextMissionState.analyses[0]
    assert.equal(analysis.classification, expected)
    assert.ok(analysis.examined && analysis.observed && analysis.conclusion && analysis.limitations.length)
    assert.deepEqual(result, analyzeSamples(context, context.mission.samples[0].id))
  })
}
test('equipment reliability never creates ice in a dry scenario', () => {
  const context = sampled('icebound.lumen-shelf', 'rover-only', 'subsurface-drilling', 'icebound.dry-v1')
  const result = analyzeSamples(context, context.mission.samples[0].id)
  assert.equal(result.proposedEffects.nextMissionState.analyses[0].classification, 'no-accessible-ice-detected')
  const poor = { ...context.mission.samples[0], quality: { handling: 'basic', instrument: 'basic', documented: true } }
  assert.equal(evaluateSampleAnalysis(context, poor).classification, 'inconclusive')
})
test('field instruments improve evidence context, while a basic supported method remains reportable', () => {
  let context = selected()
  const basicPlan = { ...plan('icebound.lumen-shelf', 'rover-only', 'surface-sampling'), equipmentIds: ['field-rover', 'repair-toolkit', 'sample-container-set'] }
  context = act(context, { type: 'APPROVE_PLAN', plan: basicPlan })
  context = nextSol(act(context, { type: 'EXECUTE_EXPEDITION' }))
  context = act(context, { type: 'COLLECT_SAMPLE', method: 'surface-sampling' })
  context = act(context, { type: 'ANALYZE_SAMPLE', sampleId: context.mission.samples[0].id })
  assert.equal(context.mission.analyses[0].classification, 'inconclusive')
  assert.equal(resolveScienceReport(context).allowed, true)
})
test('unusable material yields incomplete analysis, not a negative result or completion reward', () => {
  const context = sampled()
  context.mission = { ...context.mission, samples: [{ ...context.mission.samples[0], status: 'unusable' }] }
  const result = analyzeSamples(context, context.mission.samples[0].id)
  assert.equal(result.allowed, false)
  assert.equal(result.analysis.classification, 'analysis-incomplete')
  assert.equal(result.proposedEffects, null)
  const draft = generateScienceReport(context)
  assert.equal(draft.completionStatus, 'incomplete')
  assert.equal(draft.conclusion, null)
})
test('missing sample, mismatched records, unavailable lab and insufficient power block analysis', () => {
  assert.equal(analyzeSamples(sampled(), 'unknown-sample').code, 'SAMPLE_REQUIRED')
  for (const change of [
    (c) => { c.readiness.laboratoryOperational = false },
    (c) => { c.readiness.baselineCapabilities = [] },
    (c) => { c.game.facilities.habitat = 'offline' },
    (c) => { c.game.resources.power = 0 },
    (c) => { c.game.actionsRemaining = 0 },
    (c) => { c.mission.samples = [{ ...c.mission.samples[0], expeditionId: 'wrong-expedition' }] },
  ]) {
    const context = sampled(); change(context)
    assert.equal(analyzeSamples(context, context.mission.samples[0].id).allowed, false)
  }
})
test('reports distinguish incomplete work from recorded negative and inconclusive science', () => {
  assert.equal(generateScienceReport(fixture()).completionStatus, 'incomplete')
  assert.equal(resolveScienceReport(fixture()).allowed, false)
  for (const [site, method] of [['icebound.cinder-flats', 'rover-only'], ['icebound.echo-ridge', 'astronaut-team']]) {
    let context = sampled(site, method)
    context = act(context, { type: 'ANALYZE_SAMPLE', sampleId: context.mission.samples[0].id })
    context = act(context, { type: 'GENERATE_REPORT' })
    assert.equal(context.mission.report.completionStatus, 'complete')
    assert.equal(getMissionStatus(context).status, 'completed')
    assert.equal(resolveScienceReport(context).allowed, false)
    const sources = new Set(ICEBOUND_SCIENCE_SOURCES.map((source) => source.id))
    assert.ok(context.mission.report.scienceReferenceIds.every((id) => sources.has(id)))
    assert.equal(context.mission.report.operationalCosts.length, 4)
  }
})
test('analysis, reports and sampling leave frozen input unchanged', () => {
  const context = deepFreeze(sampled())
  const before = structuredClone(context)
  analyzeSamples(context, context.mission.samples[0].id)
  generateScienceReport(context)
  resolveSampling(context, 'subsurface-drilling')
  assert.deepEqual(context, before)
})
