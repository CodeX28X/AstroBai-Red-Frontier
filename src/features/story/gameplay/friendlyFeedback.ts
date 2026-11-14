import type { GameFeedback, GameState } from '../../../shared/types/game.ts'
import { EQUIPMENT_CATALOG } from '../../missions/index.ts'
import { resourceNames } from './labels.ts'
const messages: Record<string, string> = {
  INSUFFICIENT_POWER: 'We need more energy. Visit the solar panels to charge the base.',
  INSUFFICIENT_ACTIONS: 'Both big jobs are used up today. Check supplies, then end the day.',
  INSUFFICIENT_OXYGEN: 'We need more air. Visit home to run the recycler.',
  INSUFFICIENT_WATER: 'We need more water. Visit home to run the recycler.',
  INSUFFICIENT_FOOD: 'We need more food. Visit the greenhouse to pick some.',
  SOL_WINDOW: 'Look for research clues from day 3. Finish before the mission ends.',
  LAB_UNAVAILABLE: 'The lab is not ready. Check the base before studying a sample.',
  PREREQUISITE_REQUIRED: 'Finish the earlier research step first.',
  PLAN_CONFIRMATION_REQUIRED: 'Check and lock your trip plan before you go.',
  STALE_REVIEW: 'Your plan changed. Ask for another check before locking it.',
  ALREADY_RESOLVED: 'That job is already done. Your supplies have not been charged again.',
  OBJECTIVE_COMPLETED: 'You have already finished this research step.',
  MISSION_UNAVAILABLE: 'This mission has ended. You can read your report or start again.',
}
export function feedbackTone(state: GameState): 'error' | 'success' {
  return state.feedback?.kind === 'error' ||
    (state.feedback?.feedbackId === 'mission-control-review' && state.preparation.latestReview?.allowed === false) ? 'error' : 'success'
}
export function friendlyFeedback(feedback: GameFeedback, state?: GameState): string {
  if (feedback.feedbackId === 'mission-control-review') return state?.preparation.latestReview?.allowed === false ?
    'Let’s fix your packing. Check the list below.' : 'Packing checked! Lock your bag when you are ready.'
  if (feedback.feedbackId === 'manifest-confirmed') return 'Your bag is locked. Ready for launch!'
  if (feedback.feedbackId === 'progression-debrief') return 'Your mission report is ready to read.'
  if (feedback.feedbackId?.startsWith('outpost.operation.') && state?.survival?.care.length) {
    const record = state.survival.care[state.survival.care.length - 1]
    return Object.entries(record.resourceDeltas).filter(([, value]) => value !== 0).map(([key, value]) =>
      resourceNames[key as keyof typeof resourceNames] + ' ' + (value > 0 ? '+' : '−') + Math.abs(value)).join(' · ') + '. One big job used.'
  }
  if (feedback.code && messages[feedback.code]) return messages[feedback.code]
  let text = feedback.message.replaceAll('major actions', 'big jobs').replaceAll('major-action slot', 'big job')
  if (text.includes('game is terminal')) return 'This mission has ended. Read your report or start a new mission.'
  for (const item of EQUIPMENT_CATALOG) text = text.replaceAll(item.id, item.name)
  text = text.replaceAll('surface-sampling capability', 'surface sampling tools').replaceAll('sample-handling capability', 'a sample container')
    .replace(/\bpower\b/g, 'energy').replace(/\bsol\b/g, 'day')
  return text
}

