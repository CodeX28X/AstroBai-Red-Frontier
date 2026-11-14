import type { GameState } from '../../shared/types/game.ts'
import { getStoryDecision, type StoryDecisionChapter, type StoryDecisionDefinition } from './storyDecisions.ts'

export interface StoryDecisionValidationContext {
  /** Supply already chosen chapters until shared GameState stores this history. */
  decidedChapters: readonly StoryDecisionChapter[]
}

export type StoryDecisionValidationResult =
  | { valid: true; decision: StoryDecisionDefinition }
  | {
      valid: false
      reason:
        | 'terminal-outcome'
        | 'unknown-option'
        | 'wrong-phase'
        | 'duplicate-chapter'
        | 'prerequisite-not-met'
      message: string
    }

function invalid(
  reason: Exclude<StoryDecisionValidationResult, { valid: true }>['reason'],
  message: string,
): StoryDecisionValidationResult {
  return { valid: false, reason, message }
}

/** Checks a story choice without changing game, browser, or React state. */
export function validateStoryDecision(
  state: Pick<GameState, 'phase' | 'outcome'>,
  optionId: string,
  context: StoryDecisionValidationContext,
): StoryDecisionValidationResult {
  if (state.outcome !== null || state.phase === 'debrief') {
    return invalid('terminal-outcome', 'Story decisions are unavailable after the mission ends.')
  }

  const decision = getStoryDecision(optionId)
  if (decision === undefined) {
    return invalid('unknown-option', `No story decision exists for option "${optionId}".`)
  }

  if (state.phase !== decision.phase) {
    return invalid('wrong-phase', `Option "${optionId}" is only available during ${decision.phase}.`)
  }

  if (context.decidedChapters.includes(decision.phase)) {
    return invalid('duplicate-chapter', `A decision has already been made during ${decision.phase}.`)
  }

  const missingPrerequisite = decision.prerequisites.completedChapters.find(
    (chapter) => !context.decidedChapters.includes(chapter),
  )
  if (missingPrerequisite !== undefined) {
    return invalid('prerequisite-not-met', `Complete the ${missingPrerequisite} chapter first.`)
  }

  return { valid: true, decision }
}
