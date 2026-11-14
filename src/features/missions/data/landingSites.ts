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

/** Fictional landing logistics, in the same 0–10 units shown before selection. */
export const LANDING_RESOURCE_EFFECTS: Record<string, Partial<Resources>> = {
  'landing-safe-zone': { power: -1, oxygen: 1 },
  'landing-research-zone': { power: -2, water: 2 },
}

/** Reuses existing narrative content and abstract balancing proposals; no travel prerequisite. */
export const LANDING_SITES: readonly LandingSiteDefinition[] = STORY_DECISIONS
  .filter((decision) => decision.phase === 'landing')
  .map((decision) => ({
    id: decision.id,
    title: decision.title,
    description: decision.description,
    resourceDeltas: { ...LANDING_RESOURCE_EFFECTS[decision.id] },
    feedbackId: decision.educationalFeedbackId,
  }))
