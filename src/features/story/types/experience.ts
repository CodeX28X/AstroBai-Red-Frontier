import type { MarsMapProps, FacilityId } from '../../mars-map'
import type { ScriptScene } from '../data/approvedScenes'

// Presentation inputs only. This is NOT GameState or a replacement reducer.
export interface IndicatorView { readonly id: 'power' | 'life' | 'protection'; readonly label: string; readonly symbol: string; readonly level: 'good' | 'watch' | 'danger'; readonly explanation: string; readonly values: readonly { readonly label: string; readonly value: string }[] }
export type PowerChannel = 'life' | 'habitat' | 'greenhouse' | 'lab' | 'comms'
export type PowerDraft = Readonly<Record<PowerChannel, number>>
export interface PowerValidation { readonly valid: boolean; readonly allocated: number | null; readonly remaining: number | null; readonly warnings: readonly string[] }
export interface PowerView { readonly budget: number; readonly plan: PowerDraft; readonly channels: readonly {readonly id: PowerChannel; readonly label: string; readonly min: number; readonly max: number}[]; readonly presets: readonly {readonly label: string;readonly note: string;readonly plan: PowerDraft}[]; readonly validation: PowerValidation; readonly comparison?: string; readonly swapProposal?: {readonly plan: PowerDraft;readonly explanation: string} }
export interface ReadinessView { readonly id: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6'; readonly passed: boolean; readonly reason: string }
export interface EvidenceView { readonly label: string; readonly points: number }
export interface ScienceRecordView { readonly id: string; readonly type: string; readonly observedDate: string; readonly title: string; readonly reportedAttributes: string; readonly sourceName: string; readonly sourceUrl: string; readonly dataMode: 'archived' }
export interface ChoiceAvailability { readonly id: string; readonly available: boolean; readonly hidden?: boolean; readonly reason?: string; readonly blockId?: string; readonly cost?: string }
export interface ExperienceView {
  readonly page: 'menu' | 'prologue' | 'outpost' | 'home-check' | 'discovery' | 'outcome' | 'debrief' | 'recap'
  readonly scene: ScriptScene
  readonly sol: number
  readonly todayGoal?: string
  readonly chapter: 1 | 2 | 3 | 4 | 5
  readonly jobs: readonly { readonly label: 'Big job' | 'Helper job'; readonly available: boolean }[]
  readonly hasSave: boolean
  readonly saveNotice?: { readonly id: 'save_ok' | 'save_corrupt' | 'save_old'; readonly sol?: number }
  readonly tokens: Readonly<Record<string, string | number>>
  readonly indicators: readonly IndicatorView[]
  readonly map: Omit<MarsMapProps, 'selectedFacilityId' | 'onSelectFacility' | 'selectedSiteId' | 'onSelectSite' | 'animationsEnabled'>
  readonly choices: readonly ChoiceAvailability[]
  readonly advance: { readonly allowed: boolean; readonly reason?: string; readonly unusedJobs: number }
  readonly power: PowerView
  readonly readiness: readonly ReadinessView[]
  readonly evidence: readonly EvidenceView[]
  readonly scienceResult: 'positive' | 'inconclusive' | 'negative' | null
  readonly outcome: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILURE' | null
  readonly stars: number
  readonly badges: readonly string[]
  readonly journal: readonly {readonly feedbackId: string;readonly text: string}[]
  readonly lessons: readonly {readonly id: string;readonly caption: string;readonly text: string}[]
  readonly nextIdeas: readonly string[]
  readonly science: ScienceRecordView
  readonly feedback?: {readonly id: string;readonly tokens?: Readonly<Record<string,string|number>>; readonly changedIndicators?: readonly IndicatorView['id'][]}
  readonly postcard?: {readonly text: string}
  readonly baiSuggestion?: {readonly text: string;readonly choiceId?: string}
  readonly selectedMessage?: string
  readonly secretsFound: number
  readonly checkpointAvailable: boolean
  readonly chapterCard?: boolean
  readonly tutorial?: {readonly target: 'indicator' | 'power' | 'advance'; readonly instruction: string}
  readonly criticalReason?: string
  readonly recentDecisions?: readonly string[]
  readonly equipment?: readonly {readonly id:string;readonly label:string;readonly purpose:string;readonly status:string}[]
  readonly facilityInfo?: Readonly<Partial<Record<FacilityId,{readonly statusLine:string}>>>
  readonly labBoostOptions?: readonly {readonly mode:'full'|'slow';readonly label:string;readonly available:boolean;readonly reason?:string}[]
}

// A invokes these ports. The integration owner translates to approved shared actions.
export interface ExperiencePorts {
  // Free UI curiosity metadata only. Never translate inspection into a paid job.
  readonly onInspectLocation?: (id: string) => void
  readonly onChapterCardDismiss: () => void
  readonly onMainMenu: () => void
  readonly onNewMission: () => void
  readonly onContinue: () => void
  readonly onRestart: (scope: 'mission' | 'game' | 'chapter' | 'sol1') => void
  readonly onCargo: (ids: readonly string[]) => void
  readonly onChoice: (id: string) => void
  readonly onAdvanceSol: () => void
  readonly onPowerDraft: (plan: PowerDraft) => void
  readonly onPowerConfirm: (plan: PowerDraft) => void
  readonly onLabBoost: (mode: 'full' | 'slow') => void
  readonly onFeedbackDismiss: () => void
  readonly onPostcardDismiss: () => void
  readonly onMessage: (id: string) => void
}
