import type { GameAction, GameState } from '../types/game.ts'
import { CAMPAIGN_OPTIONS, LEGACY_CAMPAIGN_OPTIONS } from './campaign.ts'
import { createInitialGameState, gameReducer } from './gameReducer.ts'
export const SAVE_KEY = 'astrobai.adventure.save.v1'
export const SAVE_VERSION = 4
export type SavedCampaign = 'classic' | 'supplies'
const supported = new Set(['OPERATE_FACILITY','START_GAME','ADVANCE_SOL','SET_EQUIPMENT_QUANTITY','SET_SUPPLY_QUANTITY','SET_SCIENCE_KIT','INSPECT_LOCATION','ACKNOWLEDGE_DIALOGUE','REVIEW_MANIFEST','CONFIRM_MANIFEST','BEGIN_LAUNCH','COMPLETE_LAUNCH','SELECT_LANDING_SITE','ENTER_DEBRIEF','SET_ICEBOUND_EXPEDITION_PLAN','REVIEW_ICEBOUND_EXPEDITION_PLAN','CONFIRM_ICEBOUND_EXPEDITION_PLAN','ICEBOUND_COMMAND'])
export function encodeSave(actions: readonly GameAction[], campaign: SavedCampaign = 'supplies'): string { return JSON.stringify({ version: SAVE_VERSION, campaign, actions }) }
export function decodeSave(raw: string): { state: GameState; actions: GameAction[]; campaign: SavedCampaign } {
  if (raw.length > 1_000_000) throw new Error('Save is too large.')
  const data: unknown = JSON.parse(raw)
  if (!data || typeof data !== 'object' || !('version' in data) || data.version !== SAVE_VERSION || !('actions' in data) || !Array.isArray(data.actions) || data.actions.length > 2000) throw new Error('This save uses an unsupported resource scale or is damaged. Start a new mission.')
  const campaign = 'campaign' in data ? data.campaign : null
  if (campaign !== 'classic' && campaign !== 'supplies') throw new Error('Unknown campaign.')
  let state = createInitialGameState(campaign === 'classic' ? LEGACY_CAMPAIGN_OPTIONS : CAMPAIGN_OPTIONS)
  for (const action of data.actions) {
    if (!action || typeof action !== 'object' || !supported.has(action.type)) throw new Error('Unsupported action in save.')
    const next = gameReducer(state, action as GameAction)
    if (next.feedback?.kind === 'error') throw new Error('Invalid mission history.')
    state = next
  }
  if (state.phase === 'menu') throw new Error('No mission in save.')
  return { state, actions: data.actions as GameAction[], campaign }
}
