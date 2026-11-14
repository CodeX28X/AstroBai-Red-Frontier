import type { IceboundScienceReferenceId } from '../types/icebound.ts'

export interface IceboundScienceSource {
  id: IceboundScienceReferenceId
  title: string
  url: string
  context: string
  verification: 'page-reviewed' | 'landing-page-only'
  checkedOn: '2026-11-14'
}

/** Static references only. No live API, measurements, or mission procedures are imported. */
export const ICEBOUND_SCIENCE_SOURCES: readonly IceboundScienceSource[] = [
  { id: 'nasa-swim', title: 'SWIM subsurface water ice map', url: 'https://science.nasa.gov/resource/swim-map-shows-subsurface-water-ice-on-mars/', context: 'Orbital evidence can guide where to investigate buried ice; it does not establish this fictional site as safe.', verification: 'page-reviewed', checkedOn: '2026-11-14' },
  { id: 'nasa-perseverance-objectives', title: 'Perseverance science objectives', url: 'https://science.nasa.gov/mission/mars-2020-perseverance/science-objectives/', context: 'Geological context and careful sample documentation help interpret evidence. This game does not reproduce rover procedures.', verification: 'page-reviewed', checkedOn: '2026-11-14' },
  { id: 'nasa-mars-2020', title: 'Mars 2020 mission', url: 'https://science.nasa.gov/mission/mars-2020-perseverance/', context: 'Rover exploration and samples support investigations of Mars geology; this fictional ice investigation is not a NASA mission.', verification: 'page-reviewed', checkedOn: '2026-11-14' },
  { id: 'nasa-mars-trek', title: 'Mars Trek', url: 'https://trek.nasa.gov/mars/', context: 'Optional map exploration resource. Interactive data layers were not inspected or downloaded.', verification: 'landing-page-only', checkedOn: '2026-11-14' },
  { id: 'nasa-open-apis', title: 'NASA Open APIs', url: 'https://api.nasa.gov/', context: 'Future integration reference only; no API called and no data ingested.', verification: 'landing-page-only', checkedOn: '2026-11-14' },
  { id: 'csa-education', title: 'CSA STEM and youth resources', url: 'https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp', context: 'Optional educational resources for teachers; not an operational safety specification.', verification: 'page-reviewed', checkedOn: '2026-11-14' },
]
