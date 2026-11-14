import type { Resources } from '../../../../shared/types/game.ts'
import type { IceboundCapability, IceboundContext, IceboundIssue, ExpeditionPlan, SamplingMethod } from '../../types/icebound.ts'
import { EQUIPMENT_CATALOG, PREDEPLOYED_OUTPOST_BASELINE } from '../../data/equipmentCatalog.ts'
import { ICEBOUND_BALANCE } from '../../data/iceboundMission.ts'
import { ICEBOUND_SCENARIOS } from '../../data/iceboundScenarios.ts'
import { validateManifest } from '../preparation/validateManifest.ts'

/** Capability adapter only, not another equipment catalog. No catalog item is a drill or lab. */
export const ICEBOUND_EQUIPMENT_CAPABILITIES = {
  'field-rover': ['recon', 'rover'],
  'portable-oxygen-kit': ['eva'],
  'repair-toolkit': ['surface-sampling'],
  'sample-container-set': ['sample-handling'],
  'soil-analysis-kit': ['field-analysis'],
} as const satisfies Partial<Record<(typeof EQUIPMENT_CATALOG)[number]['id'], readonly IceboundCapability[]>>

export function iceboundIssue(code: IceboundIssue['code'], explanation: string, severity: IceboundIssue['severity'] = 'blocker'): IceboundIssue {
  return { code, severity, explanation, feedbackId: `icebound.issue.${code.toLowerCase()}` }
}
export function balanceFor(context: IceboundContext) { return context.balance ?? ICEBOUND_BALANCE }
export function scenarioFor(context: IceboundContext) {
  return ICEBOUND_SCENARIOS.find((scenario) => scenario.id === context.mission.scenarioId)
}
export function availableEquipment(context: IceboundContext): string[] {
  return context.preparation.manifest.optionalCargo
    .filter((entry) => entry.quantity > 0 && context.readiness.deployedEquipment.some(
      (item) => item.equipmentId === entry.equipmentId && item.status === 'operational',
    ))
    .map((entry) => entry.equipmentId)
}
export function capabilitiesFor(context: IceboundContext, equipmentIds = availableEquipment(context)): Set<IceboundCapability> {
  const capabilities = new Set(context.readiness.baselineCapabilities)
  const available = new Set(availableEquipment(context))
  const mapping: Partial<Record<string, readonly IceboundCapability[]>> = ICEBOUND_EQUIPMENT_CAPABILITIES
  for (const id of equipmentIds) {
    if (available.has(id)) for (const capability of mapping[id] ?? []) capabilities.add(capability)
  }
  return capabilities
}
export function baseIssues(context: IceboundContext): IceboundIssue[] {
  const { game, mission } = context
  const balance = balanceFor(context)
  const issues: IceboundIssue[] = []
  if (game.phase !== 'outpost') issues.push(iceboundIssue('OUTPOST_REQUIRED', 'This investigation happens at the outpost.'))
  if (game.outcome !== null) issues.push(iceboundIssue('MISSION_ENDED', 'The mission has ended. Keep the findings for debrief.'))
  if (!Number.isInteger(game.sol) || game.sol < balance.earliestSol || game.sol > balance.finalSol) {
    issues.push(iceboundIssue('SOL_WINDOW', 'Begin ICEBOUND from Sol 3 and finish within the mission window.'))
  }
  const preparation = context.preparation
  if (preparation.status !== 'confirmed' || preparation.confirmedAtRevision !== preparation.revision ||
      preparation.reviewedRevision !== preparation.revision || !preparation.latestReview?.allowed ||
      preparation.manifest.missionId !== 'icebound' || preparation.manifest.baselineId !== PREDEPLOYED_OUTPOST_BASELINE.id ||
      !validateManifest(preparation.manifest, preparation.cargoCapacityUnits).valid) {
    issues.push(iceboundIssue('CONFIRMED_MANIFEST_REQUIRED', 'A valid confirmed equipment manifest is needed.'))
  }
  const costs = [balance.recon, ...Object.values(balance.expedition), ...Object.values(balance.sampling), balance.analysis]
  if (!Number.isInteger(balance.earliestSol) || !Number.isInteger(balance.finalSol) || balance.earliestSol < 3 ||
      balance.finalSol > 10 || balance.finalSol < balance.earliestSol ||
      !Number.isFinite(balance.travelPowerPerUnit) || balance.travelPowerPerUnit < 0 ||
      costs.some((cost) => Object.entries(cost).some(([key, value]) =>
        !['power', 'oxygen', 'water', 'food'].includes(key) || !Number.isFinite(value) || value < 0))) {
    issues.push(iceboundIssue('INVALID_BALANCE', 'The game cost configuration needs checking.'))
  }
  if (!scenarioFor(context) || !mission.runId.trim() || !Number.isSafeInteger(mission.revision) || mission.revision < 0) {
    issues.push(iceboundIssue('INVALID_MISSION_STATE', 'The investigation record needs checking.'))
  }
  if (!Number.isInteger(game.actionsRemaining) || game.actionsRemaining < 0 ||
      Object.values(game.resources).some((value) => !Number.isFinite(value) || value < 0)) {
    issues.push(iceboundIssue('INVALID_READINESS', 'Resource or action readiness is unavailable.'))
  }
  return issues
}
export function costIssues(context: IceboundContext, costs: Partial<Resources>, slots: number): IceboundIssue[] {
  const issues: IceboundIssue[] = []
  const codes = { power: 'INSUFFICIENT_POWER', oxygen: 'INSUFFICIENT_OXYGEN', water: 'INSUFFICIENT_WATER', food: 'INSUFFICIENT_FOOD' } as const
  for (const [resource, required] of Object.entries(costs) as [keyof Resources, number][]) {
    if (context.game.resources[resource] < required) issues.push(iceboundIssue(codes[resource], `This operation needs ${required} game units of ${resource}.`))
  }
  if (context.game.actionsRemaining < slots) issues.push(iceboundIssue('INSUFFICIENT_ACTIONS', 'There are not enough action slots left this sol. Try next sol.'))
  return issues
}
export function fieldIssues(context: IceboundContext, crew: boolean): IceboundIssue[] {
  const issues: IceboundIssue[] = []
  const readiness = context.readiness
  if (!readiness.communicationsReady) issues.push(iceboundIssue('COMMUNICATIONS_UNAVAILABLE', 'Restore the communications link before field work.'))
  if (readiness.weather === 'blocked' && !context.game.protection.storm) issues.push(iceboundIssue('WEATHER_BLOCKED', 'Wait for the weather advisory to clear or use approved protection.'))
  if (crew && readiness.radiation === 'blocked' && !context.game.protection.radiation) issues.push(iceboundIssue('RADIATION_BLOCKED', 'Crew field work must wait for protection or a cleared advisory.'))
  return issues
}
export function samplingCost(context: IceboundContext, method: SamplingMethod): Partial<Resources> {
  return { ...balanceFor(context).sampling[method] }
}
export function expeditionCost(context: IceboundContext, plan: ExpeditionPlan, travelRequirement: number): Partial<Resources> {
  const cost = { ...balanceFor(context).expedition[plan.method] }
  cost.power = (cost.power ?? 0) + travelRequirement * balanceFor(context).travelPowerPerUnit
  return cost
}
