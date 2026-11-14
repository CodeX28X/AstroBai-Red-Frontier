import type { MissionReview } from '../engine/preparation/reviewMissionPlan.ts'
import type { MissionManifest } from './preparation.ts'

export type PreparationStatus = 'editing' | 'reviewed' | 'confirmed'

export interface PreparationState {
  manifest: MissionManifest
  /** Abstract cargo capacity supplied by mission design, not a physical measurement. */
  cargoCapacityUnits: number
  status: PreparationStatus
  revision: number
  reviewedRevision: number | null
  confirmedAtRevision: number | null
  latestReview: MissionReview | null
}

export type PreparationIntent =
  | { type: 'SET_EQUIPMENT_QUANTITY'; equipmentId: string; quantity: number }
  | { type: 'REVIEW_MANIFEST' }
  | { type: 'CONFIRM_MANIFEST' }

export type PreparationIssueCode =
  | 'UNKNOWN_EQUIPMENT'
  | 'INVALID_QUANTITY'
  | 'QUANTITY_EXCEEDS_LIMIT'
  | 'PREPARATION_CONFIRMED'
  | 'REVIEW_REQUIRED'
  | 'STALE_REVIEW'
  | 'MANIFEST_BLOCKED'
  | 'DUPLICATE_CONFIRMATION'

export interface PreparationIssue {
  code: PreparationIssueCode
  message: string
}

export interface PreparationResolution {
  /** Whether the requested engine operation was accepted; a completed review may still contain blockers. */
  accepted: boolean
  state: PreparationState
  issues: PreparationIssue[]
  review: MissionReview | null
}
