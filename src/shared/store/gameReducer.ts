import type { ActionCategory, GameAction, GameState, Resources } from '../types/game.ts'
import { PREDEPLOYED_OUTPOST_BASELINE } from '../../features/missions/data/equipmentCatalog.ts'
import { preparationEngine, createPreparationState } from '../../features/missions/engine/preparation/preparationEngine.ts'
import { validateMissionTransition, type MissionProgressionIntent } from '../../features/missions/engine/progression/missionProgression.ts'
import { createIceboundState } from '../../features/missions/engine/icebound/iceboundEngine.ts'
import type { GameInitializationOptions } from '../types/iceboundIntegration.ts'
import { commissionIceboundOutpost, createIceboundPlanningState, createInitialIceboundReadiness, reduceIceboundAction, refreshIceboundStatus } from './iceboundIntegration.ts'
import { resolveResourceEffects } from './resourceEffects.ts'
import { SUPPLY_BALANCE, supplyReserves } from '../../features/missions/data/supplyBalance.ts'
import { dailyConsumptionDescription, dailyResources, facilityOperationKey, OUTPOST_BALANCE, productionReadiness, productionResources, resourceWarning } from '../../features/simulation/outpostSystems.ts'
export { MAX_RESOURCE_VALUE } from './resourceEffects.ts'

export const INITIAL_RESOURCES = SUPPLY_BALANCE.baseline

export const MAX_ACTIONS_PER_SOL = 3

export function getActionSlotCost(category: ActionCategory): 0 | 1 {
  switch (category) {
    case 'facility-inspection':
    case 'power-allocation':
      return 0
    case 'operation':
    case 'repair':
    case 'event-response':
    case 'exploration':
      return 1
    default: {
      const exhaustiveCategory: never = category
      return exhaustiveCategory
    }
  }
}

export function createInitialGameState(options: GameInitializationOptions = {}): GameState {
  return {
    resourceRevision: 0,
    consumedSols: [],
    guidance: { inspections: [], completedDialogueIds: [] },
    phase: 'menu',
    sol: 0,
    completedSol: 0,
    actionsRemaining: MAX_ACTIONS_PER_SOL,
    spentActionIds: [],
    resources: { ...INITIAL_RESOURCES },
    preparation: createPreparationState({
      missionId: 'icebound',
      baselineId: PREDEPLOYED_OUTPOST_BASELINE.id,
      optionalCargo: [],
    }, SUPPLY_BALANCE.cargoCapacity, true),
    selectedLandingSite: null,
    facilities: {
      habitat: 'unbuilt',
      'solar-array': 'unbuilt',
      greenhouse: 'unbuilt',
      'water-extractor': 'unbuilt',
    },
    missions: {
      icebound: 'locked',
      'power-grid': 'locked',
      'solar-storm': 'locked',
      'life-support': 'locked',
    },
    objectives: [],
    activeEvent: null,
    actionLimits: { maxSol: 10, maxActionsPerSol: MAX_ACTIONS_PER_SOL },
    protection: { storm: false, radiation: false },
    outcome: null,
    feedback: null,
    icebound: createIceboundState(options.runId ?? 'game-1', options.scenarioId),
    iceboundPlanning: createIceboundPlanningState(),
    iceboundReadiness: createInitialIceboundReadiness(options),
    appliedResolutionIds: [],
    iceboundEvents: [],
  }
}

export const INITIAL_GAME_STATE = createInitialGameState()

export class GameActionRejectedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GameActionRejectedError'
  }
}

const terminalPhases = new Set<GameState['phase']>(['debrief'])

function reject(action: GameAction, reason: string): never {
  throw new GameActionRejectedError(`${action.type} rejected: ${reason}`)
}

function isTerminal(state: GameState): boolean {
  return state.outcome !== null || terminalPhases.has(state.phase)
}

function withFeedback(state: GameState, message: string, kind: 'success' | 'error', feedbackId: string | null = null): GameState {
  return { ...state, feedback: { kind, message, feedbackId } }
}

function reviewFeedbackMessage(state: GameState): string {
  const review = state.preparation.latestReview
  if (!review) return 'Mission Control review is unavailable.'
  if (!review.allowed) {
    const firstBlocker = review.blockers[0]?.explanation
    return `Mission Control found ${review.blockers.length} blocker(s). ${firstBlocker ?? 'Fix the blockers before confirming.'}`
  }
  if (review.warnings.length > 0) {
    return `Mission Control review complete with ${review.warnings.length} warning(s). ${review.warnings[0]?.explanation ?? ''}`.trim()
  }
  if (review.recommendations.length > 0) {
    return `Mission Control review complete with ${review.recommendations.length} recommendation(s). ${review.recommendations[0]?.explanation ?? ''}`.trim()
  }
  return 'Mission Control review complete. The manifest is ready to confirm.'
}

function applyPreparationIntent(
  state: GameState,
  intent: Extract<GameAction, { type: 'SET_RANDOMIZED_SUPPLIES' | 'SET_EQUIPMENT_QUANTITY' | 'SET_SUPPLY_QUANTITY' | 'SET_SCIENCE_KIT' | 'REVIEW_MANIFEST' | 'CONFIRM_MANIFEST' }>,
): GameState {
  if (state.phase !== 'preparation') {
    return withFeedback(state, 'Preparation can only be changed before launch.', 'error')
  }
  const resolution = preparationEngine(state.preparation, intent)
  const nextState = { ...state, preparation: resolution.state }
  if (!resolution.accepted) {
    return withFeedback(nextState, resolution.issues[0]?.message ?? 'The preparation action was rejected.', 'error')
  }
  if (intent.type === 'REVIEW_MANIFEST') {
    return withFeedback(nextState, reviewFeedbackMessage(nextState), 'success', 'mission-control-review')
  }
  if (intent.type === 'CONFIRM_MANIFEST') {
    return withFeedback(resolution.state.supplies ? { ...nextState, resources: supplyReserves(resolution.state.supplies) } : nextState, 'Mission preparation confirmed. The manifest is locked.', 'success', 'manifest-confirmed')
  }
  return { ...nextState, feedback: null }
}

function applyMissionTransition(state: GameState, intent: MissionProgressionIntent): GameState {
  if (intent.type === 'SELECT_LANDING_SITE' && state.selectedLandingSite !== null) {
    return withFeedback(state, 'A landing site has already been selected.', 'error')
  }
  const resolution = validateMissionTransition(state, intent)
  if (!resolution.allowed) return withFeedback(state, resolution.message, 'error')
  if (resolution.nextPhase === null || resolution.completionMarker === null) {
    return withFeedback(state, 'The mission transition could not be completed.', 'error')
  }

  for (const [resource, required] of Object.entries(resolution.resourceRequirements) as [keyof Resources, number][]) {
    if (!Number.isFinite(required) || required < 0 || state.resources[resource] < required) {
      return withFeedback(state, `Not enough ${resource} to complete this mission transition.`, 'error')
    }
  }
  const resourceResult = resolveResourceEffects(state.resources, resolution.effects.map((effect) => effect.resourceDeltas))
  if (!resourceResult.allowed) return withFeedback(state, resourceResult.reason, 'error')

  const objectiveChanges = new Map<string, boolean>()
  for (const effect of resolution.effects) {
    for (const change of effect.objectiveChanges) {
      const alreadyCompleted = state.objectives.some(
        (objective) => objective.id === change.objectiveId && objective.completed,
      ) || objectiveChanges.get(change.objectiveId) === true
      if (change.completed && alreadyCompleted) {
        return withFeedback(state, 'That mission effect has already been applied.', 'error')
      }
      objectiveChanges.set(change.objectiveId, change.completed)
    }
  }

  const objectives = [...state.objectives]
  for (const [id, completed] of objectiveChanges) {
    const index = objectives.findIndex((objective) => objective.id === id)
    if (index === -1) objectives.push({ id, completed })
    else objectives[index] = { ...objectives[index]!, completed }
  }

  const nextState: GameState = {
    ...state,
    phase: resolution.nextPhase,
    preparation: intent.type === 'START_GAME' ? { ...state.preparation, supplies: { ...SUPPLY_BALANCE.suggested } } : state.preparation,
    resources: resourceResult.resources,
    objectives,
    selectedLandingSite: intent.type === 'SELECT_LANDING_SITE' ? intent.siteId : state.selectedLandingSite,
    outcome: resolution.debrief?.outcome ?? state.outcome,
    feedback: {
      kind: 'success',
      message: resolution.message,
      feedbackId: resolution.effects[0]?.feedbackId ?? null,
    },
  }
  return intent.type === 'SELECT_LANDING_SITE' ? commissionIceboundOutpost(nextState) : refreshIceboundStatus(nextState)
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET_GAME':
      return createInitialGameState({ runId: state.icebound.runId, scenarioId: state.icebound.scenarioId,
        preparationMode: state.preparation.supplies ? 'supplies' : undefined,
        installedCapabilities: state.iceboundReadiness.baselineCapabilities })

    case 'ICEBOUND_COMMAND':
    case 'SET_ICEBOUND_EXPEDITION_PLAN':
    case 'REVIEW_ICEBOUND_EXPEDITION_PLAN':
    case 'CONFIRM_ICEBOUND_EXPEDITION_PLAN':
      return reduceIceboundAction(state, action)

    case 'START_GAME':
      return applyMissionTransition(state, action)

    case 'SET_RANDOMIZED_SUPPLIES':
    case 'SET_EQUIPMENT_QUANTITY':
    case 'SET_SUPPLY_QUANTITY':
    case 'SET_SCIENCE_KIT':
    case 'REVIEW_MANIFEST':
    case 'CONFIRM_MANIFEST':
      return applyPreparationIntent(state, action)
    case 'INSPECT_LOCATION': {
      if (state.phase !== 'outpost' || !['habitat', 'solar-array', 'greenhouse', 'research-lab', 'energy', 'supplies', 'safety'].includes(action.locationId)) return withFeedback(state, 'That inspection is not available here.', 'error')
      const id = `${state.sol}:${action.locationId}`
      if (state.guidance.inspections.includes(id)) return state
      return { ...state, guidance: { ...state.guidance, inspections: [...state.guidance.inspections, id] }, feedback: null }
    }
    case 'ACKNOWLEDGE_DIALOGUE': {
      if (!['outpost', 'preparation', 'launch', 'landing', 'debrief'].includes(state.phase) || typeof action.dialogueId !== 'string' || !/^[a-zA-Z0-9:._-]{1,120}$/.test(action.dialogueId)) return withFeedback(state, 'That conversation is not available.', 'error')
      if (state.guidance.completedDialogueIds.includes(action.dialogueId)) return state
      return { ...state, guidance: { ...state.guidance, completedDialogueIds: [...state.guidance.completedDialogueIds, action.dialogueId].slice(-300) }, feedback: null }
    }

    case 'BEGIN_LAUNCH':
    case 'COMPLETE_LAUNCH':
    case 'SELECT_LANDING_SITE':
    case 'ENTER_DEBRIEF':
      return applyMissionTransition(state, action)

    case 'ADVANCE_SOL': {
      if (isTerminal(state)) return reject(action, 'game is terminal')
      if (state.phase !== 'outpost') return reject(action, 'Mars Days can only advance during outpost gameplay')
      if (state.completedSol >= state.actionLimits.maxSol) return reject(action, 'maximum sol reached')
      if (action.expectedSol !== undefined && action.expectedSol !== state.sol) return reject(action, 'this Mars Day has already advanced')
      if (state.consumedSols.includes(state.sol)) return reject(action, 'this Mars Day has already been consumed')
      const daily = dailyResources(state.resources)
      if (!daily.allowed) return { ...state, outcome: 'failure', actionsRemaining:0, feedback: {kind:'success',code:'SUPPLY_FAILURE',message:'Not enough daily supplies. The mission has ended without a daily deduction.',feedbackId:'outpost.supply-failure'} }
      const failed = Object.values(daily.resources).some(value=>value===0)
      return refreshIceboundStatus({
        ...state,
        resources: daily.resources,
        resourceRevision: state.resourceRevision + 1,
        consumedSols: [...state.consumedSols,state.sol],
        outcome: failed ? 'failure' : state.outcome,
        sol: failed ? state.sol : Math.min(state.sol + 1, state.actionLimits.maxSol),
        completedSol: state.sol,
        actionsRemaining: !failed && state.sol < state.actionLimits.maxSol ? state.actionLimits.maxActionsPerSol : 0,
        feedback: {kind:'success',message:failed?'Daily supplies ran out. The mission has ended.':`Mars Day ${state.sol} complete. Daily use: ${dailyConsumptionDescription()}. ${resourceWarning(daily.resources)}`.trim(),feedbackId:'outpost.daily-consumption'},
      })
    }

    case 'OPERATE_FACILITY': {
      if (action.expectedSol !== state.sol || action.expectedResourceRevision !== state.resourceRevision) return withFeedback(state,'Resources changed. Check the facility again.','error')
      const readiness = productionReadiness(state, action.operationId)
      if (!readiness.allowed) return withFeedback(state,readiness.reason!,'error')
      const result = productionResources(state, action.operationId)
      if (!result.allowed) return withFeedback(state,result.reason,'error')
      const operation = OUTPOST_BALANCE.operations[action.operationId]
      return refreshIceboundStatus({ ...state, resources: result.resources, resourceRevision: state.resourceRevision+1,
        actionsRemaining: state.actionsRemaining-1, spentActionIds:[...state.spentActionIds,facilityOperationKey(state.sol,action.operationId)],
        feedback:{kind:'success',code:'FACILITY_PRODUCED',message:`${operation.name}: +${result.resources[operation.resource]-state.resources[operation.resource]} ${operation.resource==='power'?'Energy':operation.resource}. One Action used.`,feedbackId:facilityOperationKey(state.sol,action.operationId)} })
    }

    case 'SPEND_ACTION_SLOT': {
      if (isTerminal(state)) return reject(action, 'game is terminal')
      if (state.completedSol >= state.actionLimits.maxSol) return reject(action, 'game is terminal')
      if (state.phase !== 'outpost') return reject(action, 'major actions are only available at the outpost')
      if (!action.actionId.trim()) return reject(action, 'action ID is required')
      const actionId = action.actionId.trim()
      if (state.spentActionIds.includes(actionId)) return reject(action, 'action has already been completed')
      const cost = getActionSlotCost(action.category)
      if (state.actionsRemaining < cost) return reject(action, 'no major actions remain this Mars Day')
      return refreshIceboundStatus({
        ...state,
        actionsRemaining: state.actionsRemaining - cost,
        spentActionIds: [...state.spentActionIds, actionId],
      })
    }

    case 'CHOOSE_STORY_OPTION':
      return withFeedback(state, 'Legacy story choices are not part of the MVP mission flow.', 'error')

    case 'SET_PHASE':
    case 'UPDATE_RESOURCES':
    case 'SET_FACILITY_STATUS':
    case 'SET_MISSION_STATUS':
    case 'UPDATE_OBJECTIVE':
    case 'SET_ACTIVE_EVENT':
    case 'SET_PROTECTION':
    case 'SET_OUTCOME':
      return reject(action, 'action is not implemented in this phase')

    default: {
      const exhaustiveAction: never = action
      void exhaustiveAction
      return reject(action, 'unsupported action')
    }
  }
}
