import type { GameState, Resources } from '../../../shared/types/game.ts'
import { productionReadiness, type FacilityOperationId } from '../../simulation/outpostSystems.ts'

export type HelpDestination = 'energy' | 'supplies' | 'safety' | 'end-sol' | 'sites' | 'plan' | 'mission' | 'report' | 'preparation' | 'landing'
export interface ActionHelp { reason: string; next: string; destination: HelpDestination }

/** The engine supplies the reason; this adapter only points to a useful existing control. */
export function actionHelp(reason: string, state?: GameState): ActionHelp {
  const lower = reason.toLowerCase()
  if (state?.phase === 'preparation') return { reason, next: /locked|confirmed/.test(lower) ? 'Continue to launch when you are ready.' : /cargo|room|equipment/.test(lower) ? 'Remove an extra pack or optional equipment, then try again.' : 'Adjust your supplies, then ask Mission Control to review.', destination: 'preparation' }
  if (state?.phase === 'landing') return { reason, next: 'Choose a landing place that fits your supplies.', destination: 'landing' }
  if (/action|jobs left|already done/.test(lower)) return { reason, next: 'Try the next Mars Day.', destination: 'end-sol' }
  if (/power|energy/.test(lower)) return { reason, next: 'Check Energy at the solar array.', destination: 'energy' }
  if (/oxygen|water|food|supplies|resource/.test(lower)) return { reason, next: 'Check our supplies and production.', destination: 'supplies' }
  if (/sample|earlier|expedition|site|plan/.test(lower)) return { reason, next: 'Follow the next step in our mission log.', destination: 'mission' }
  if (/ended|complete|recorded/.test(lower)) return { reason, next: 'Read our findings or mission notes.', destination: 'report' }
  if (/sol|mars day|window/.test(lower)) return { reason, next: 'ICEBOUND begins on Mars Day 3.', destination: 'end-sol' }
  if (/crew|airlock|eva|hazard|rover|working|operational|capability|equipment|tools/.test(lower)) return { reason, next: 'Check Safety for equipment and crew readiness.', destination: 'safety' }
  return { reason, next: 'Check the mission log for the next step.', destination: 'mission' }
}

export const RESOURCE_RECOVERY: Record<keyof Resources, FacilityOperationId> = { power: 'collect-energy', oxygen: 'replenish-oxygen', water: 'recycle-water', food: 'harvest-food' }
const urgency = ['oxygen', 'power', 'water', 'food'] as const
export function lowResourceWarnings(state: GameState) {
  return urgency.filter(id => state.resources[id] <= 2).sort((a,b) => state.resources[a] - state.resources[b]).map(id => {
    const quantity = state.resources[id], readiness = productionReadiness(state, RESOURCE_RECOVERY[id])
    const label = id === 'power' ? 'energy' : id === 'oxygen' ? 'air' : id
    const recovery = id === 'power' ? 'Collect energy at the solar array.' : id === 'food' ? 'Harvest food at the greenhouse.' : id === 'oxygen' ? 'Make oxygen in the habitat.' : 'Recycle water in the habitat.'
    return { id, quantity, message: `Only ${quantity} ${label} left!`, recovery: readiness.allowed ? recovery : `${readiness.reason} ${actionHelp(readiness.reason!, state).next}`, destination: (id === 'power' ? 'energy' : 'supplies') as HelpDestination }
  })
}
