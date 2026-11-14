import { useReducer, type ReactNode } from 'react'
import { GameContext } from './GameContext.ts'
import { useEffect, useState } from 'react'
import { gameReducer } from './gameReducer.ts'
import type { GameInitializationOptions } from '../types/iceboundIntegration.ts'
import { freshProviderSession, reduceProviderSession, type ProviderSession } from './providerSession.ts'
import { loadPlayerSave, emptyPlayerSave, writePlayerSave } from './playerSave.ts'

export function GameProvider({ children, initializationOptions, reportActionErrors = false, persistPlayerSession = false }: {
  children: ReactNode; initializationOptions?: GameInitializationOptions; reportActionErrors?: boolean; persistPlayerSession?: boolean
}) {
  const [session, dispatch] = useReducer((previous: ProviderSession, action: Parameters<typeof gameReducer>[1]) =>
    reportActionErrors || previous.persist ? reduceProviderSession(previous, action) :
      { ...previous, state: gameReducer(previous.state, action) }, undefined, () => {
      if (!persistPlayerSession) return freshProviderSession(initializationOptions)
      let loaded = emptyPlayerSave()
      if (typeof window !== 'undefined') {
        try { loaded = loadPlayerSave(window.localStorage) }
        catch { loaded.notice = 'Saving is unavailable. Keep this page open to continue playing.' }
      }
      return { ...loaded, persist: true }
    })
  const [storageError, setStorageError] = useState<string | null>(null)
  useEffect(() => {
    if (!session.persist || session.blocked) return
    try { writePlayerSave(window.localStorage, session.actions) }
    catch {
      // External storage failure is visible without changing gameplay state.
      // oxlint-disable-next-line react/set-state-in-effect
      setStorageError('Progress could not be saved. Keep this page open to continue playing.')
    }
  }, [session.persist, session.blocked, session.actions])

  return (
    <GameContext.Provider value={{ state: session.state, dispatch,
      save: { available: session.actions.length > 0 && !session.blocked, notice: storageError ?? session.notice } }}>
      {children}
    </GameContext.Provider>
  )
}
