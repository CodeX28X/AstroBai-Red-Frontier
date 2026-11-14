import { EQUIPMENT_CATALOG, PREDEPLOYED_OUTPOST_BASELINE } from '../../data/equipmentCatalog.ts'
import type { ManifestValidationIssue } from './validateManifest.ts'
import { validateManifest } from './validateManifest.ts'
import type { MissionManifest } from '../../types/preparation.ts'

export type MissionReviewSeverity = 'blocker' | 'warning' | 'recommendation' | 'positive' | 'assumption'

export interface MissionReviewItem<S extends MissionReviewSeverity = MissionReviewSeverity> {
  code: string
  severity: S
  explanation: string
}

export interface MissionReview {
  /** False only when at least one safety or manifest blocker exists. */
  allowed: boolean
  blockers: MissionReviewItem<'blocker'>[]
  warnings: MissionReviewItem<'warning'>[]
  recommendations: MissionReviewItem<'recommendation'>[]
  positiveFeedback: MissionReviewItem<'positive'>[]
  /** Critical fictional baseline assumptions; separate from optional cargo advice. */
  criticalReadinessAssumptions: MissionReviewItem<'assumption'>[]
}

const catalogById = new Map<string, (typeof EQUIPMENT_CATALOG)[number]>(
  EQUIPMENT_CATALOG.map((equipment) => [equipment.id, equipment]),
)

function explainValidationIssue(issue: ManifestValidationIssue): string {
  switch (issue.code) {
    case 'INVALID_CARGO_LIMIT':
      return 'The cargo limit needs to be a valid number before this plan can be checked.'
    case 'UNKNOWN_EQUIPMENT':
      return `“${issue.equipmentId}” is not in the equipment list. Choose an item from the catalog.`
    case 'INVALID_QUANTITY':
      return `Choose a whole number greater than zero for ${catalogById.get(issue.equipmentId ?? '')?.name ?? 'this item'}.`
    case 'QUANTITY_EXCEEDS_LIMIT':
      return `You can pack up to ${issue.limit} of ${catalogById.get(issue.equipmentId ?? '')?.name ?? 'this item'}.`
    case 'DUPLICATE_EQUIPMENT':
      return `List ${catalogById.get(issue.equipmentId ?? '')?.name ?? 'this item'} once and set its quantity on that line.`
    case 'MISSING_DEPENDENCY':
      return `Pack ${catalogById.get(issue.dependencyId ?? '')?.name ?? issue.dependencyId} so ${catalogById.get(issue.equipmentId ?? '')?.name ?? 'this item'} can be used.`
    case 'CAPACITY_EXCEEDED':
      return 'The optional cargo is over the limit. Remove or reduce items before confirming this plan.'
  }
}

function fromValidationIssue<S extends 'blocker' | 'warning' | 'recommendation'>(
  issue: ManifestValidationIssue,
  severity: S,
): MissionReviewItem<S> {
  return {
    code: `manifest-${issue.code.toLowerCase().replaceAll('_', '-')}`,
    severity,
    explanation: explainValidationIssue(issue),
  }
}

function makeItem<S extends MissionReviewSeverity>(
  code: string,
  severity: S,
  explanation: string,
): MissionReviewItem<S> {
  return { code, severity, explanation }
}

function selectedIds(manifest: MissionManifest): Set<string> {
  return new Set(manifest.optionalCargo.map((entry) => entry.equipmentId))
}

function hasSelected(selection: ReadonlySet<string>, equipmentId: string): boolean {
  return selection.has(equipmentId)
}

function baselineAssumption(): MissionReviewItem<'assumption'> {
  const systems = PREDEPLOYED_OUTPOST_BASELINE.mandatorySystems
    .map((system) => system.description)
    .join(' ')

  return makeItem(
    'fictional-outpost-baseline-assumed',
    'assumption',
    `This review assumes the fictional outpost already has these required systems: ${systems} This checklist is not a real flight-readiness certification.`,
  )
}

export function reviewMissionPlan(
  manifest: MissionManifest,
  cargoCapacityUnits: number,
): MissionReview {
  const validation = validateManifest(manifest, cargoCapacityUnits)
  const blockers = validation.blockers.map((item) => fromValidationIssue(item, 'blocker'))
  const warnings = validation.warnings.map((item) => fromValidationIssue(item, 'warning'))
  const recommendations = validation.recommendations.map((item) => fromValidationIssue(item, 'recommendation'))
  const selection = selectedIds(manifest)

  const hasBackupPower = hasSelected(selection, 'portable-battery-bank')
  const hasSolarArray = hasSelected(selection, 'folding-solar-array')
  if (!hasBackupPower) {
    warnings.push(makeItem(
      'optional-power-backup-missing',
      'warning',
      'The outpost has basic power in the fictional baseline, but this plan has no optional battery backup for later choices.',
    ))
  }

  const hasRepairToolkit = hasSelected(selection, 'repair-toolkit')
  const hasSpareParts = hasSelected(selection, 'spare-parts-crate')
  if (!hasRepairToolkit) {
    warnings.push(makeItem(
      'optional-repair-toolkit-missing',
      'warning',
      'The outpost baseline has basic systems, but this plan has no optional repair toolkit for crew fixes.',
    ))
  } else if (!hasSpareParts) {
    recommendations.push(makeItem(
      'optional-spare-parts-recommended',
      'recommendation',
      'You packed repair tools. A spare-parts crate could give the crew more items to work with.',
    ))
  }

  const hasShielding =
    hasSelected(selection, 'dust-shield-panels') || hasSelected(selection, 'radiation-shelter-liner')
  if (!hasShielding) {
    warnings.push(makeItem(
      'optional-shelter-upgrade-missing',
      'warning',
      'The baseline includes a habitat, but this plan has no optional shelter or equipment shielding upgrade.',
    ))
  }

  const hasScienceKit = hasSelected(selection, 'soil-analysis-kit')
  const hasSampleContainers = hasSelected(selection, 'sample-container-set')
  if (hasScienceKit && !hasSampleContainers) {
    recommendations.push(makeItem(
      'science-support-tools-missing',
      'recommendation',
      'You packed a soil analysis kit. Sample containers could help keep collected material organized.',
    ))
  }

  const scienceSupportReady = !hasScienceKit || hasSampleContainers
  const optionalPlanReady =
    validation.valid &&
    hasBackupPower &&
    hasSolarArray &&
    hasRepairToolkit &&
    hasSpareParts &&
    hasShielding &&
    scienceSupportReady &&
    warnings.length === 0 &&
    recommendations.length === 0

  const positiveFeedback = optionalPlanReady
    ? [makeItem(
        'optional-plan-well-prepared',
        'positive',
        'Nice planning! Your optional cargo includes backup power, repair supplies, and a shelter upgrade for the crew.',
      )]
    : []

  return {
    allowed: blockers.length === 0,
    blockers,
    warnings,
    recommendations,
    positiveFeedback,
    criticalReadinessAssumptions: [baselineAssumption()],
  }
}
