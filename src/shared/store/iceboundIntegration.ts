import type { GameState } from '../types/game.ts'
import type { GameInitializationOptions, IceboundPlanningState, IceboundStoreAction } from '../types/iceboundIntegration.ts'
import type {
  ExpeditionPlan, IceboundCapability, IceboundIntent, IceboundReadiness, IceboundResolution,
} from '../../features/missions/types/icebound.ts'
import { iceboundEngine } from '../../features/missions/engine/icebound/iceboundEngine.ts'
import { validateObjective, getMissionStatus } from '../../features/missions/engine/icebound/objectives.ts'
import { reviewExpeditionPlan } from '../../features/missions/engine/icebound/planning.ts'
import { selectIceboundContext } from './iceboundSelectors.ts'
import { resolveResourceEffects } from './resourceEffects.ts'

export function createIceboundPlanningState(): IceboundPlanningState {
  return { draft: null, revision: 0, reviewedRevision: null, confirmedAtRevision: null, review: null }
}

export function createInitialIceboundReadiness(options: GameInitializationOptions): IceboundReadiness {
  const known: readonly IceboundCapability[] = ['recon', 'rover', 'eva', 'surface-sampling', 'drilling', 'sample-handling', 'field-analysis', 'lab-analysis']
  const installed = [...new Set(options.installedCapabilities ?? [])]
  if (installed.some((capability) => !known.includes(capability))) throw new Error('Unknown installed ICEBOUND capability.')
  return { deployedEquipment: [], baselineCapabilities: installed, roverOperational: false, roverEnergyReady: false,
    crewAvailable: false, crewSafeForEva: false, communicationsReady: false, laboratoryOperational: false,
    weather: 'clear', radiation: 'clear' }
}

/** Commission only the declared pre-deployed habitat/communications and actual confirmed cargo. */
export function commissionIceboundOutpost(state: GameState): GameState {
  const deployedEquipment = state.preparation.manifest.optionalCargo.map((entry) => ({ equipmentId: entry.equipmentId, status: 'operational' as const }))
  const rover = deployedEquipment.some((item) => item.equipmentId === 'field-rover')
  return refreshIceboundStatus({ ...state,
    facilities: { ...state.facilities, habitat: 'operational' },
    iceboundReadiness: { ...state.iceboundReadiness, deployedEquipment,
      roverOperational: rover, roverEnergyReady: rover, crewAvailable: true, crewSafeForEva: true,
      communicationsReady: true,
      laboratoryOperational: state.iceboundReadiness.baselineCapabilities.includes('lab-analysis'),
    },
  })
}

export function refreshIceboundStatus(state: GameState): GameState {
  const status = getMissionStatus(selectIceboundContext(state)).status
  return status === state.missions.icebound ? state : { ...state, missions: { ...state.missions, icebound: status } }
}

function reject(state: GameState, code: string, message: string): GameState {
  return { ...state, feedback: { kind: 'error', code, message, feedbackId: `icebound.integration.${code.toLowerCase()}` } }
}

function planShape(value: unknown): value is ExpeditionPlan {
  if (!value || typeof value !== 'object') return false
  const plan = value as Record<string, unknown>
  return typeof plan.siteId === 'string' && typeof plan.method === 'string' && typeof plan.activity === 'string' &&
    Array.isArray(plan.equipmentIds) && plan.equipmentIds.every((id) => typeof id === 'string') &&
    plan.supplies !== null && typeof plan.supplies === 'object' && !Array.isArray(plan.supplies)
}

function runtimeIntentShape(value: unknown): value is Exclude<IceboundIntent, { type: 'APPROVE_PLAN' }> {
  if (!value || typeof value !== 'object') return false
  const intent = value as Record<string, unknown>
  switch (intent.type) {
    case 'RECON': case 'EXECUTE_EXPEDITION': case 'GENERATE_REPORT': return true
    case 'SELECT_SITE': return typeof intent.siteId === 'string'
    case 'ANALYZE_SAMPLE': return typeof intent.sampleId === 'string'
    case 'COLLECT_SAMPLE': return intent.method === 'surface-sampling' || intent.method === 'subsurface-drilling'
    default: return false
  }
}

function plansEqual(first: ExpeditionPlan | null, second: ExpeditionPlan): boolean {
  return first !== null && first.siteId === second.siteId && first.method === second.method && first.activity === second.activity &&
    first.equipmentIds.length === second.equipmentIds.length && first.equipmentIds.every((id, index) => id === second.equipmentIds[index]) &&
    JSON.stringify(first.supplies) === JSON.stringify(second.supplies)
}

/** Central effect transaction. Called only with freshly computed D proposals, never a client payload. */
export function applyIceboundResolution(state: GameState, resolution: IceboundResolution): GameState {
  if (state.phase !== 'outpost' || state.outcome !== null) return reject(state, 'MISSION_UNAVAILABLE', 'ICEBOUND operations require an active outpost mission.')
  if (!resolution.allowed) {
    const rejected = reject(state, resolution.code, resolution.reason)
    return { ...rejected, feedback: { ...rejected.feedback!, feedbackId: resolution.feedbackIds[0] ?? null,
      ...(resolution.analysis ? { analysis: structuredClone(resolution.analysis) } : {}) } }
  }
  const effects = resolution.proposedEffects
  if (resolution.expectedMissionRevision !== state.icebound.revision || resolution.expectedSol !== state.sol) {
    return reject(state, 'STALE_RESOLUTION', 'Mission readiness changed. Submit the operation again.')
  }
  if (state.appliedResolutionIds.includes(resolution.resolutionId) || state.spentActionIds.includes(resolution.resolutionId) ||
      state.iceboundEvents.some((record) => record.resolutionId === resolution.resolutionId)) {
    return reject(state, 'DUPLICATE_RESOLUTION', 'This mission operation has already been recorded.')
  }
  const next = effects.nextMissionState
  if (next.runId !== state.icebound.runId || next.scenarioId !== state.icebound.scenarioId ||
      next.revision !== state.icebound.revision + 1 || new Set(next.resolvedOperationIds).size !== next.resolvedOperationIds.length ||
      next.resolvedOperationIds.length !== state.icebound.resolvedOperationIds.length + 1 ||
      state.icebound.resolvedOperationIds.some((id) => !next.resolvedOperationIds.includes(id))) {
    return reject(state, 'INVALID_PROGRESS', 'The mission progress proposal is invalid.')
  }
  if (!Number.isInteger(effects.actionSlotCost) || effects.actionSlotCost < 0 || effects.actionSlotCost > state.actionLimits.maxActionsPerSol ||
      !Number.isInteger(state.actionsRemaining) || state.actionsRemaining < effects.actionSlotCost) {
    return reject(state, 'INSUFFICIENT_ACTIONS', 'There are not enough action slots for this operation.')
  }
  const resources = resolveResourceEffects(state.resources, [effects.resourceDeltas])
  if (!resources.allowed) return reject(state, 'INVALID_RESOURCE_EFFECT', resources.reason)

  const objectives = [...state.objectives]
  for (const change of effects.objectiveChanges) {
    if (objectives.some((objective) => objective.id === change.objectiveId && objective.completed)) {
      return reject(state, 'DUPLICATE_OBJECTIVE', 'This objective has already been recorded.')
    }
    const index = objectives.findIndex((objective) => objective.id === change.objectiveId)
    if (index === -1) objectives.push({ id: change.objectiveId, completed: change.completed })
    else objectives[index] = { id: change.objectiveId, completed: change.completed }
  }
  const deployed = state.iceboundReadiness.deployedEquipment.map((item) => ({ ...item }))
  for (const change of effects.equipmentStatusChanges) {
    const item = deployed.find((equipment) => equipment.equipmentId === change.equipmentId)
    if (!item || !['unbuilt', 'operational', 'damaged', 'offline'].includes(change.status)) {
      return reject(state, 'INVALID_EQUIPMENT_EFFECT', 'A proposed equipment change is invalid.')
    }
    item.status = change.status
  }
  return {
    ...state, resources: resources.resources, objectives,
    icebound: structuredClone(next),
    iceboundReadiness: effects.equipmentStatusChanges.length ? { ...state.iceboundReadiness, deployedEquipment: deployed } : state.iceboundReadiness,
    actionsRemaining: state.actionsRemaining - effects.actionSlotCost,
    spentActionIds: effects.actionSlotCost ? [...state.spentActionIds, resolution.resolutionId] : state.spentActionIds,
    appliedResolutionIds: [...state.appliedResolutionIds, resolution.resolutionId],
    iceboundEvents: [...state.iceboundEvents, { resolutionId: resolution.resolutionId, event: structuredClone(resolution.event) }],
    missions: { ...state.missions, icebound: effects.missionStatus },
    feedback: { kind: 'success', code: 'ICEBOUND_ACCEPTED', message: 'ICEBOUND progress recorded.', feedbackId: resolution.feedbackIds[0] ?? null },
  }
}

export function reduceIceboundAction(state: GameState, action: IceboundStoreAction): GameState {
  if (state.phase !== 'outpost' || state.outcome !== null) return reject(state, 'MISSION_UNAVAILABLE', 'ICEBOUND operations require an active outpost mission.')
  const context = selectIceboundContext(state)
  if (action.type === 'ICEBOUND_COMMAND') {
    if (!runtimeIntentShape(action.intent)) return reject(state, 'INVALID_INTENT', 'Choose a supported ICEBOUND operation.')
    if (action.expectedMissionRevision !== undefined && action.expectedMissionRevision !== state.icebound.revision) {
      return reject(state, 'STALE_COMMAND', 'Mission progress changed. Check the current objective before acting.')
    }
    if (action.intent.type === 'EXECUTE_EXPEDITION' && (state.iceboundPlanning.confirmedAtRevision !== state.iceboundPlanning.revision || !state.icebound.approvedPlan)) {
      return reject(state, 'PLAN_CONFIRMATION_REQUIRED', 'Confirm the current expedition plan first.')
    }
    return applyIceboundResolution(state, iceboundEngine(context, action.intent))
  }

  if (state.icebound.approvedPlan || state.iceboundPlanning.confirmedAtRevision !== null) {
    return reject(state, 'PLAN_LOCKED', 'The expedition plan is already confirmed and locked.')
  }
  const eligibility = validateObjective(context, 'icebound.expedition-plan')
  if (!eligibility.eligible) return reject(state, eligibility.issues[0]!.code, eligibility.issues[0]!.explanation)
  const planning = state.iceboundPlanning
  if (action.type === 'SET_ICEBOUND_EXPEDITION_PLAN') {
    if (!planShape(action.plan)) return reject(state, 'INVALID_PLAN', 'Supply a valid expedition plan.')
    if (plansEqual(planning.draft, action.plan)) return state
    return { ...state, iceboundPlanning: { draft: structuredClone(action.plan), revision: planning.revision + 1,
      reviewedRevision: null, confirmedAtRevision: null, review: null }, feedback: null }
  }
  if (!planning.draft) return reject(state, 'PLAN_REQUIRED', 'Create an expedition plan before review or confirmation.')
  if (action.type === 'REVIEW_ICEBOUND_EXPEDITION_PLAN') {
    const review = reviewExpeditionPlan(context, planning.draft)
    return { ...state, iceboundPlanning: { ...planning, review, reviewedRevision: planning.revision },
      feedback: { kind: review.allowed ? 'success' : 'error', code: 'EXPEDITION_REVIEWED',
        message: review.allowed ? 'Expedition review complete. Warnings and recommendations are advisory.' : review.blockers[0]!.explanation,
        feedbackId: 'icebound.expedition.reviewed' } }
  }
  if (action.revision !== planning.revision || planning.reviewedRevision !== planning.revision || !planning.review) {
    return reject(state, 'STALE_REVIEW', 'Review the current expedition plan before confirming it.')
  }
  if (!planning.review.allowed) return reject(state, 'PLAN_BLOCKED', 'Resolve the expedition blockers before confirmation.')
  const resolution = iceboundEngine(context, { type: 'APPROVE_PLAN', plan: planning.draft })
  const nextState = applyIceboundResolution(state, resolution)
  if (nextState.icebound.revision === state.icebound.revision) return nextState
  return { ...nextState, iceboundPlanning: { ...planning, draft: null,
    confirmedAtRevision: planning.revision, review: reviewExpeditionPlan(context, planning.draft) } }
}
