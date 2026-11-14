import { EQUIPMENT_CATALOG } from '../../data/equipmentCatalog.ts'
import type { EquipmentDefinition, MissionManifest } from '../../types/preparation.ts'
import {
  calculateManifestSummary,
  type CalculatedManifestSummary,
} from './calculateManifestSummary.ts'

export type ManifestValidationIssueCode =
  | 'INVALID_CARGO_LIMIT'
  | 'UNKNOWN_EQUIPMENT'
  | 'INVALID_QUANTITY'
  | 'QUANTITY_EXCEEDS_LIMIT'
  | 'DUPLICATE_EQUIPMENT'
  | 'MISSING_DEPENDENCY'
  | 'CAPACITY_EXCEEDED'

export type ManifestIssueSeverity = 'blocker' | 'warning' | 'recommendation'

export interface ManifestValidationIssue {
  code: ManifestValidationIssueCode
  severity: ManifestIssueSeverity
  message: string
  equipmentId?: string
  dependencyId?: string
  quantity?: number
  limit?: number
}

export interface ManifestValidationResult {
  valid: boolean
  summary: CalculatedManifestSummary | null
  issues: ManifestValidationIssue[]
  blockers: ManifestValidationIssue[]
  warnings: ManifestValidationIssue[]
  recommendations: ManifestValidationIssue[]
}

function issue(
  code: ManifestValidationIssueCode,
  message: string,
  details: Omit<ManifestValidationIssue, 'code' | 'severity' | 'message'> = {},
): ManifestValidationIssue {
  return { code, severity: 'blocker', message, ...details }
}

export function validateManifest(
  manifest: MissionManifest,
  cargoCapacityUnits: number,
  catalog: readonly EquipmentDefinition[] = EQUIPMENT_CATALOG,
): ManifestValidationResult {
  const blockers: ManifestValidationIssue[] = []
  const warnings: ManifestValidationIssue[] = []
  const recommendations: ManifestValidationIssue[] = []
  const equipmentById = new Map(catalog.map((equipment) => [equipment.id, equipment]))
  const entriesById = new Map<string, number>()
  const eligibleEntries = new Set<string>()
  let entriesCanBeSummarized = true

  if (!Number.isFinite(cargoCapacityUnits) || cargoCapacityUnits < 0) {
    blockers.push(issue(
      'INVALID_CARGO_LIMIT',
      'Cargo capacity must be a finite, non-negative number of abstract units.',
    ))
  }

  for (const entry of manifest.optionalCargo) {
    if (entriesById.has(entry.equipmentId)) {
      blockers.push(issue(
        'DUPLICATE_EQUIPMENT',
        `Equipment ${entry.equipmentId} appears more than once; combine quantities into one entry.`,
        { equipmentId: entry.equipmentId },
      ))
      entriesCanBeSummarized = false
    } else {
      entriesById.set(entry.equipmentId, entry.quantity)
    }

    const equipment = equipmentById.get(entry.equipmentId)
    if (equipment === undefined) {
      blockers.push(issue(
        'UNKNOWN_EQUIPMENT',
        `Equipment ID ${entry.equipmentId} is not in the catalog.`,
        { equipmentId: entry.equipmentId },
      ))
      entriesCanBeSummarized = false
      continue
    }

    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0) {
      blockers.push(issue(
        'INVALID_QUANTITY',
        `Quantity for ${entry.equipmentId} must be a positive whole number.`,
        { equipmentId: entry.equipmentId, quantity: entry.quantity },
      ))
      entriesCanBeSummarized = false
      continue
    }

    eligibleEntries.add(entry.equipmentId)
    if (entry.quantity > equipment.maxQuantity) {
      blockers.push(issue(
        'QUANTITY_EXCEEDS_LIMIT',
        `Quantity for ${entry.equipmentId} exceeds its maximum of ${equipment.maxQuantity}.`,
        { equipmentId: entry.equipmentId, quantity: entry.quantity, limit: equipment.maxQuantity },
      ))
      entriesCanBeSummarized = false
    }
  }

  for (const equipmentId of eligibleEntries) {
    const equipment = equipmentById.get(equipmentId)!
    for (const dependencyId of equipment.dependencies) {
      if (!eligibleEntries.has(dependencyId)) {
        blockers.push(issue(
          'MISSING_DEPENDENCY',
          `${equipment.name} requires ${dependencyId} in the manifest.`,
          { equipmentId, dependencyId },
        ))
      }
    }
  }

  let summary: CalculatedManifestSummary | null = null
  if (entriesCanBeSummarized && Number.isFinite(cargoCapacityUnits) && cargoCapacityUnits >= 0) {
    summary = calculateManifestSummary(manifest, cargoCapacityUnits, catalog)
    if (summary.remainingCapacityUnits < 0) {
      blockers.push(issue(
        'CAPACITY_EXCEEDED',
        `Optional cargo exceeds capacity by ${Math.abs(summary.remainingCapacityUnits)} abstract units.`,
      ))
    }
  }

  return {
    valid: blockers.length === 0,
    summary,
    issues: [...blockers, ...warnings, ...recommendations],
    blockers,
    warnings,
    recommendations,
  }
}
