import type { Resources } from '../../../shared/types/game.ts'
export const resourceNames: Record<keyof Resources, string> = { power: 'Energy', oxygen: 'Air', water: 'Water', food: 'Food' }
export const methodNames = { 'rover-only': 'Rover only', 'astronaut-team': 'Astronaut team', combined: 'Crew and rover' }
export const samplingNames = { 'surface-sampling': 'Surface sampling', 'subsurface-drilling': 'Drilling below the surface' }
export const findingNames = { 'supports-accessible-ice': 'Evidence of ice', 'no-accessible-ice-detected': 'No ice detected in this sample', inconclusive: 'We cannot tell yet', 'analysis-incomplete': 'Analysis incomplete' }
