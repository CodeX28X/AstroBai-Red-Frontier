import type { GamePhase, GameState, GameOutcome, Resources } from '../../../../shared/types/game.ts'
import type { PreparationState } from '../../types/preparationEngine.ts'
import type { MissionEffect } from '../../contracts.ts'
import { LANDING_SITES } from '../../data/landingSites.ts'
import { STORY_DECISION_OBJECTIVE_PREFIX } from '../../resolveStoryDecision.ts'
import { validateManifest } from '../preparation/validateManifest.ts'
import { reviewMissionPlan } from '../preparation/reviewMissionPlan.ts'

/** Temporary adapter until C updates shared GamePhase; not a second GameState. */
export type MissionProgressionPhase = Exclude<GamePhase, 'travel' | 'return'> | 'preparation'

export interface MissionProgressionContext extends Pick<GameState, 'outcome' | 'objectives'> {
  phase: MissionProgressionPhase
  preparation: PreparationState | null
  /** Last fully completed sol, supplied by C after its end-of-sol transaction. */
  completedSol: number
}

export type MissionProgressionIntent =
  | { type: 'START_GAME' }
  | { type: 'BEGIN_LAUNCH' }
  | { type: 'COMPLETE_LAUNCH' }
  | { type: 'SELECT_LANDING_SITE'; siteId: string }
  | { type: 'ENTER_DEBRIEF' }

export interface DebriefEvaluation {
  outcome: Exclude<GameOutcome, null>
  reason: 'terminal-outcome' | 'sol-10-completed'
}

export type ProgressionRejectionCode =
  | 'WRONG_PHASE' | 'TERMINAL_OUTCOME' | 'ALREADY_COMPLETED'
  | 'MANIFEST_NOT_CONFIRMED' | 'INVALID_LANDING_SITE' | 'DEBRIEF_NOT_READY'

export type MissionProgressionResolution =
  | {
      allowed: false
      code: ProgressionRejectionCode
      message: string
      nextPhase: null
      effects: []
      resourceRequirements: Partial<Resources>
      completionMarker: null
      debrief: null
    }
  | {
      allowed: true
      code: 'TRANSITION_ALLOWED'
      message: string
      nextPhase: MissionProgressionPhase
      effects: MissionEffect[]
      resourceRequirements: Partial<Resources>
      completionMarker: string
      debrief: DebriefEvaluation | null
    }

/** Explicit terminal outcomes take priority; surviving through completed Sol 10 is MVP success. */
export function evaluateDebrief(context: MissionProgressionContext): DebriefEvaluation | null {
  if (context.outcome !== null) return { outcome: context.outcome, reason: 'terminal-outcome' }
  if (Number.isInteger(context.completedSol) && context.completedSol >= 10) {
    return { outcome: 'success', reason: 'sol-10-completed' }
  }
  return null
}

function reject(code: ProgressionRejectionCode, message: string): MissionProgressionResolution {
  return { allowed: false, code, message, nextPhase: null, effects: [], resourceRequirements: {}, completionMarker: null, debrief: null }
}

/** Returns proposals only. C must validate balances and atomically commit phase, markers and effects. */
export function validateMissionTransition(
  context: MissionProgressionContext,
  intent: MissionProgressionIntent,
): MissionProgressionResolution {
  let from: MissionProgressionPhase
  let nextPhase: MissionProgressionPhase
  switch (intent.type) {
    case 'START_GAME': from = 'menu'; nextPhase = 'preparation'; break
    case 'BEGIN_LAUNCH': from = 'preparation'; nextPhase = 'launch'; break
    case 'COMPLETE_LAUNCH': from = 'launch'; nextPhase = 'landing'; break
    case 'SELECT_LANDING_SITE': from = 'landing'; nextPhase = 'outpost'; break
    case 'ENTER_DEBRIEF': from = 'outpost'; nextPhase = 'debrief'; break
  }
  if (context.phase !== from) return reject('WRONG_PHASE', `This action is only available during ${from}.`)
  if (context.outcome !== null && intent.type !== 'ENTER_DEBRIEF') {
    return reject('TERMINAL_OUTCOME', 'The mission has ended. No further opening choices are available.')
  }
  const completionMarker = `mission-transition:${from}:${nextPhase}`
  const completed = new Set(context.objectives.filter((item) => item.completed).map((item) => item.id))
  if (completed.has(completionMarker)) return reject('ALREADY_COMPLETED', 'This transition has already been completed.')

  if (intent.type === 'BEGIN_LAUNCH') {
    const preparation = context.preparation
    if (!preparation || preparation.status !== 'confirmed' ||
        preparation.confirmedAtRevision !== preparation.revision ||
        preparation.reviewedRevision !== preparation.revision || !preparation.latestReview?.allowed ||
        !validateManifest(preparation.manifest, preparation.cargoCapacityUnits).valid || !reviewMissionPlan(preparation.manifest, preparation.cargoCapacityUnits, preparation.supplies).allowed) {
      return reject('MANIFEST_NOT_CONFIRMED', 'Confirm a valid, current cargo manifest before launch.')
    }
  }

  let resourceDeltas: Partial<Resources> = {}
  const resourceRequirements: Partial<Resources> = {}
  let feedbackId = `progression-${nextPhase}`
  let message = `Ready for ${nextPhase}.`
  const objectiveChanges = [{ objectiveId: completionMarker, completed: true }]
  if (intent.type === 'SELECT_LANDING_SITE') {
    const site = LANDING_SITES.find((item) => item.id === intent.siteId)
    if (!site) return reject('INVALID_LANDING_SITE', 'Choose a landing site from the available options.')
    // Check all chapter markers, including the old resolver's markers, to prevent a second reward.
    if (LANDING_SITES.some((item) => completed.has(`${STORY_DECISION_OBJECTIVE_PREFIX}${item.id}`))) {
      return reject('ALREADY_COMPLETED', 'A landing site has already been chosen.')
    }
    resourceDeltas = { ...site.resourceDeltas }
    for (const [resource, delta] of Object.entries(resourceDeltas) as [keyof Resources, number][]) {
      if (delta < 0) resourceRequirements[resource] = -delta
    }
    objectiveChanges.push({ objectiveId: `${STORY_DECISION_OBJECTIVE_PREFIX}${site.id}`, completed: true })
    feedbackId = site.feedbackId
    message = `${site.title}: ${site.description}`
  }

  const debrief = intent.type === 'ENTER_DEBRIEF' ? evaluateDebrief(context) : null
  if (intent.type === 'ENTER_DEBRIEF' && debrief === null) {
    return reject('DEBRIEF_NOT_READY', 'Complete Sol 10 or reach a terminal mission outcome before debrief.')
  }
  return {
    allowed: true, code: 'TRANSITION_ALLOWED', message, nextPhase, completionMarker,
    resourceRequirements, debrief,
    effects: [{ resourceDeltas, objectiveChanges, feedbackId }],
  }
}
