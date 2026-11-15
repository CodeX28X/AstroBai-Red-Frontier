import type { ExpeditionPlan, IceboundAnalysis, IceboundContext, IceboundSample, IceboundScienceReport } from '../../types/icebound.ts'
import { capabilitiesFor, scenarioFor } from './readiness.ts'
import { activeObjectives, currentSamples, currentAnalyses } from './siteProgress.ts'

export function plannedSampleQuality(context: IceboundContext, plan: ExpeditionPlan): IceboundSample['quality'] {
  return { handling: plan.equipmentIds.includes('sample-container-set') ? 'sealed' : 'basic', instrument: capabilitiesFor(context, [...plan.equipmentIds]).has('field-analysis') ? 'field' : 'basic', documented: context.mission.observations.some(item => item.siteId === plan.siteId) }
}
/** Same quality boundary used by classification and by the player's planning checklist. */
export function evidenceQualityIssues(quality: IceboundSample['quality']): string[] {
  return [quality.handling !== 'sealed' ? 'Sealed sample containers help protect the material.' : '', quality.instrument !== 'field' ? 'A Soil Analysis Kit records field-instrument context.' : '', !quality.documented ? 'A recorded survey is needed to document the sample location.' : ''].filter(Boolean)
}

/** Scenario truth and investigation quality are separate inputs. No equipment can create ice. */
export function evaluateSampleAnalysis(context: IceboundContext, sample: IceboundSample): IceboundAnalysis {
  const conditions = scenarioFor(context)?.conditions[sample.siteId]
  const base = {
    sampleId: sample.id,
    examined: `${sample.method} sample from ${sample.siteId} in a fictional scenario.`,
    scienceReferenceIds: ['nasa-swim', 'nasa-perseverance-objectives'] as const,
  }
  if (sample.status !== 'collected' || sample.scenarioId !== context.mission.scenarioId || !conditions) {
    return { ...base, classification: 'analysis-incomplete', observed: 'The sample record is not usable for a completed analysis.',
      conclusion: 'The investigation is incomplete; this is not evidence that ice is absent.', limitations: ['A usable sample and matching scenario record are required.'] }
  }
  const finding = sample.method === 'subsurface-drilling' ? conditions.subsurface : conditions.surface
  const qualityReady = evidenceQualityIssues(sample.quality).length === 0
  if (!qualityReady || finding === 'unknown') {
    return { ...base, classification: 'inconclusive', observed: 'The available evidence does not clearly distinguish ice from other material.',
      conclusion: 'We cannot tell yet. Recording uncertainty is a useful scientific result.', limitations: [
        !qualityReady ? 'Handling, instrument context or documentation limits confidence.' : 'This scenario has unresolved sample evidence.',
        'One investigated sample cannot describe the whole site or Mars.',
      ] }
  }
  if (finding === 'ice') {
    return { ...base, classification: 'supports-accessible-ice', observed: 'The fictional sample evidence is consistent with water ice in the investigated material.',
      conclusion: 'The evidence supports accessible ice in this investigated sample and method.',
      limitations: ['This is a fictional finding, not a NASA measurement.', 'One sample does not establish a reserve size, safe route or water supply.'] }
  }
  return { ...base, classification: 'no-accessible-ice-detected', observed: 'No accessible ice signal was detected in the investigated material in this scenario.',
    conclusion: 'No accessible ice was detected in this sample; other places or depths may differ.',
    limitations: ['A surface sample cannot rule out deeper ice.', 'This result applies only to the investigated material and method.'] }
}

/** Also supports draft/incomplete debrief data; it never marks an objective complete. */
export function generateScienceReport(context: IceboundContext): IceboundScienceReport {
  const { mission } = context
  const finding = mission.analyses.find((analysis) => analysis.classification !== 'analysis-incomplete' &&
    mission.samples.some((sample) => sample.id === analysis.sampleId && sample.status === 'collected' &&
      sample.expeditionId === mission.expedition?.id && sample.siteId === mission.selectedSiteId && sample.scenarioId === mission.scenarioId))
  const complete = ['icebound.recon', 'icebound.site-selection', 'icebound.expedition-plan', 'icebound.sample-collection', 'icebound.lab-analysis']
    .every((id) => activeObjectives(mission).some((completed) => completed === id)) && finding !== undefined && mission.expedition !== null
  const conclusion = complete ? finding.classification : null
  const outcomeId = !complete ? 'icebound.outcome.incomplete' : conclusion === 'supports-accessible-ice' ? 'icebound.outcome.supported-ice' :
    conclusion === 'no-accessible-ice-detected' ? 'icebound.outcome.negative' : 'icebound.outcome.inconclusive'
  return structuredClone({
    outcomeId, completionStatus: complete ? 'complete' : 'incomplete', siteId: mission.selectedSiteId,
    reconnaissance: mission.observations, expeditionMethod: mission.expedition?.plan.method ?? null,
    expeditionObservations: mission.expedition?.observations ?? [],
    equipmentIds: mission.expedition?.plan.equipmentIds ?? [], samples: currentSamples(mission), findings: currentAnalyses(mission),
    conclusion, limitations: complete ? finding.limitations : ['The investigation has not produced a completed analysis. Do not interpret missing work as a negative finding.'],
    operationalCosts: mission.costs.filter(cost=>cost.operationId==='recon'||cost.operationId.startsWith(`${mission.selectedSiteId}:`)), scienceReferenceIds: ['nasa-swim', 'nasa-perseverance-objectives', 'nasa-mars-2020'],
    feedbackIds: [complete ? 'icebound.report.complete' : 'icebound.report.incomplete'],
  })
}
