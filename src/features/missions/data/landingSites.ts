import { STORY_DECISIONS } from '../storyDecisions.ts'
import type { Resources } from '../../../shared/types/game.ts'

export type LandingSiteId = Extract<(typeof STORY_DECISIONS)[number], { phase: 'landing' }>['id']

export interface LandingSiteDefinition {
  id: LandingSiteId
  title: string
  description: string
  resourceDeltas: Partial<Resources>
  feedbackId: string
}

/** Reuses existing narrative content and abstract balancing proposals; no travel prerequisite. */
export const LANDING_SITES: readonly LandingSiteDefinition[] = STORY_DECISIONS
  .filter((decision) => decision.phase === 'landing')
  .map((decision) => ({
    id: decision.id,
    title: decision.title,
    description: decision.description,
    resourceDeltas: { ...decision.resourceEffectProposal },
    feedbackId: decision.educationalFeedbackId,
  }))
