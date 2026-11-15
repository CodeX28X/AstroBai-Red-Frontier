import { EQUIPMENT_CATALOG, PREDEPLOYED_OUTPOST_BASELINE } from '../../data/equipmentCatalog.ts'
import type { ManifestValidationIssue } from './validateManifest.ts'
import { validateManifest } from './validateManifest.ts'
import type { MissionManifest } from '../../types/preparation.ts'
import type { SupplySelection } from '../../types/preparation.ts'
import { SCIENCE_KIT_IDS, SUPPLY_BALANCE, SUPPLY_ITEMS, supplySpace, validSupplies } from '../../data/supplyBalance.ts'
import { ICEBOUND_BALANCE } from '../../data/iceboundMission.ts'
import { LANDING_RESOURCE_EFFECTS } from '../../data/landingSites.ts'

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
  supplies: SupplySelection | null = null,
): MissionReview {
  const validation = validateManifest(manifest, cargoCapacityUnits)
  const blockers = validation.blockers.map((item) => fromValidationIssue(item, 'blocker'))
  const warnings = validation.warnings.map((item) => fromValidationIssue(item, 'warning'))
  const recommendations = validation.recommendations.map((item) => fromValidationIssue(item, 'recommendation'))
  const selection = selectedIds(manifest)
  if (supplies) {
    if (!validSupplies(supplies)) blockers.push(makeItem('supply-invalid', 'blocker', 'Choose whole-number supply quantities from 0 to 10.'))
    else {
      for (const item of SUPPLY_ITEMS) if (supplies[item.id] < SUPPLY_BALANCE.minimum[item.id]) blockers.push(makeItem(`supply-${item.id}-low`, 'blocker', `Pack at least one ${item.name} for our mission.`))
      if (validation.summary && validation.summary.totalCargoMassUnits + supplySpace(supplies) > cargoCapacityUnits) blockers.push(makeItem('supply-capacity-exceeded', 'blocker', 'Cargo is full. Remove some packs or extra equipment.'))
    }
    const kitReady = SCIENCE_KIT_IDS.every(id => selection.has(id))
    if (!kitReady) recommendations.push(makeItem('science-kit-missing', 'recommendation', 'Standard science equipment can complete ICEBOUND. Optional tools can improve sample handling and evidence quality.'))
    const investigationEnergy = (ICEBOUND_BALANCE.recon.power ?? 0) + (ICEBOUND_BALANCE.expedition['rover-only'].power ?? 0) + (ICEBOUND_BALANCE.sampling['surface-sampling'].power ?? 0) + (ICEBOUND_BALANCE.analysis.power ?? 0)
    const safeEnergy = investigationEnergy - (LANDING_RESOURCE_EFFECTS['landing-safe-zone'].power ?? 0)
    const researchEnergy = investigationEnergy - (LANDING_RESOURCE_EFFECTS['landing-research-zone'].power ?? 0)
    if (supplies.power < researchEnergy) warnings.push(makeItem('supply-energy-tight', 'warning', `A rover investigation needs ${safeEnergy} energy with the safe landing or ${researchEnergy} with the research landing. Add energy or consider a crew-only plan.`))
    for (const item of SUPPLY_ITEMS.filter(item => item.id !== 'power')) if (supplies[item.id] === 0) warnings.push(makeItem(`supply-${item.id}-empty`, 'warning', `${item.name} is empty. Crew expeditions may need this resource.`))
    return { allowed: blockers.length === 0, blockers, warnings, recommendations,
      positiveFeedback: blockers.length === 0 ? [makeItem('supplies-ready', 'positive', 'Supplies checked. Our loadout is ready!')] : [], criticalReadinessAssumptions: [baselineAssumption()] }
  }

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
