import type { GamePhase, MissionId, Resources } from '../../shared/types/game.ts'

export interface MissionObjectiveDefinition {
  id: string
  description: string
}

export interface MissionDefinition {
  id: MissionId
  title: string
  description: string
  prerequisites: MissionId[]
  objectives: MissionObjectiveDefinition[]
}

export interface MissionObjectiveChange {
  objectiveId: string
  completed: boolean
}

export interface MissionEffect {
  resourceDeltas: Partial<Resources>
  objectiveChanges: MissionObjectiveChange[]
  feedbackId: string
}

export interface MissionResolution {
  allowed: boolean
  success: boolean
  reason: string | null
  nextPhase: GamePhase | null
  completedDecisionId: string | null
  feedbackId: string | null
  feedbackMessage: string
  /** Minimum balances required before applying the proposed resource deltas. */
  resourceRequirements: Partial<Resources>
  proposedEffects: MissionEffect[]
}

/** Mission rules are pure functions: they return proposals and never mutate app or browser state. */
export type MissionResolver<TInput> = (input: TInput) => MissionResolution
