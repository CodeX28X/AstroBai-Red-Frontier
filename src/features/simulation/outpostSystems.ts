import type { BuildingId, GameState, Resources } from '../../shared/types/game.ts'
import { resolveResourceEffects, RESOURCE_KEYS, MAX_RESOURCE_VALUE } from '../../shared/store/resourceEffects.ts'

/** Fictional game units, not physical quantities or NASA engineering rates. */
export const OUTPOST_BALANCE = {
  dailyConsumption: { power: 1, oxygen: 1, water: 1, food: 1 },
  passiveGeneration: { power: 0, oxygen: 0, water: 0, food: 0 },
  operations: {
    'collect-energy': { building: 'solar-array', resource: 'power', gain: 5, powerCost: 0, name: 'Collect energy' },
    'replenish-oxygen': { building: 'habitat', resource: 'oxygen', gain: 4, powerCost: 1, name: 'Replenish oxygen' },
    'recycle-water': { building: 'habitat', resource: 'water', gain: 4, powerCost: 1, name: 'Recycle water' },
    'harvest-food': { building: 'greenhouse', resource: 'food', gain: 4, powerCost: 1, name: 'Harvest food' },
  },
} as const
export type FacilityOperationId = keyof typeof OUTPOST_BALANCE.operations
export function facilityOperationKey(sol: number, operationId: FacilityOperationId) { return `facility:${sol}:${operationId}` }
export function productionReadiness(state: GameState, operationId: FacilityOperationId) {
  const operation = OUTPOST_BALANCE.operations[operationId]
  if (!operation) return { allowed: false, reason: 'Choose an available facility operation.' }
  const reason = state.phase !== 'outpost' || state.outcome || state.completedSol >= 10 ? 'Production needs an active outpost mission.' :
    state.facilities[operation.building] !== 'operational' ? 'This facility must be operational first.' :
    state.actionsRemaining < 1 ? 'No Actions left. Try the next Mars Day for three more Actions.' :
    state.spentActionIds.includes(facilityOperationKey(state.sol, operationId)) ? 'This facility job is already done for this Mars Day.' :
    state.resources[operation.resource] >= MAX_RESOURCE_VALUE ? 'This resource is already full.' :
    state.resources.power < operation.powerCost ? 'Collect energy at the solar array first.' : undefined
  return { allowed: !reason, reason }
}
export function operationsFor(building: BuildingId) {
  return (Object.keys(OUTPOST_BALANCE.operations) as FacilityOperationId[]).filter(id=>OUTPOST_BALANCE.operations[id].building===building)
}
export function productionResources(state: GameState, operationId: FacilityOperationId) {
  const op = OUTPOST_BALANCE.operations[operationId]
  return resolveResourceEffects(state.resources, [{power:-op.powerCost}, {[op.resource]:op.gain}])
}
export function dailyResources(resources: Resources) {
  const costs: Partial<Resources> = {}, passive: Partial<Resources> = {}
  for (const key of RESOURCE_KEYS) { costs[key] = -OUTPOST_BALANCE.dailyConsumption[key]; passive[key] = OUTPOST_BALANCE.passiveGeneration[key] }
  return resolveResourceEffects(resources, [costs,passive])
}
export function resourceWarning(resources: Resources) {
  const low=RESOURCE_KEYS.filter(key=>resources[key]<=2)
  return low.length ? `Low ${low.map(key=>key==='power'?'Energy':key).join(', ')}. Use facility jobs before ending the Mars Day.` : ''
}
export function dailyConsumptionDescription() {
  return Object.entries(OUTPOST_BALANCE.dailyConsumption).map(([key,amount])=>`${amount} ${key==='power'?'Energy':key[0].toUpperCase()+key.slice(1)}`).join(', ')
}
