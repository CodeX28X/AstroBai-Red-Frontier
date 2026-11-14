import { useReducer, type ReactNode } from 'react'
import { GameContext } from './GameContext.ts'
import { createInitialGameState, gameReducer } from './gameReducer.ts'

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState)

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}
