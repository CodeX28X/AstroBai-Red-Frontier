import type { GameState, Resources } from '../../shared/types/game.ts'
import type { OutpostOperationId } from '../../shared/types/survival.ts'
import { resolveResourceEffects, RESOURCE_KEYS, MAX_RESOURCE_VALUE } from '../../shared/store/resourceEffects.ts'

/** Gentle fictional game balance, not human survival limits or NASA measurements. */
export const DAILY_SUPPLIES: Readonly<Resources> = { power: 10, oxygen: 8, water: 8, food: 10 }
export const OUTPOST_OPERATIONS = {
  recharge: { title: 'Charge the base', room: 'solar-array', description: 'Collect sunshine to refill your energy store.', cost: {}, gains: { power: 30 }, facilities: ['solar-array'] },
  harvest: { title: 'Pick food', room: 'greenhouse', description: 'Gather a fresh food supply from the greenhouse.', cost: { power: 4 }, gains: { food: 30 }, facilities: ['greenhouse'] },
  recycle: { title: 'Refresh air and water', room: 'habitat', description: 'Run the recycler to refill breathing air and clean water.', cost: { power: 3 }, gains: { oxygen: 25, water: 25 }, facilities: ['habitat', 'water-extractor'] },
} as const

export function nextDayForecast(state: GameState) {
  const use = state.survival ? DAILY_SUPPLIES : { power: 0, oxygen: 0, water: 0, food: 0 }
  const resources = { ...state.resources }
  const shortages: (keyof Resources)[] = []
  for (const key of RESOURCE_KEYS) {
    resources[key] = Math.max(0, resources[key] - use[key])
    if (state.survival && resources[key] <= 0) shortages.push(key)
  }
  return { resources, shortages, use }
}
export function supplyLevel(state: GameState, key: keyof Resources): 'ready' | 'low' | 'urgent' {
  if (!state.survival) return 'ready'
  if (state.resources[key] <= DAILY_SUPPLIES[key]) return 'urgent'
  return state.resources[key] <= DAILY_SUPPLIES[key] * 2 ? 'low' : 'ready'
}
export function reviewOutpostOperation(state: GameState, operation: OutpostOperationId, expectedSol = state.sol) {
  const definition = Object.hasOwn(OUTPOST_OPERATIONS, operation) ? OUTPOST_OPERATIONS[operation] : undefined
  const id = 'outpost:' + encodeURIComponent(state.icebound.runId) + ':' + state.sol + ':' + operation
  const no = (reason: string) => ({ allowed: false as const, reason, id, resourceDeltas: {} as Partial<Resources> })
  if (!state.survival) return no('Base-care jobs are not enabled in this mission.')
  if (state.phase !== 'outpost') return no(state.phase === 'debrief' ? 'This mission has ended. Start a new mission to play again.' : 'Land on Mars before using the base.')
  if (state.outcome !== null || state.sol >= state.actionLimits.maxSol) return no('This mission has ended. Start a new mission to play again.')
  if (expectedSol !== state.sol) return no('A new day has started. Choose the job again.')
  if (!definition) return no('Choose one of the base-care jobs.')
  if (state.survival.care.some(record => record.id === id) || state.appliedResolutionIds.includes(id) || state.spentActionIds.includes(id)) return no('This job is done for today. You can do it again tomorrow.')
  if (!resolveResourceEffects(state.resources, []).allowed) return no('The supply readings need checking.')
  if (!Number.isInteger(state.actionsRemaining) || state.actionsRemaining < 1 || state.actionsRemaining > state.actionLimits.maxActionsPerSol) return no('Both big jobs are used up today. Start the next day when supplies are ready.')
  if (definition.facilities.some(facility => state.facilities[facility] !== 'operational')) return no('The room is not ready for this job.')
  for (const [key, amount] of Object.entries(definition.cost)) {
    if (state.resources[key as keyof Resources] < amount) return no('There is not enough energy. Visit the solar panels to charge the base first.')
  }
  const gains: Partial<Resources> = {}
  for (const [key, amount] of Object.entries(definition.gains)) {
    const resource = key as keyof Resources
    gains[resource] = Math.min(amount, MAX_RESOURCE_VALUE - state.resources[resource])
  }
  if (!Object.values(gains).some(amount => amount > 0)) return no('These supplies are already full. Save your big job for later.')
  const resourceDeltas: Partial<Resources> = { ...gains }
  for (const [key, amount] of Object.entries(definition.cost)) {
    const resource = key as keyof Resources
    resourceDeltas[resource] = (resourceDeltas[resource] ?? 0) - amount
  }
  const check = resolveResourceEffects(state.resources, [resourceDeltas])
  if (!check.allowed) return no(check.reason)
  return { allowed: true as const, reason: null, id, resourceDeltas }
}

export function proposeDailyUpkeep(state: GameState) {
  if (!state.survival || state.survival.lastUpkeepSol !== state.sol || state.completedSol !== state.sol ||
      !resolveResourceEffects(state.resources, []).allowed) return { allowed: false as const, reason: 'The day or supply readings need checking.' }
  const forecast = nextDayForecast(state)
  return { allowed: true as const, resources: forecast.resources, endedBecause: forecast.shortages }
}

