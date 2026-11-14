import type { GameState } from '../types/game.ts'

/** Immutable reducers may update a review despite returning blocker feedback. Feedback alone is not progress. */
export function hasGameplayChange(before: GameState, after: GameState): boolean {
  return (Object.keys(after) as (keyof GameState)[]).some(key => key !== 'feedback' && before[key] !== after[key])
}
