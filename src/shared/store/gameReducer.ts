import type { ActionCategory, GameAction, GameState, Resources } from '../types/game.ts'
import { PREDEPLOYED_OUTPOST_BASELINE } from '../../features/missions/data/equipmentCatalog.ts'
import { preparationEngine, createPreparationState } from '../../features/missions/engine/preparation/preparationEngine.ts'
import { validateMissionTransition, type MissionProgressionIntent } from '../../features/missions/engine/progression/missionProgression.ts'

export const INITIAL_RESOURCES = {
  power: 100,
  oxygen: 100,
  water: 100,
  food: 100,
} as const

export const MAX_ACTIONS_PER_SOL = 2
export const MAX_RESOURCE_VALUE = 100
const DEFAULT_CARGO_CAPACITY_UNITS = 30

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

export function createInitialGameState(): GameState {
  return {
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
    }, DEFAULT_CARGO_CAPACITY_UNITS),
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
  intent: Extract<GameAction, { type: 'SET_EQUIPMENT_QUANTITY' | 'REVIEW_MANIFEST' | 'CONFIRM_MANIFEST' }>,
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
    return withFeedback(nextState, 'Mission preparation confirmed. The manifest is locked.', 'success', 'manifest-confirmed')
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

  const proposedResources = { ...state.resources }
  let resourcesChanged = false
  for (const [resource, required] of Object.entries(resolution.resourceRequirements) as [keyof Resources, number][]) {
    if (!Number.isFinite(required) || required < 0 || proposedResources[resource] < required) {
      return withFeedback(state, `Not enough ${resource} to complete this mission transition.`, 'error')
    }
  }

  const objectiveChanges = new Map<string, boolean>()
  for (const effect of resolution.effects) {
    for (const [resource, delta] of Object.entries(effect.resourceDeltas) as [keyof Resources, number][]) {
      if (!Number.isFinite(delta)) {
        return withFeedback(state, `The proposed ${resource} change is invalid.`, 'error')
      }
      const nextValue = proposedResources[resource] + delta
      if (nextValue < 0 || nextValue > MAX_RESOURCE_VALUE) {
        return withFeedback(state, `The proposed ${resource} balance is outside its safe range.`, 'error')
      }
      proposedResources[resource] = nextValue
      resourcesChanged ||= nextValue !== state.resources[resource]
    }
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

  for (const [resource, value] of Object.entries(proposedResources) as [keyof Resources, number][]) {
    if (!Number.isFinite(value) || value < 0 || value > MAX_RESOURCE_VALUE) {
      return withFeedback(state, `The ${resource} balance is outside its safe range.`, 'error')
    }
  }

  const objectives = [...state.objectives]
  for (const [id, completed] of objectiveChanges) {
    const index = objectives.findIndex((objective) => objective.id === id)
    if (index === -1) objectives.push({ id, completed })
    else objectives[index] = { ...objectives[index]!, completed }
  }

  return {
    ...state,
    phase: resolution.nextPhase,
    resources: resourcesChanged ? proposedResources : state.resources,
    objectives,
    selectedLandingSite: intent.type === 'SELECT_LANDING_SITE' ? intent.siteId : state.selectedLandingSite,
    outcome: resolution.debrief?.outcome ?? state.outcome,
    feedback: {
      kind: 'success',
      message: resolution.message,
      feedbackId: resolution.effects[0]?.feedbackId ?? null,
    },
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET_GAME':
      return createInitialGameState()

    case 'START_GAME':
      return applyMissionTransition(state, action)

    case 'SET_EQUIPMENT_QUANTITY':
    case 'REVIEW_MANIFEST':
    case 'CONFIRM_MANIFEST':
      return applyPreparationIntent(state, action)

    case 'BEGIN_LAUNCH':
    case 'COMPLETE_LAUNCH':
    case 'SELECT_LANDING_SITE':
    case 'ENTER_DEBRIEF':
      return applyMissionTransition(state, action)

    case 'ADVANCE_SOL':
      if (isTerminal(state)) return reject(action, 'game is terminal')
      if (state.phase !== 'outpost') return reject(action, 'sols can only advance during outpost gameplay')
      if (state.sol >= state.actionLimits.maxSol) return reject(action, 'maximum sol reached')
      return {
        ...state,
        sol: state.sol + 1,
        completedSol: state.sol + 1,
        actionsRemaining: state.actionLimits.maxActionsPerSol,
      }

    case 'SPEND_ACTION_SLOT': {
      if (isTerminal(state)) return reject(action, 'game is terminal')
      if (state.phase !== 'outpost') return reject(action, 'major actions are only available at the outpost')
      if (!action.actionId.trim()) return reject(action, 'action ID is required')
      const actionId = action.actionId.trim()
      if (state.spentActionIds.includes(actionId)) return reject(action, 'action has already been completed')
      const cost = getActionSlotCost(action.category)
      if (state.actionsRemaining < cost) return reject(action, 'no major actions remain this sol')
      return {
        ...state,
        actionsRemaining: state.actionsRemaining - cost,
        spentActionIds: [...state.spentActionIds, actionId],
      }
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
      return exhaustiveAction
    }
  }
}
