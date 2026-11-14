import type { IceboundBalance } from '../types/icebound.ts'
import type { MissionDefinition } from '../contracts.ts'
import { ICEBOUND_OBJECTIVES } from './iceboundObjectives.ts'

export const ICEBOUND_MISSION: MissionDefinition = {
  id: 'icebound', title: 'Project ICEBOUND',
  description: 'Investigate possible accessible subsurface ice and record an evidence-based conclusion.',
  prerequisites: [], objectives: ICEBOUND_OBJECTIVES.map(({ id, description }) => ({ id, description })),
}

/** Illustrative game units only. No recurring simulation rates or physical safety limits. */
export const ICEBOUND_BALANCE: IceboundBalance = {
  earliestSol: 3, finalSol: 10, recon: { power: 3 }, travelPowerPerUnit: 1,
  expedition: { 'rover-only': { power: 4 }, 'astronaut-team': { power: 1, oxygen: 6, water: 3, food: 2 }, combined: { power: 6, oxygen: 6, water: 3, food: 2 } },
  sampling: { 'surface-sampling': { power: 2 }, 'subsurface-drilling': { power: 4 } },
  analysis: { power: 2 },
}
