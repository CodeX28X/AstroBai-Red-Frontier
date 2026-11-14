import type { GameAction, GameState } from '../types/game.ts'

export const INITIAL_RESOURCES = {
  power: 100,
  oxygen: 100,
  water: 100,
  food: 100,
} as const

export function createInitialGameState(): GameState {
  return {
    phase: 'menu',
    sol: 0,
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
    actionLimits: { maxSol: 10 },
    protection: { storm: false, radiation: false },
    outcome: null,
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

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET_GAME':
      return createInitialGameState()

    case 'START_GAME':
      if (state.phase !== 'menu') return reject(action, 'game can only start from menu')
      return { ...state, phase: 'launch' }

    case 'ADVANCE_SOL':
      if (isTerminal(state)) return reject(action, 'game is terminal')
      if (state.phase === 'menu') return reject(action, 'game has not started')
      if (state.sol >= state.actionLimits.maxSol) return reject(action, 'maximum sol reached')
      return { ...state, sol: state.sol + 1 }

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
