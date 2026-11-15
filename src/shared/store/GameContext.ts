import { createContext } from 'react'
import type { GameAction, GameState } from '../types/game.ts'

export interface GameContextValue {
  state: GameState
  dispatch: (action: GameAction) => void
  saveStatus: 'saved' | 'unavailable' | 'corrupt' | 'none'
}

export const GameContext = createContext<GameContextValue | null>(null)
