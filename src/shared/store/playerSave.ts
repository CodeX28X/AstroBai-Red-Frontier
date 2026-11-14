import type { GameAction, GameState } from '../types/game.ts'
import { createInitialGameState, gameReducer } from './gameReducer.ts'
import { hasGameplayChange } from './gameProgress.ts'
import { PLAYER_MISSION_OPTIONS } from '../../features/missions/data/playerMission.ts'

export const LEGACY_PLAYER_SAVE_KEY = 'astrobai.player-mvp.actions.v1'
export const PLAYER_SAVE_KEY = 'astrobai.player-mvp.actions.v2'
export const SAVE_VERSION = 2
export const SAVE_RULES = 'icebound-survival-2'
export const MAX_SAVED_ACTIONS = 512
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface PlayerSave { version: 2; rules: typeof SAVE_RULES; actions: GameAction[] }
export type SaveLoad = { state: GameState; actions: GameAction[]; notice: string | null; blocked: boolean }
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const text = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length < 300
const number = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 100
const revision = (x: unknown): x is number => typeof x === 'number' && Number.isSafeInteger(x) && x >= 0 && x <= MAX_SAVED_ACTIONS

/** Only current player commands can enter a save. Engine validation still owns every consequence. */
export function isPlayerAction(x: unknown): x is GameAction {
  if (!record(x)) return false
  switch (x.type) {
    case 'START_GAME': case 'REVIEW_MANIFEST': case 'CONFIRM_MANIFEST':
    case 'BEGIN_LAUNCH': case 'COMPLETE_LAUNCH': case 'ENTER_DEBRIEF':
    case 'REVIEW_ICEBOUND_EXPEDITION_PLAN': return true
    case 'ADVANCE_SOL': return x.expectedSol === undefined || (revision(x.expectedSol) && x.expectedSol <= 10)
    case 'SET_EQUIPMENT_QUANTITY': return text(x.equipmentId) && number(x.quantity) && Number.isInteger(x.quantity)
    case 'SELECT_LANDING_SITE': return text(x.siteId)
    case 'OUTPOST_OPERATION': return ['recharge','harvest','recycle'].includes(String(x.operation)) && revision(x.expectedSol) && x.expectedSol <= 10
    case 'CONFIRM_ICEBOUND_EXPEDITION_PLAN': return revision(x.revision)
    case 'SET_ICEBOUND_EXPEDITION_PLAN': {
      const p = x.plan
      return record(p) && text(p.siteId) && ['rover-only','astronaut-team','combined'].includes(String(p.method)) &&
        ['surface-sampling','subsurface-drilling'].includes(String(p.activity)) &&
        Array.isArray(p.equipmentIds) && p.equipmentIds.length <= 30 && p.equipmentIds.every(text) &&
        // Draft amounts may be invalid for confirmation; the review engine explains them.
        record(p.supplies) && Object.entries(p.supplies).every(([key, value]) => ['power','oxygen','water','food'].includes(key) && typeof value === 'number' && Number.isFinite(value))
    }
    case 'ICEBOUND_COMMAND': {
      const intent = x.intent
      if (!record(intent) || (x.expectedMissionRevision !== undefined && !revision(x.expectedMissionRevision))) return false
      switch (intent.type) {
        case 'RECON': case 'EXECUTE_EXPEDITION': case 'GENERATE_REPORT': return true
        case 'SELECT_SITE': return text(intent.siteId)
        case 'COLLECT_SAMPLE': return ['surface-sampling','subsurface-drilling'].includes(String(intent.method))
        case 'ANALYZE_SAMPLE': return text(intent.sampleId)
        default: return false
      }
    }
    default: return false
  }
}
export function emptyPlayerSave(): SaveLoad {
  return { state: createInitialGameState(PLAYER_MISSION_OPTIONS), actions: [], notice: null, blocked: false }
}
export function decodePlayerSave(raw: string | null): SaveLoad {
  const fresh = emptyPlayerSave()
  if (raw === null) return fresh
  try {
    if (raw.length > 300000) throw new Error('Too large')
    const data: unknown = JSON.parse(raw)
    if (!record(data)) throw new Error('Invalid envelope')
    if (data.version !== SAVE_VERSION || data.rules !== SAVE_RULES) {
      return { ...fresh, blocked: true, notice: 'This saved mission uses different game rules. Start a new mission to replace it.' }
    }
    if (!Array.isArray(data.actions) || data.actions.length > MAX_SAVED_ACTIONS) throw new Error('Invalid action list')
    let state = fresh.state
    for (const action of data.actions) {
      if (!isPlayerAction(action)) throw new Error('Unsupported command')
      const next = gameReducer(state, action)
      if (!hasGameplayChange(state, next)) throw new Error('Rejected command')
      state = next
    }
    return { state, actions: data.actions, notice: data.actions.length ? 'Your mission is ready to continue.' : null, blocked: false }
  } catch {
    return { ...fresh, blocked: true, notice: 'We could not read this saved mission safely. Start a new mission to replace it.' }
  }
}
export function loadPlayerSave(storage: StoragePort): SaveLoad {
  try { return decodePlayerSave(storage.getItem(PLAYER_SAVE_KEY) ?? storage.getItem(LEGACY_PLAYER_SAVE_KEY)) }
  catch { return { ...emptyPlayerSave(), notice: 'Saving is unavailable in this browser. Keep this page open to continue playing.' } }
}
export function writePlayerSave(storage: StoragePort, actions: GameAction[]) {
  if (actions.length === 0) { storage.removeItem(PLAYER_SAVE_KEY); storage.removeItem(LEGACY_PLAYER_SAVE_KEY) }
  else {
    storage.setItem(PLAYER_SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, rules: SAVE_RULES, actions } satisfies PlayerSave))
    storage.removeItem(LEGACY_PLAYER_SAVE_KEY)
  }
}

