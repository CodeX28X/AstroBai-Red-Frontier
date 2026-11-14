import type { GameAction, GameState } from '../types/game.ts'
import type { GameInitializationOptions } from '../types/iceboundIntegration.ts'
import { createInitialGameState } from './gameReducer.ts'
import { gameReducerWithFeedback } from './gameReducerWithFeedback.ts'
import { hasGameplayChange } from './gameProgress.ts'
import { isPlayerAction, MAX_SAVED_ACTIONS, emptyPlayerSave, type SaveLoad } from './playerSave.ts'

export interface ProviderSession extends SaveLoad { persist: boolean }
export function freshProviderSession(options: GameInitializationOptions | undefined): ProviderSession {
  return { state: createInitialGameState(options), actions: [], notice: null, blocked: false, persist: false }
}
export function reduceProviderSession(session: ProviderSession, action: GameAction): ProviderSession {
  const state: GameState = gameReducerWithFeedback(session.state, action)
  if (action.type === 'RESET_GAME') return { ...session, state: session.persist ? emptyPlayerSave().state : state, actions: [], notice: null, blocked: false }
  if (!session.persist || !hasGameplayChange(session.state, state)) return { ...session, state }
  if (session.blocked) return { ...session, state }
  if (!isPlayerAction(action)) return { ...session, state, blocked: true, notice: 'This operation cannot be saved. Keep this page open.' }
  if (session.actions.length >= MAX_SAVED_ACTIONS) return { ...session, state, blocked: true, notice: 'This mission has reached the save limit. Keep this page open.' }
  return { ...session, state, actions: [...session.actions, structuredClone(action)], blocked: false, notice: null }
}

