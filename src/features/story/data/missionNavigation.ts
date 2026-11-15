import type { GameState } from '../../../shared/types/game.ts'
import { selectIceboundContext, selectIceboundView } from '../../../shared/store/iceboundSelectors.ts'
import { iceboundEngine } from '../../missions/engine/icebound/iceboundEngine.ts'
import { ICEBOUND_OBJECTIVES } from '../../missions/data/iceboundObjectives.ts'
import { ICEBOUND_SITES } from '../../missions/data/iceboundSites.ts'
import { SITE_POINTS } from './adventureLocations.ts'
import { facilityApproachPoint } from '../../mars-map/navigation/navigation.ts'
import { currentSamples } from '../../missions/engine/icebound/siteProgress.ts'

/** A destination only: never sends an engine intent or completes an objective. */
export function missionDestination(state: GameState, objectiveId: string) {
  const view = selectIceboundView(state), ctx = selectIceboundContext(state)
  const requested = view.objectives.find(item => item.id === objectiveId)
  if (!requested) return { text: 'Choose a mission from the list.', panel: 'mission' as const }
  if (requested.status === 'completed') return { text: 'This step is recorded in our notebook.', panel: 'report' as const }
  function firstRequired(id: string): string {
    const definition = ICEBOUND_OBJECTIVES.find(item => item.id === id)!
    const missing = definition.prerequisites.find(prerequisite => view.objectives.find(item => item.id === prerequisite)?.status !== 'completed')
    return missing ? firstRequired(missing) : id
  }
  const id = firstRequired(objectiveId)
  const prefix = id !== objectiveId ? 'First, ' : ''
  if (id === 'icebound.site-selection') return { text: `${prefix}choose a research site from Scout’s clues.`, panel: 'sites' as const }
  if (id === 'icebound.expedition-plan') return { text: `${prefix}choose our team and equipment, then ask Mission Control.`, panel: 'plan' as const }
  const sample = currentSamples(state.icebound)[0]
  const intent = id === 'icebound.recon' ? { type: 'RECON' as const } : id === 'icebound.sample-collection' ? state.icebound.expedition ? { type: 'COLLECT_SAMPLE' as const, method: state.icebound.approvedPlan!.activity } : { type: 'EXECUTE_EXPEDITION' as const } : id === 'icebound.lab-analysis' ? { type: 'ANALYZE_SAMPLE' as const, sampleId: sample?.id ?? '' } : { type: 'GENERATE_REPORT' as const }
  const readiness = iceboundEngine(ctx, intent)
  if (!readiness.allowed) return { text: readiness.reason, blockedReason: readiness.reason }
  const laboratory = id === 'icebound.lab-analysis' || id === 'icebound.science-report'
  const index = Math.max(0, ICEBOUND_SITES.findIndex(site => site.id === state.icebound.selectedSiteId))
  return { text: laboratory ? 'Let’s visit the laboratory. Choose the science action when you are ready.' : id === 'icebound.recon' ? `${prefix}let’s guide Scout toward the research area. Choose Send Scout to survey.` : 'We need a sample from the research site! Start the expedition or collect your sample when ready.', point: laboratory ? facilityApproachPoint('research-lab') : SITE_POINTS[index], facility: laboratory ? 'research-lab' as const : undefined, siteId: laboratory ? undefined : state.icebound.selectedSiteId ?? undefined, kind: (laboratory || state.icebound.approvedPlan?.method !== 'rover-only') && id !== 'icebound.recon' ? 'astronaut' as const : 'rover' as const }
}
