import type { IceboundState, IceboundObjectiveId } from '../../types/icebound.ts'

/** Global recon is shared; every other completion belongs to its investigation. */
export function activeObjectives(mission: Readonly<IceboundState>): readonly IceboundObjectiveId[] {
  return [...mission.completedObjectives.filter(id=>id==='icebound.recon'),
    ...(mission.investigations.find(site=>site.siteId===mission.selectedSiteId)?.completedObjectives ?? [])]
}
export function objectiveMarker(mission: Readonly<IceboundState>, id: string, siteId = mission.selectedSiteId) {
  return id==='icebound.recon' ? id : `${siteId}:${id}`
}
export function operationKey(mission: Readonly<IceboundState>, id: string, siteId = mission.selectedSiteId) {
  return id==='recon' ? id : `${siteId}:${id}`
}
export function currentSamples(mission: Readonly<IceboundState>) { return mission.samples.filter(sample=>sample.expeditionId===mission.expedition?.id) }
export function currentAnalyses(mission: Readonly<IceboundState>) {
  const samples = new Set(currentSamples(mission).map(sample=>sample.id))
  return mission.analyses.filter(analysis=>samples.has(analysis.sampleId))
}
