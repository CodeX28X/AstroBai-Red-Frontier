import { useEffect, useReducer, type ReactNode } from 'react'
import { GameContext } from './GameContext.ts'
import { createInitialGameState, gameReducer } from './gameReducer.ts'
import { CAMPAIGN_OPTIONS } from './campaign.ts'
import { decodeSave, encodeSave, SAVE_KEY, type SavedCampaign } from './saveGame.ts'
import type { GameAction, GameState } from '../types/game.ts'

interface Session { state: GameState; actions: GameAction[]; campaign: SavedCampaign; saveStatus: 'saved' | 'unavailable' | 'corrupt' | 'none' }
function initialSession(): Session {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) { try { return { ...decodeSave(raw), saveStatus: 'saved' } } catch { return { state: createInitialGameState(CAMPAIGN_OPTIONS), campaign: 'supplies', actions: [], saveStatus: 'corrupt' } } }
  } catch { return { state: createInitialGameState(CAMPAIGN_OPTIONS), campaign: 'supplies', actions: [], saveStatus: 'unavailable' } }
  return { state: createInitialGameState(CAMPAIGN_OPTIONS), campaign: 'supplies', actions: [], saveStatus: 'none' }
}
function sessionReducer(session: Session, action: GameAction | { type: 'SAVE_STATUS'; status: Session['saveStatus'] }): Session {
  if (action.type === 'SAVE_STATUS') return session.saveStatus === action.status ? session : { ...session, saveStatus: action.status }
  if (action.type === 'RESET_GAME') return { ...session, campaign: 'supplies', actions: [], state: createInitialGameState(CAMPAIGN_OPTIONS) }
  try {
    const state = gameReducer(session.state, action)
    const actions = state.feedback?.kind === 'error' || state === session.state ? session.actions : [...session.actions, action]
    return { ...session, state, actions }
  } catch (error) {
    return { ...session, state: { ...session.state, feedback: { kind: 'error', message: error instanceof Error ? error.message.replace(/^\w+ rejected: /, '') : 'Let us try another action.', feedbackId: null } } }
  }
}
export function GameProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, initialSession)
  useEffect(() => {
    if (!session.actions.length && session.saveStatus === 'corrupt') return
    try {
      if (session.actions.length) localStorage.setItem(SAVE_KEY, encodeSave(session.actions, session.campaign))
      else localStorage.removeItem(SAVE_KEY)
      dispatch({ type: 'SAVE_STATUS', status: session.actions.length ? 'saved' : 'none' })
    } catch { dispatch({ type: 'SAVE_STATUS', status: 'unavailable' }) }
  }, [session.actions, session.saveStatus, session.campaign])
  return <GameContext.Provider value={{ state: session.state, dispatch, saveStatus: session.saveStatus }}>{children}</GameContext.Provider>
}
