import type { Resources } from '../../../../shared/types/game.ts'
import type {
  ExpeditionPlan, IceboundContext, IceboundIntent, IceboundObjectiveId, IceboundResolution,
  IceboundScenarioId, IceboundState, SamplingMethod, IceboundSample, IceboundIssueCode,
} from '../../types/icebound.ts'
import { ICEBOUND_OBJECTIVES } from '../../data/iceboundObjectives.ts'
import { ICEBOUND_SITES } from '../../data/iceboundSites.ts'
import { ICEBOUND_SCENARIOS } from '../../data/iceboundScenarios.ts'
import { validateObjective } from './objectives.ts'
import { evaluateResearchSite, reviewExpeditionPlan } from './planning.ts'
import { evaluateSampleAnalysis, generateScienceReport } from './science.ts'
import { availableEquipment, baseIssues, balanceFor, capabilitiesFor, costIssues, fieldIssues, samplingCost, scenarioFor } from './readiness.ts'

export function createIceboundState(runId: string, scenarioId: IceboundScenarioId = 'icebound.training-v1'): IceboundState {
  if (!runId.trim() || !ICEBOUND_SCENARIOS.some((scenario) => scenario.id === scenarioId)) {
    throw new Error('ICEBOUND needs a non-empty mission run ID and a known scenario.')
  }
  return { runId, scenarioId, revision: 0, completedObjectives: [], resolvedOperationIds: [], observations: [],
    selectedSiteId: null, approvedPlan: null, expedition: null, samples: [], analyses: [], costs: [], report: null }
}

function envelope(context: IceboundContext, operationId: string) {
  return { resolutionId: `icebound:${encodeURIComponent(context.mission.runId)}:${operationId}`,
    expectedMissionRevision: context.mission.revision, expectedSol: context.game.sol }
}
function blocked(context: IceboundContext, operationId: string, code: IceboundIssueCode, reason: string): Extract<IceboundResolution, { allowed: false }> {
  return { ...envelope(context, operationId), allowed: false, code, reason,
    proposedEffects: null, event: null, feedbackIds: [`icebound.issue.${code.toLowerCase()}`] }
}
function guard(context: IceboundContext, operationId: string, objectiveId?: IceboundObjectiveId): IceboundResolution | null {
  const issues = baseIssues(context)
  if (issues.length) return blocked(context, operationId, issues[0]!.code, issues[0]!.explanation)
  const objectiveMarker = objectiveId ?? 'icebound.expedition.executed'
  if (context.mission.resolvedOperationIds.includes(operationId) || context.game.spentActionIds.includes(envelope(context, operationId).resolutionId) ||
      context.game.objectives.some((item) => item.id === objectiveMarker && item.completed)) {
    return blocked(context, operationId, 'ALREADY_RESOLVED', 'This investigation operation has already been recorded.')
  }
  if (objectiveId) {
    const validation = validateObjective(context, objectiveId)
    if (!validation.eligible) return blocked(context, operationId, validation.issues[0]!.code, validation.issues[0]!.explanation)
  }
  return null
}

function finish(
  context: IceboundContext, operationId: string, objectiveId: IceboundObjectiveId,
  patch: Partial<IceboundState>, costs: Partial<Resources> = {}, actionSlots = 0, completeObjective = true,
): IceboundResolution {
  const affordability = costIssues(context, costs, actionSlots)
  if (affordability.length) return blocked(context, operationId, affordability[0]!.code, affordability[0]!.explanation)
  const definition = ICEBOUND_OBJECTIVES.find((objective) => objective.id === objectiveId)!
  const feedbackId = completeObjective ? definition.feedbackId : 'icebound.expedition.executed'
  const nextMissionState: IceboundState = structuredClone({
    ...context.mission, ...patch, revision: context.mission.revision + 1,
    completedObjectives: completeObjective ? [...context.mission.completedObjectives, objectiveId] : [...context.mission.completedObjectives],
    resolvedOperationIds: [...context.mission.resolvedOperationIds, operationId],
    costs: actionSlots || Object.keys(costs).length ? [...context.mission.costs, { operationId, sol: context.game.sol, resources: { ...costs }, actionSlots }] : [...context.mission.costs],
  })
  const resourceDeltas: Partial<Resources> = {}
  for (const [resource, cost] of Object.entries(costs) as [keyof Resources, number][]) resourceDeltas[resource] = -cost
  return { ...envelope(context, operationId), allowed: true, code: 'ALLOWED', reason: null,
    feedbackIds: [feedbackId],
    event: { objectiveId, eventId: `icebound.event.${operationId}`, feedbackId,
      outcomeId: nextMissionState.report?.outcomeId ?? null, scienceReferenceIds: [...definition.scienceReferenceIds],
      contextualTags: ['fictional-scenario', operationId] },
    proposedEffects: { resourceDeltas, actionSlotCost: actionSlots,
      actionCategory: operationId === 'recon' || operationId === 'expedition' ? 'exploration' : 'operation',
      equipmentStatusChanges: [], objectiveChanges: [{ objectiveId: completeObjective ? objectiveId : 'icebound.expedition.executed', completed: true }],
      missionStatus: nextMissionState.completedObjectives.includes('icebound.science-report') ? 'completed' : 'active', nextMissionState },
  }
}

export function getReconnaissanceData(context: IceboundContext) { return structuredClone(context.mission.observations) }

export function resolveReconnaissance(context: IceboundContext): IceboundResolution {
  const rejected = guard(context, 'recon', 'icebound.recon')
  if (rejected) return rejected
  const scenario = scenarioFor(context)!
  const observations = ICEBOUND_SITES.map((site) => ({
    id: `${encodeURIComponent(context.mission.runId)}:recon:${site.id}`, siteId: site.id, sol: context.game.sol,
    terrain: site.terrain, methods: [...site.methods], indicator: scenario.conditions[site.id].reconIndicator,
    explanation: 'Fictional survey clues suggest places to investigate. They do not prove ice is present or that a route is safe.',
    fictional: true as const, scienceReferenceIds: [...site.scienceReferenceIds],
  }))
  return finish(context, 'recon', 'icebound.recon', { observations }, balanceFor(context).recon, 1)
}

export function selectResearchSite(context: IceboundContext, siteId: string): IceboundResolution {
  const rejected = guard(context, 'select-site', 'icebound.site-selection')
  if (rejected) return rejected
  const assessment = evaluateResearchSite(context, siteId)
  if (!assessment.allowed || !assessment.site) {
    const issue = assessment.issues[0]!
    return blocked(context, 'select-site', issue.code, issue.explanation)
  }
  return finish(context, 'select-site', 'icebound.site-selection', { selectedSiteId: assessment.site.id })
}

export function approveExpeditionPlan(context: IceboundContext, plan: ExpeditionPlan): IceboundResolution {
  const rejected = guard(context, 'approve-plan', 'icebound.expedition-plan')
  if (rejected) return rejected
  const review = reviewExpeditionPlan(context, plan)
  if (!review.allowed) return blocked(context, 'approve-plan', review.blockers[0]!.code, review.blockers[0]!.explanation)
  return finish(context, 'approve-plan', 'icebound.expedition-plan', { approvedPlan: structuredClone(plan) })
}

export function resolveExpedition(context: IceboundContext): IceboundResolution {
  const rejected = guard(context, 'expedition')
  if (rejected) return rejected
  const plan = context.mission.approvedPlan
  if (!plan || !context.mission.completedObjectives.includes('icebound.expedition-plan')) {
    return blocked(context, 'expedition', 'APPROVED_PLAN_REQUIRED', 'Review and approve a field plan first.')
  }
  // Never trust an earlier review after resources, hazards or equipment readiness change.
  const review = reviewExpeditionPlan(context, plan)
  if (!review.allowed) return blocked(context, 'expedition', review.blockers[0]!.code, review.blockers[0]!.explanation)
  return finish(context, 'expedition', 'icebound.expedition-plan', {
    expedition: { id: envelope(context, 'expedition').resolutionId, plan: structuredClone(plan), sol: context.game.sol,
      observations: [{ id: `${envelope(context, 'expedition').resolutionId}:field-observation`,
        siteId: plan.siteId, sol: context.game.sol, fictional: true,
        explanation: 'The planned route and surface context were inspected in this fictional expedition. Sampling is still needed to investigate the material; reaching a site does not prove ice is present.',
        scienceReferenceIds: ['nasa-perseverance-objectives'],
      }],
    },
  }, review.requiredResources, review.actionSlotCost, false)
}

export function resolveSampling(context: IceboundContext, method: SamplingMethod): IceboundResolution {
  const rejected = guard(context, 'collect-sample', 'icebound.sample-collection')
  if (rejected) return rejected
  const expedition = context.mission.expedition!
  const plan = expedition.plan
  if (method !== plan.activity) return blocked(context, 'collect-sample', 'METHOD_NOT_APPROVED', 'Use the sampling method in the approved plan.')
  const inventory = new Set(availableEquipment(context))
  if (plan.equipmentIds.some((id) => !inventory.has(id))) return blocked(context, 'collect-sample', 'EQUIPMENT_UNAVAILABLE', 'A planned sampling tool is no longer available.')
  const capabilities = capabilitiesFor(context, [...plan.equipmentIds])
  if (!capabilities.has('sample-handling') || !capabilities.has(method === 'subsurface-drilling' ? 'drilling' : 'surface-sampling')) {
    return blocked(context, 'collect-sample', 'SAMPLING_CAPABILITY_REQUIRED', 'The sampling tool and sample-handling capability must both be available.')
  }
  const assessment = evaluateResearchSite(context, plan.siteId, plan.method)
  const field = fieldIssues(context, plan.method !== 'rover-only')
  const issue = assessment.issues[0] ?? field[0]
  if (issue) return blocked(context, 'collect-sample', issue.code, issue.explanation)
  const sample: IceboundSample = {
    id: `${encodeURIComponent(context.mission.runId)}:${context.mission.scenarioId}:${plan.siteId}:${method}:sample-1`,
    expeditionId: expedition.id, siteId: plan.siteId, scenarioId: context.mission.scenarioId,
    method, collectedSol: context.game.sol, status: 'collected',
    quality: { handling: plan.equipmentIds.includes('sample-container-set') ? 'sealed' : 'basic',
      instrument: capabilities.has('field-analysis') ? 'field' : 'basic', documented: context.mission.observations.some((item) => item.siteId === plan.siteId) },
    observation: method === 'subsurface-drilling' ? 'A fictional subsurface sample was collected and labeled.' : 'A fictional surface sample was collected and labeled. It does not describe deeper material.',
    scienceReferenceIds: ['nasa-perseverance-objectives', 'nasa-swim'],
  }
  return finish(context, 'collect-sample', 'icebound.sample-collection', { samples: [sample] }, samplingCost(context, method), 1)
}

export function analyzeSamples(context: IceboundContext, sampleId: string): IceboundResolution {
  const rejected = guard(context, 'analyze-sample', 'icebound.lab-analysis')
  if (rejected) return rejected
  const sample = context.mission.samples.find((item) => item.id === sampleId)
  if (!sample) return blocked(context, 'analyze-sample', 'SAMPLE_REQUIRED', 'Choose a collected sample before analysis.')
  const expedition = context.mission.expedition
  if (!expedition || sample.expeditionId !== expedition.id || sample.siteId !== expedition.plan.siteId ||
      sample.method !== expedition.plan.activity || sample.scenarioId !== context.mission.scenarioId ||
      sample.collectedSol < expedition.sol || sample.collectedSol > context.game.sol) {
    return blocked(context, 'analyze-sample', 'SAMPLE_RECORD_MISMATCH', 'The sample and expedition records must match before analysis.')
  }
  const analysis = evaluateSampleAnalysis(context, sample)
  if (analysis.classification === 'analysis-incomplete') {
    return { ...blocked(context, 'analyze-sample', 'ANALYSIS_INCOMPLETE', analysis.conclusion), analysis }
  }
  return finish(context, 'analyze-sample', 'icebound.lab-analysis', { analyses: [analysis] }, balanceFor(context).analysis, 1)
}

export function resolveScienceReport(context: IceboundContext): IceboundResolution {
  const rejected = guard(context, 'science-report', 'icebound.science-report')
  if (rejected) return rejected
  const report = generateScienceReport(context)
  if (report.completionStatus !== 'complete') return blocked(context, 'science-report', 'REPORT_INCOMPLETE', 'Record a completed analysis before finishing the investigation.')
  return finish(context, 'science-report', 'icebound.science-report', { report })
}

export function iceboundEngine(context: IceboundContext, intent: IceboundIntent): IceboundResolution {
  switch (intent.type) {
    case 'RECON': return resolveReconnaissance(context)
    case 'SELECT_SITE': return selectResearchSite(context, intent.siteId)
    case 'APPROVE_PLAN': return approveExpeditionPlan(context, intent.plan)
    case 'EXECUTE_EXPEDITION': return resolveExpedition(context)
    case 'COLLECT_SAMPLE': return resolveSampling(context, intent.method)
    case 'ANALYZE_SAMPLE': return analyzeSamples(context, intent.sampleId)
    case 'GENERATE_REPORT': return resolveScienceReport(context)
    default: {
      const exhaustiveIntent: never = intent
      void exhaustiveIntent
      return blocked(context, 'unsupported', 'UNSUPPORTED_INTENT', 'Choose an ICEBOUND operation.')
    }
  }
}
