import type { GameState } from '../../../shared/types/game.ts'
import { validateMissionTransition } from '../../missions/index.ts'

export function missionEndingReady(state: GameState): boolean {
  return state.phase === 'outpost' && (state.completedSol >= state.actionLimits.maxSol || state.outcome !== null) &&
    validateMissionTransition(state, { type: 'ENTER_DEBRIEF' }).allowed
}

export function missionEnding(state: GameState) {
  const complete = state.icebound.report?.completionStatus === 'complete'
  return { complete, heading: state.outcome === 'success' ? complete ? 'Mission complete — science recorded!' : 'Outpost mission complete' : 'Outpost mission ended',
    science: complete ? 'Investigation complete' : 'Investigation unfinished' }
}
