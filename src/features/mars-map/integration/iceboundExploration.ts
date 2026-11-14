import { validateObjective, type ExpeditionMethod } from '../../missions/index.ts'
import { selectIceboundContext, selectIceboundView } from '../../../shared/store/iceboundSelectors.ts'
import type { GameState, GameAction } from '../../../shared/types/game.ts'
import type { ScienceSite, ExpeditionKind } from '../types/marsMap.ts'

// Schematic screen positions only; no location, terrain or science data is duplicated.
const positions = [{ x: 15, y: 10 }, { x: 85, y: 10 }, { x: 85, y: 91 }] as const
const assignments: Record<ExpeditionMethod, ExpeditionKind> = {
  'rover-only': 'rover', 'astronaut-team': 'astronaut', combined: 'combined',
}

export function selectIceboundExploration(state: GameState) {
  const view = selectIceboundView(state)
  const context = selectIceboundContext(state)
  const selection = validateObjective(context, 'icebound.site-selection')
  const recon = validateObjective(context, 'icebound.recon')
  const sites = view.sites.flatMap((assessment, index) => {
    const definition = assessment.site
    if (!definition) return []
    const selected = state.icebound.selectedSiteId === definition.id
    const observation = state.icebound.observations.find(item => item.siteId === definition.id)
    const canSelect = selection.eligible && assessment.allowed
    const marker: ScienceSite = {
      id: definition.id, label: definition.name, position: positions[index % positions.length],
      status: selected ? (state.icebound.report ? 'completed' : 'active') : canSelect ? 'available' : 'locked',
      assignment: selected && state.icebound.expedition ? assignments[state.icebound.expedition.plan.method] : undefined,
    }
    const statusLabel = { locked: 'Later', available: 'Ready', active: 'Chosen', completed: 'Done' }[marker.status]
    return [{
      ...marker, statusLabel, definition, observation, selected, canSelect,
      possibleMethods: assessment.possibleMethods,
      blockers: [...selection.issues, ...assessment.issues].map(issue => issue.explanation),
    }]
  })
  return { sites, selectedSiteId: state.icebound.selectedSiteId, recon,
    completionNotice: state.icebound.report ? {
      id: state.icebound.runId + ':report',
      message: state.icebound.report.findings[0]?.conclusion ?? 'Investigation complete.',
    } : undefined }
}
export type IceboundExplorationSite = ReturnType<typeof selectIceboundExploration>['sites'][number]

export function iceboundMapCommand(state: GameState, siteId?: string): GameAction {
  return { type: 'ICEBOUND_COMMAND', intent: siteId === undefined ? { type: 'RECON' } : { type: 'SELECT_SITE', siteId },
    expectedMissionRevision: state.icebound.revision }
}

