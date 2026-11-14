import type { GameState } from '../types/game.ts'
import type { IceboundContext } from '../../features/missions/types/icebound.ts'
import { getMissionStatus } from '../../features/missions/engine/icebound/objectives.ts'
import { generateScienceReport } from '../../features/missions/engine/icebound/science.ts'
import { listResearchSites, reviewExpeditionPlan } from '../../features/missions/engine/icebound/planning.ts'

export function selectIceboundContext(state: GameState): IceboundContext {
  return { game: state, mission: state.icebound, readiness: state.iceboundReadiness }
}

/** Derived availability and current readiness; review snapshots in planning remain revision evidence only. */
export function selectIceboundView(state: GameState) {
  const context = selectIceboundContext(state)
  const status = getMissionStatus(context)
  const plan = state.icebound.approvedPlan ?? state.iceboundPlanning.draft
  return {
    ...status,
    activeObjective: status.objectives.find((objective) => objective.status === 'active' || objective.status === 'available')?.id ?? null,
    sites: listResearchSites(context),
    plan: plan ? structuredClone(plan) : null,
    planningStatus: state.icebound.expedition ? 'executed' : state.icebound.approvedPlan ? 'confirmed' :
      state.iceboundPlanning.reviewedRevision === state.iceboundPlanning.revision && state.iceboundPlanning.review ? 'reviewed' : 'editing',
    currentReadiness: plan ? reviewExpeditionPlan(context, plan) : null,
    report: generateScienceReport(context),
  }
}
