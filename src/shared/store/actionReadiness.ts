import type { GameAction, GameState } from '../types/game.ts'
import { gameReducer } from './gameReducer.ts'

/** Read-only preview of the same pure transaction; the real dispatch always validates again. */
export function getActionBlocker(state: GameState, action: GameAction): string | undefined {
  try { const next = gameReducer(state, action); return next.feedback?.kind === 'error' ? next.feedback.message : undefined }
  catch (error) { return error instanceof Error ? error.message.replace(/^\w+ rejected: /, '') : 'Check the current mission requirements before continuing.' }
}
