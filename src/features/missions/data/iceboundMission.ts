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
  earliestSol: 3, finalSol: 10, recon: { power: 1 }, travelPowerPerUnit: 0,
  expedition: { 'rover-only': { power: 1 }, 'astronaut-team': { power: 0, oxygen: 1, water: 1, food: 1 }, combined: { power: 1, oxygen: 1, water: 1, food: 1 } },
  sampling: { 'surface-sampling': { power: 1 }, 'subsurface-drilling': { power: 1 } },
  analysis: { power: 1 },
}
