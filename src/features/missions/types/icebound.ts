import type { BuildingStatus, GameState, MissionStatus, Resources } from '../../../shared/types/game.ts'
import type { MissionObjectiveChange } from '../contracts.ts'
import type { EquipmentId } from './preparation.ts'

export type IceboundObjectiveId =
  | 'icebound.recon' | 'icebound.site-selection' | 'icebound.expedition-plan'
  | 'icebound.sample-collection' | 'icebound.lab-analysis' | 'icebound.science-report'
export type IceboundObjectiveStatus = 'locked' | 'available' | 'active' | 'completed' | 'blocked'
export type IceboundCapability = 'recon' | 'rover' | 'eva' | 'surface-sampling' | 'drilling' | 'sample-handling' | 'field-analysis' | 'lab-analysis'
export type IceboundSiteId = 'icebound.lumen-shelf' | 'icebound.cinder-flats' | 'icebound.echo-ridge'
export type IceboundScenarioId = 'icebound.training-v1' | 'icebound.dry-v1'
export type IceboundScienceReferenceId = 'nasa-swim' | 'nasa-perseverance-objectives' | 'nasa-mars-2020' | 'nasa-mars-trek' | 'nasa-open-apis' | 'csa-education'
export type ExpeditionMethod = 'rover-only' | 'astronaut-team' | 'combined'
export type SamplingMethod = 'surface-sampling' | 'subsurface-drilling'
export type EvidenceClassification = 'supports-accessible-ice' | 'no-accessible-ice-detected' | 'inconclusive' | 'analysis-incomplete'

export interface IceboundObjectiveDefinition {
  id: IceboundObjectiveId
  title: string
  description: string
  prerequisites: readonly IceboundObjectiveId[]
  eligibility: { phase: 'outpost'; earliestSol: number }
  completionCondition: string
  relevantCapabilities: readonly IceboundCapability[]
  suggestedSolWindow: readonly [number, number]
  scienceReferenceIds: readonly IceboundScienceReferenceId[]
  feedbackId: string
}
export interface IceboundSite {
  id: IceboundSiteId
  name: string
  fictional: true
  terrain: 'gentle' | 'uneven' | 'rough'
  travelRequirement: 1 | 2 | 3
  scientificInterest: string
  iceIndicator: string
  methods: readonly ExpeditionMethod[]
  requiredCapabilities: readonly IceboundCapability[]
  hazards: readonly string[]
  scienceReferenceIds: readonly IceboundScienceReferenceId[]
}
export interface IceboundSiteConditions {
  surface: 'ice' | 'dry' | 'unknown'
  subsurface: 'ice' | 'dry' | 'unknown'
  reconIndicator: 'possible-ice' | 'weak-evidence' | 'unclear'
}
export interface IceboundScenario {
  id: IceboundScenarioId
  fictional: true
  conditions: Readonly<Record<IceboundSiteId, IceboundSiteConditions>>
}
export interface ReconObservation {
  id: string
  siteId: IceboundSiteId
  sol: number
  terrain: IceboundSite['terrain']
  methods: readonly ExpeditionMethod[]
  indicator: IceboundSiteConditions['reconIndicator']
  explanation: string
  fictional: true
  scienceReferenceIds: readonly IceboundScienceReferenceId[]
}
export interface ExpeditionPlan {
  siteId: IceboundSiteId
  method: ExpeditionMethod
  equipmentIds: readonly EquipmentId[]
  /** Declared supplies, in abstract game units; these are not deducted during planning. */
  supplies: Partial<Resources>
  activity: SamplingMethod
}
export interface IceboundCost {
  operationId: string
  sol: number
  resources: Partial<Resources>
  actionSlots: number
}
export interface ExecutedExpedition {
  id: string
  plan: ExpeditionPlan
  sol: number
  observations: readonly {
    id: string
    siteId: IceboundSiteId
    sol: number
    explanation: string
    fictional: true
    scienceReferenceIds: readonly IceboundScienceReferenceId[]
  }[]
}
export interface IceboundSample {
  id: string
  expeditionId: string
  siteId: IceboundSiteId
  scenarioId: IceboundScenarioId
  method: SamplingMethod
  collectedSol: number
  status: 'collected' | 'unusable'
  quality: { handling: 'sealed' | 'basic'; instrument: 'field' | 'basic'; documented: boolean }
  observation: string
  scienceReferenceIds: readonly IceboundScienceReferenceId[]
}
export interface IceboundAnalysis {
  sampleId: string
  classification: EvidenceClassification
  examined: string
  observed: string
  conclusion: string
  limitations: readonly string[]
  scienceReferenceIds: readonly IceboundScienceReferenceId[]
}
export interface IceboundScienceReport {
  outcomeId: string
  completionStatus: 'complete' | 'incomplete'
  siteId: IceboundSiteId | null
  reconnaissance: readonly ReconObservation[]
  expeditionMethod: ExpeditionMethod | null
  expeditionObservations: ExecutedExpedition['observations']
  equipmentIds: readonly EquipmentId[]
  samples: readonly IceboundSample[]
  findings: readonly IceboundAnalysis[]
  conclusion: EvidenceClassification | null
  limitations: readonly string[]
  operationalCosts: readonly IceboundCost[]
  scienceReferenceIds: readonly IceboundScienceReferenceId[]
  feedbackIds: readonly string[]
}
/** Proposed slice for C's single store. All changes arrive through effect proposals. */
export interface IceboundState {
  runId: string
  scenarioId: IceboundScenarioId
  revision: number
  completedObjectives: readonly IceboundObjectiveId[]
  resolvedOperationIds: readonly string[]
  observations: readonly ReconObservation[]
  selectedSiteId: IceboundSiteId | null
  approvedPlan: ExpeditionPlan | null
  expedition: ExecutedExpedition | null
  samples: readonly IceboundSample[]
  analyses: readonly IceboundAnalysis[]
  costs: readonly IceboundCost[]
  report: IceboundScienceReport | null
}
/** Required authoritative adapter facts; absent shared contracts must not be guessed. */
export interface IceboundReadiness {
  deployedEquipment: readonly { equipmentId: EquipmentId; status: BuildingStatus }[]
  baselineCapabilities: readonly IceboundCapability[]
  roverOperational: boolean
  roverEnergyReady: boolean
  crewAvailable: boolean
  crewSafeForEva: boolean
  communicationsReady: boolean
  laboratoryOperational: boolean
  weather: 'clear' | 'caution' | 'blocked'
  radiation: 'clear' | 'caution' | 'blocked'
}
export interface IceboundBalance {
  earliestSol: number
  finalSol: number
  recon: Partial<Resources>
  expedition: Readonly<Record<ExpeditionMethod, Partial<Resources>>>
  travelPowerPerUnit: number
  sampling: Readonly<Record<SamplingMethod, Partial<Resources>>>
  analysis: Partial<Resources>
}
export interface IceboundContext {
  game: Readonly<GameState>
  mission: Readonly<IceboundState>
  readiness: Readonly<IceboundReadiness>
  balance?: IceboundBalance
}
export type IceboundIssueCode =
  | 'OUTPOST_REQUIRED' | 'MISSION_ENDED' | 'SOL_WINDOW' | 'CONFIRMED_MANIFEST_REQUIRED'
  | 'INVALID_BALANCE' | 'INVALID_MISSION_STATE' | 'INVALID_READINESS' | 'INSUFFICIENT_ACTIONS'
  | `INSUFFICIENT_${Uppercase<keyof Resources>}`
  | 'COMMUNICATIONS_UNAVAILABLE' | 'WEATHER_BLOCKED' | 'RADIATION_BLOCKED'
  | 'RECON_REQUIRED' | 'UNKNOWN_SITE' | 'SITE_INACCESSIBLE' | 'INVALID_PLAN_METHOD'
  | 'SITE_NOT_SELECTED' | 'DUPLICATE_EQUIPMENT' | 'EQUIPMENT_UNAVAILABLE' | 'MISSING_CAPABILITY'
  | 'INVALID_SUPPLIES' | 'SUPPLIES_NOT_PLANNED' | 'SUPPLIES_UNAVAILABLE'
  | 'ADVISORY_CAUTION' | 'SITE_HAZARDS' | 'ROVER_TRADEOFF' | 'COMBINED_TRADEOFF' | 'FIELD_INSTRUMENT_SUGGESTED'
  | 'UNKNOWN_OBJECTIVE' | 'OBJECTIVE_COMPLETED' | 'PREREQUISITE_REQUIRED' | 'RECON_CAPABILITY_REQUIRED'
  | 'ROVER_NOT_READY' | 'EXPEDITION_REQUIRED' | 'SAMPLING_CAPABILITY_REQUIRED' | 'SAMPLE_REQUIRED'
  | 'LAB_UNAVAILABLE' | 'REPORT_INCOMPLETE' | 'ALREADY_RESOLVED' | 'APPROVED_PLAN_REQUIRED'
  | 'METHOD_NOT_APPROVED' | 'SAMPLE_RECORD_MISMATCH' | 'ANALYSIS_INCOMPLETE' | 'UNSUPPORTED_INTENT'

export interface IceboundIssue {
  code: IceboundIssueCode
  severity: 'blocker' | 'warning' | 'recommendation'
  explanation: string
  feedbackId: string
}
export interface IceboundReview {
  allowed: boolean
  blockers: IceboundIssue[]
  warnings: IceboundIssue[]
  recommendations: IceboundIssue[]
  requiredResources: Partial<Resources>
  samplingResources: Partial<Resources>
  actionSlotCost: number
  samplingActionSlotCost: number
}
export interface IceboundEvent {
  objectiveId: IceboundObjectiveId
  eventId: string
  feedbackId: string
  outcomeId: string | null
  scienceReferenceIds: readonly IceboundScienceReferenceId[]
  contextualTags: readonly string[]
}
export interface IceboundProposedEffects {
  resourceDeltas: Partial<Resources>
  actionSlotCost: number
  actionCategory: 'exploration' | 'operation'
  equipmentStatusChanges: readonly { equipmentId: EquipmentId; status: BuildingStatus }[]
  objectiveChanges: readonly MissionObjectiveChange[]
  missionStatus: MissionStatus
  nextMissionState: IceboundState
}
export type IceboundResolution = {
  resolutionId: string
  expectedMissionRevision: number
  expectedSol: number
  feedbackIds: readonly string[]
} & (
  | { allowed: false; code: IceboundIssueCode; reason: string; proposedEffects: null; event: null; analysis?: IceboundAnalysis }
  | { allowed: true; code: 'ALLOWED'; reason: null; proposedEffects: IceboundProposedEffects; event: IceboundEvent }
)
export type IceboundIntent =
  | { type: 'RECON' }
  | { type: 'SELECT_SITE'; siteId: string }
  | { type: 'APPROVE_PLAN'; plan: ExpeditionPlan }
  | { type: 'EXECUTE_EXPEDITION' }
  | { type: 'COLLECT_SAMPLE'; method: SamplingMethod }
  | { type: 'ANALYZE_SAMPLE'; sampleId: string }
  | { type: 'GENERATE_REPORT' }

/** Proposal for C's GameAction union; not registered in shared state by this module. */
export interface IceboundActionProposal {
  type: 'ICEBOUND_COMMAND'
  intent: IceboundIntent
}
