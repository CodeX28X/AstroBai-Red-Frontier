import type { PreparationState } from '../../features/missions/types/preparationEngine.ts'
import type { IceboundAnalysis, IceboundReadiness, IceboundState } from '../../features/missions/types/icebound.ts'
import type { CommittedIceboundEvent, IceboundPlanningState, IceboundStoreAction } from './iceboundIntegration.ts'

export type GamePhase =
  | 'menu'
  | 'preparation'
  | 'launch'
  | 'landing'
  | 'outpost'
  | 'debrief'

export interface Resources {
  power: number
  oxygen: number
  water: number
  food: number
}

export type BuildingId =
  | 'habitat'
  | 'solar-array'
  | 'greenhouse'
  | 'water-extractor'

export type BuildingStatus = 'unbuilt' | 'operational' | 'damaged' | 'offline'

export type MissionId = 'icebound' | 'power-grid' | 'solar-storm' | 'life-support'

export type MissionStatus = 'locked' | 'available' | 'active' | 'completed' | 'failed'

export interface ObjectiveState {
  id: string
  completed: boolean
}

export interface ActionLimits {
  maxSol: number
  maxActionsPerSol: number
}

export type MajorActionCategory =
  | 'operation'
  | 'repair'
  | 'event-response'
  | 'exploration'

export type ActionCategory =
  | MajorActionCategory
  | 'facility-inspection'
  | 'power-allocation'

export interface ProtectionState {
  storm: boolean
  radiation: boolean
}

export type GameOutcome = 'success' | 'failure' | null

export interface GameFeedback {
  kind: 'success' | 'error'
  message: string
  feedbackId: string | null
  code?: string
  analysis?: IceboundAnalysis
}

export interface GameState {
  resourceRevision: number
  consumedSols: number[]
  guidance: { inspections: string[]; completedDialogueIds: string[] }
  phase: GamePhase
  sol: number
  completedSol: number
  actionsRemaining: number
  spentActionIds: string[]
  resources: Resources
  preparation: PreparationState
  selectedLandingSite: string | null
  facilities: Record<BuildingId, BuildingStatus>
  missions: Record<MissionId, MissionStatus>
  objectives: ObjectiveState[]
  activeEvent: string | null
  actionLimits: ActionLimits
  protection: ProtectionState
  outcome: GameOutcome
  feedback: GameFeedback | null
  icebound: IceboundState
  iceboundPlanning: IceboundPlanningState
  iceboundReadiness: IceboundReadiness
  appliedResolutionIds: string[]
  iceboundEvents: CommittedIceboundEvent[]
}

export type GameAction =
  | { type: 'OPERATE_FACILITY'; operationId: import('../../features/simulation/outpostSystems.ts').FacilityOperationId; expectedSol: number; expectedResourceRevision: number }
  | { type: 'SET_SUPPLY_QUANTITY'; supplyId: import('../../features/missions/types/preparation.ts').SupplyId; quantity: number }
  | { type: 'SET_SCIENCE_KIT'; packed: boolean }
  | { type: 'INSPECT_LOCATION'; locationId: 'habitat' | 'solar-array' | 'greenhouse' | 'research-lab' | 'energy' | 'supplies' | 'safety' }
  | { type: 'ACKNOWLEDGE_DIALOGUE'; dialogueId: string }
  | IceboundStoreAction
  | { type: 'START_GAME' }
  | { type: 'ADVANCE_SOL'; expectedSol?: number }
  | { type: 'RESET_GAME' }
  | { type: 'SET_EQUIPMENT_QUANTITY'; equipmentId: string; quantity: number }
  | { type: 'REVIEW_MANIFEST' }
  | { type: 'CONFIRM_MANIFEST' }
  | { type: 'BEGIN_LAUNCH' }
  | { type: 'COMPLETE_LAUNCH' }
  | { type: 'SELECT_LANDING_SITE'; siteId: string }
  | { type: 'ENTER_DEBRIEF' }
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'UPDATE_RESOURCES'; deltas: Partial<Resources> }
  | { type: 'SET_FACILITY_STATUS'; buildingId: BuildingId; status: BuildingStatus }
  | { type: 'SET_MISSION_STATUS'; missionId: MissionId; status: MissionStatus }
  | { type: 'UPDATE_OBJECTIVE'; objectiveId: string; completed: boolean }
  | { type: 'SET_ACTIVE_EVENT'; eventId: string | null }
  | { type: 'SET_PROTECTION'; protection: Partial<ProtectionState> }
  | { type: 'SET_OUTCOME'; outcome: Exclude<GameOutcome, null> }
  /** @deprecated Legacy opening-story UI action; the MVP flow uses mission actions above. */
  | { type: 'CHOOSE_STORY_OPTION'; optionId: string }
  | { type: 'SPEND_ACTION_SLOT'; actionId: string; category: MajorActionCategory }
