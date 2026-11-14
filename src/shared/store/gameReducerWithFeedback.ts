import { gameReducer, GameActionRejectedError } from './gameReducer.ts'
import type { GameAction, GameState } from '../types/game.ts'

export function gameReducerWithFeedback(state: GameState, action: GameAction): GameState {
  try { return gameReducer(state, action) }
  catch (error) {
    if (!(error instanceof GameActionRejectedError)) throw error
    return { ...state, feedback: { kind: 'error', message: error.message, feedbackId: null } }
  }
}

