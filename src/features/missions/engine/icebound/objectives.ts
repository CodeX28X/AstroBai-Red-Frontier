import { ICEBOUND_OBJECTIVES } from '../../data/iceboundObjectives.ts'
import type { IceboundContext, IceboundIssue, IceboundObjectiveStatus } from '../../types/icebound.ts'
import type { MissionStatus } from '../../../../shared/types/game.ts'
import { baseIssues, balanceFor, availableEquipment, capabilitiesFor, costIssues, fieldIssues, iceboundIssue, samplingCost } from './readiness.ts'
import { evaluateResearchSite } from './planning.ts'

export function validateObjective(context: IceboundContext, objectiveId: string): {
  eligible: boolean; status: IceboundObjectiveStatus; issues: IceboundIssue[]
} {
  const objective = ICEBOUND_OBJECTIVES.find((item) => item.id === objectiveId)
  if (!objective) return { eligible: false, status: 'locked', issues: [iceboundIssue('UNKNOWN_OBJECTIVE', 'Choose an ICEBOUND objective.')] }
  if (context.mission.completedObjectives.includes(objective.id) || context.game.objectives.some((item) => item.id === objective.id && item.completed)) {
    return { eligible: false, status: 'completed', issues: [iceboundIssue('OBJECTIVE_COMPLETED', 'This objective is already recorded.')] }
  }
  if (objective.prerequisites.some((id) => !context.mission.completedObjectives.includes(id))) {
    return { eligible: false, status: 'locked', issues: [iceboundIssue('PREREQUISITE_REQUIRED', 'Complete the earlier investigation steps first.')] }
  }
  const issues = baseIssues(context)
  const capabilities = capabilitiesFor(context)
  if (objective.id === 'icebound.recon') {
    if (!capabilities.has('recon')) issues.push(iceboundIssue('RECON_CAPABILITY_REQUIRED', 'Deploy a reconnaissance rover or approved survey capability.'))
    if (capabilities.has('rover') && (!context.readiness.roverOperational || !context.readiness.roverEnergyReady)) {
      issues.push(iceboundIssue('ROVER_NOT_READY', 'The survey rover must be working and ready for its trip.'))
    }
    issues.push(...fieldIssues(context, false), ...costIssues(context, balanceFor(context).recon, 1))
  }
  if (objective.id === 'icebound.sample-collection') {
    if (!context.mission.expedition) issues.push(iceboundIssue('EXPEDITION_REQUIRED', 'Carry out the approved expedition before collecting samples.'))
    else {
      const plan = context.mission.expedition.plan
      const available = new Set(availableEquipment(context))
      const tools = capabilitiesFor(context, [...plan.equipmentIds])
      if (plan.equipmentIds.some((id) => !available.has(id)) || !tools.has('sample-handling') ||
          !tools.has(plan.activity === 'subsurface-drilling' ? 'drilling' : 'surface-sampling')) {
        issues.push(iceboundIssue('SAMPLING_CAPABILITY_REQUIRED', 'The approved sampling tools must still be available.'))
      }
      issues.push(...evaluateResearchSite(context, plan.siteId, plan.method).issues,
        ...fieldIssues(context, plan.method !== 'rover-only'), ...costIssues(context, samplingCost(context, plan.activity), 1))
    }
  }
  if (objective.id === 'icebound.lab-analysis') {
    if (!context.mission.samples.length) issues.push(iceboundIssue('SAMPLE_REQUIRED', 'Collect and record a sample before analysis.'))
    if (!capabilities.has('lab-analysis') || !context.readiness.laboratoryOperational || context.game.facilities.habitat !== 'operational') {
      issues.push(iceboundIssue('LAB_UNAVAILABLE', 'A working habitat and approved laboratory capability are needed.'))
    }
    issues.push(...costIssues(context, balanceFor(context).analysis, 1))
  }
  if (objective.id === 'icebound.science-report' && !context.mission.analyses.some((item) => item.classification !== 'analysis-incomplete')) {
    issues.push(iceboundIssue('REPORT_INCOMPLETE', 'Complete an analysis before recording a scientific conclusion.'))
  }
  const timeLocked = context.game.phase === 'outpost' && context.game.outcome === null && context.game.sol < balanceFor(context).earliestSol
  return { eligible: issues.length === 0, status: issues.length ? timeLocked ? 'locked' : 'blocked' :
    objective.id === 'icebound.sample-collection' && context.mission.expedition ? 'active' : 'available', issues }
}

export function getMissionStatus(context: IceboundContext) {
  const objectives = ICEBOUND_OBJECTIVES.map((definition) => ({ ...structuredClone(definition), ...validateObjective(context, definition.id) }))
  const completedCount = objectives.filter((objective) => objective.status === 'completed').length
  const status: MissionStatus = completedCount === ICEBOUND_OBJECTIVES.length ? 'completed' :
    context.game.outcome !== null ? 'failed' : completedCount > 0 ? 'active' :
      objectives.some((objective) => objective.eligible) ? 'available' : 'locked'
  return { status, objectives, completedCount }
}
