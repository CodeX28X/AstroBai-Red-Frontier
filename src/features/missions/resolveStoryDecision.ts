import type { GameState, Resources } from '../../shared/types/game.ts'
import type { MissionEffect, MissionResolution } from './contracts.ts'
import { STORY_DECISIONS, type StoryDecisionChapter } from './storyDecisions.ts'
import { validateStoryDecision } from './validateStoryDecision.ts'

export const STORY_DECISION_OBJECTIVE_PREFIX = 'story-decision:'

function getDecidedChapters(state: GameState): StoryDecisionChapter[] {
  const completedDecisionIds = new Set(
    state.objectives
      .filter((objective) => objective.completed && objective.id.startsWith(STORY_DECISION_OBJECTIVE_PREFIX))
      .map((objective) => objective.id.slice(STORY_DECISION_OBJECTIVE_PREFIX.length)),
  )

  return STORY_DECISIONS
    .filter((decision) => completedDecisionIds.has(decision.id))
    .map((decision) => decision.phase)
}

function getResourceRequirements(deltas: Partial<Resources>): Partial<Resources> {
  const requirements: Partial<Resources> = {}

  for (const [resource, delta] of Object.entries(deltas) as [keyof Resources, number][]) {
    if (delta < 0) requirements[resource] = -delta
  }

  return requirements
}

function insufficientResourceReason(
  resources: Resources,
  requirements: Partial<Resources>,
): string | null {
  for (const [resource, required] of Object.entries(requirements) as [keyof Resources, number][]) {
    const available = resources[resource]
    if (available < required) {
      return `Not enough ${resource}: this choice needs ${required}, and you have ${available}.`
    }
  }

  return null
}

function rejected(reason: string, resourceRequirements: Partial<Resources> = {}): MissionResolution {
  return {
    allowed: false,
    success: false,
    reason,
    nextPhase: null,
    completedDecisionId: null,
    feedbackId: null,
    feedbackMessage: reason,
    resourceRequirements,
    proposedEffects: [],
  }
}

/** Resolves an eligible choice into a proposal without mutating state or applying resources. */
export function resolveStoryDecision(state: GameState, optionId: string): MissionResolution {
  const validation = validateStoryDecision(state, optionId, {
    decidedChapters: getDecidedChapters(state),
  })
  if (!validation.valid) return rejected(validation.message)

  const { decision } = validation
  const resourceRequirements = getResourceRequirements(decision.resourceEffectProposal)
  const resourceError = insufficientResourceReason(state.resources, resourceRequirements)
  if (resourceError !== null) return rejected(resourceError, resourceRequirements)

  const completedDecisionId = `${STORY_DECISION_OBJECTIVE_PREFIX}${decision.id}`
  const effect: MissionEffect = {
    resourceDeltas: { ...decision.resourceEffectProposal },
    objectiveChanges: [{ objectiveId: completedDecisionId, completed: true }],
    feedbackId: decision.educationalFeedbackId,
  }

  return {
    allowed: true,
    success: true,
    reason: null,
    nextPhase: decision.nextPhase,
    completedDecisionId,
    feedbackId: decision.educationalFeedbackId,
    feedbackMessage: `${decision.title}: ${decision.description}`,
    resourceRequirements,
    proposedEffects: [effect],
  }
}
