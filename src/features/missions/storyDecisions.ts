import type { GamePhase, Resources } from '../../shared/types/game.ts'

export type StoryDecisionChapter = Extract<GamePhase, 'launch' | 'travel' | 'landing'>

export interface StoryDecisionPrerequisites {
  /** Chapters that must already have a recorded choice. */
  completedChapters: readonly StoryDecisionChapter[]
}

export interface StoryDecisionDefinition {
  id: string
  phase: StoryDecisionChapter
  title: string
  description: string
  resourceEffectProposal: Partial<Resources>
  nextPhase: GamePhase
  educationalFeedbackId: string
  prerequisites: StoryDecisionPrerequisites
}

// These are temporary game-balancing proposals, not measurements from NASA data.
export const STORY_DECISIONS = [
  {
    id: 'launch-extra-oxygen',
    phase: 'launch',
    title: 'Pack Extra Oxygen',
    description: 'Bring more oxygen for the trip, leaving less room for other supplies.',
    resourceEffectProposal: { oxygen: 20, food: -10 },
    nextPhase: 'travel',
    educationalFeedbackId: 'launch-oxygen-tradeoff',
    prerequisites: { completedChapters: [] },
  },
  {
    id: 'launch-solar-equipment',
    phase: 'launch',
    title: 'Bring Solar Panels',
    description: 'Pack extra solar equipment to help make power after landing.',
    resourceEffectProposal: { power: 15, food: -10 },
    nextPhase: 'travel',
    educationalFeedbackId: 'launch-solar-equipment',
    prerequisites: { completedChapters: [] },
  },
  {
    id: 'launch-extra-food',
    phase: 'launch',
    title: 'Pack More Food',
    description: 'Bring extra food for the crew, using space that could carry other supplies.',
    resourceEffectProposal: { food: 20, water: -10 },
    nextPhase: 'travel',
    educationalFeedbackId: 'launch-food-tradeoff',
    prerequisites: { completedChapters: [] },
  },
  {
    id: 'travel-immediate-repair',
    phase: 'travel',
    title: 'Repair It Now',
    description: 'Use supplies now to fix the problem before the ship reaches Mars.',
    resourceEffectProposal: { power: -10, oxygen: 5 },
    nextPhase: 'landing',
    educationalFeedbackId: 'travel-immediate-repair',
    prerequisites: { completedChapters: ['launch'] },
  },
  {
    id: 'travel-wait-for-earth',
    phase: 'travel',
    title: 'Ask Earth for Advice',
    description: 'Wait for guidance from Earth while the crew uses food and water.',
    resourceEffectProposal: { food: -5, water: -5 },
    nextPhase: 'landing',
    educationalFeedbackId: 'travel-wait-for-earth',
    prerequisites: { completedChapters: ['launch'] },
  },
  {
    id: 'travel-backup-equipment',
    phase: 'travel',
    title: 'Use Backup Equipment',
    description: 'Switch to a spare part to keep the journey moving.',
    resourceEffectProposal: { power: -15, oxygen: 10 },
    nextPhase: 'landing',
    educationalFeedbackId: 'travel-backup-equipment',
    prerequisites: { completedChapters: ['launch'] },
  },
  {
    id: 'landing-safe-zone',
    phase: 'landing',
    title: 'Choose a Safe Landing Spot',
    description: 'Land on smooth ground to help protect the spacecraft and crew.',
    resourceEffectProposal: { power: -5, food: -5 },
    nextPhase: 'outpost',
    educationalFeedbackId: 'landing-safe-zone',
    prerequisites: { completedChapters: ['launch', 'travel'] },
  },
  {
    id: 'landing-research-zone',
    phase: 'landing',
    title: 'Choose a Science Spot',
    description: 'Land near an interesting place to study, even if the ground is trickier.',
    resourceEffectProposal: { power: -10, oxygen: -5 },
    nextPhase: 'outpost',
    educationalFeedbackId: 'landing-research-zone',
    prerequisites: { completedChapters: ['launch', 'travel'] },
  },
] as const satisfies readonly StoryDecisionDefinition[]

export function getStoryDecision(optionId: string): StoryDecisionDefinition | undefined {
  return STORY_DECISIONS.find((decision) => decision.id === optionId)
}
