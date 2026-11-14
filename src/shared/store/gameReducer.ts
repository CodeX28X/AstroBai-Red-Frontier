import type { ActionCategory, GameAction, GameState, Resources } from '../types/game.ts'
import { resolveStoryDecision } from '../../features/missions/resolveStoryDecision.ts'
import type { MissionEffect, MissionResolution } from '../../features/missions/contracts.ts'

export const INITIAL_RESOURCES = {
  power: 100,
  oxygen: 100,
  water: 100,
  food: 100,
} as const

export const MAX_ACTIONS_PER_SOL = 2

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
    actionsRemaining: MAX_ACTIONS_PER_SOL,
    spentActionIds: [],
    resources: { ...INITIAL_RESOURCES },
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

function applyStoryResolution(state: GameState, resolution: MissionResolution): GameState {
  if (!resolution.allowed) {
    return withFeedback(state, resolution.feedbackMessage ?? resolution.reason ?? 'That choice is not available.', 'error')
  }

  if (resolution.nextPhase === null || resolution.completedDecisionId === null || resolution.feedbackId === null) {
    return withFeedback(state, 'That choice could not be completed. Please try again.', 'error')
  }

  if (state.objectives.some((objective) => objective.id === resolution.completedDecisionId && objective.completed)) {
    return withFeedback(state, 'That decision has already been completed.', 'error')
  }

  for (const [resource, required] of Object.entries(resolution.resourceRequirements) as [keyof Resources, number][]) {
    if (state.resources[resource] < required) {
      return withFeedback(
        state,
        `Not enough ${resource}: this choice needs ${required}, and you have ${state.resources[resource]}.`,
        'error',
      )
    }
  }

  // Build and validate the full next state before committing any part of a proposal.
  const resources = { ...state.resources }
  const objectiveChanges = new Map<string, boolean>()
  const effects: MissionEffect[] = resolution.proposedEffects

  for (const effect of effects) {
    for (const [resource, delta] of Object.entries(effect.resourceDeltas) as [keyof Resources, number][]) {
      if (!Number.isFinite(delta)) {
        return withFeedback(state, `The proposed ${resource} change is invalid.`, 'error')
      }
      const nextValue = resources[resource] + delta
      if (nextValue < 0) {
        return withFeedback(state, `This choice would leave ${resource} below zero.`, 'error')
      }
      resources[resource] = nextValue
    }

    for (const change of effect.objectiveChanges) {
      const alreadyCompleted = state.objectives.some(
        (objective) => objective.id === change.objectiveId && objective.completed,
      ) || objectiveChanges.get(change.objectiveId) === true
      if (change.completed && alreadyCompleted) {
        return withFeedback(state, 'That decision has already been completed.', 'error')
      }
      objectiveChanges.set(change.objectiveId, change.completed)
    }
  }

  const objectives = [...state.objectives]
  for (const [id, completed] of objectiveChanges) {
    const index = objectives.findIndex((objective) => objective.id === id)
    if (index === -1) {
      objectives.push({ id, completed })
    } else {
      objectives[index] = { ...objectives[index]!, completed }
    }
  }

  return {
    ...state,
    phase: resolution.nextPhase,
    resources,
    objectives,
    feedback: {
      kind: 'success',
      message: resolution.feedbackMessage ?? 'Decision recorded.',
      feedbackId: resolution.feedbackId,
    },
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET_GAME':
      return createInitialGameState()

    case 'START_GAME':
      if (state.phase !== 'menu') return reject(action, 'game can only start from menu')
      return { ...state, phase: 'launch', feedback: null }

    case 'ADVANCE_SOL':
      if (isTerminal(state)) return reject(action, 'game is terminal')
      if (state.phase === 'menu') return reject(action, 'game has not started')
      if (state.sol >= state.actionLimits.maxSol) return reject(action, 'maximum sol reached')
      return {
        ...state,
        sol: state.sol + 1,
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
      return applyStoryResolution(state, resolveStoryDecision(state, action.optionId))

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
