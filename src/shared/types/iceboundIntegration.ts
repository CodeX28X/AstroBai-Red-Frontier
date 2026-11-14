import type {
  ExpeditionPlan, IceboundCapability, IceboundEvent, IceboundIntent,
  IceboundReview, IceboundScenarioId,
} from '../../features/missions/types/icebound.ts'

/** C-owned workflow metadata. The sole confirmed plan lives in IceboundState.approvedPlan. */
export interface IceboundPlanningState {
  draft: ExpeditionPlan | null
  revision: number
  reviewedRevision: number | null
  confirmedAtRevision: number | null
  review: IceboundReview | null
}

export type IceboundRuntimeIntent = Exclude<IceboundIntent, { type: 'APPROVE_PLAN' }>
export type IceboundStoreAction =
  | { type: 'SET_ICEBOUND_EXPEDITION_PLAN'; plan: ExpeditionPlan }
  | { type: 'REVIEW_ICEBOUND_EXPEDITION_PLAN' }
  | { type: 'CONFIRM_ICEBOUND_EXPEDITION_PLAN'; revision: number }
  | { type: 'ICEBOUND_COMMAND'; intent: IceboundRuntimeIntent; expectedMissionRevision?: number }

export interface CommittedIceboundEvent {
  resolutionId: string
  event: IceboundEvent
}

/** Trusted scenario initialization, never a client-dispatchable resource/readiness override. */
export interface GameInitializationOptions {
  runId?: string
  scenarioId?: IceboundScenarioId
  installedCapabilities?: readonly IceboundCapability[]
}
