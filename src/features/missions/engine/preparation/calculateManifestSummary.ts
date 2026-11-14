import { EQUIPMENT_CATALOG } from '../../data/equipmentCatalog.ts'
import type { EquipmentDefinition, ManifestSummary, MissionManifest } from '../../types/preparation.ts'

export interface CalculatedManifestSummary extends ManifestSummary {
  remainingCapacityUnits: number
}

/**
 * Calculates a manifest summary without changing the input. Callers should validate a
 * manifest first; this function throws if capacity, quantities, duplicates, or catalog IDs
 * make a reliable total impossible.
 */
export function calculateManifestSummary(
  manifest: MissionManifest,
  cargoCapacityUnits: number,
  catalog: readonly EquipmentDefinition[] = EQUIPMENT_CATALOG,
): CalculatedManifestSummary {
  if (!Number.isFinite(cargoCapacityUnits) || cargoCapacityUnits < 0) {
    throw new RangeError('Cargo capacity must be a finite, non-negative number of abstract units.')
  }

  const equipmentById = new Map(catalog.map((equipment) => [equipment.id, equipment]))
  const seenIds = new Set<string>()
  const quantityByCategory: ManifestSummary['quantityByCategory'] = {}
  let totalItemCount = 0
  let totalCargoMassUnits = 0

  for (const entry of manifest.optionalCargo) {
    if (seenIds.has(entry.equipmentId)) {
      throw new Error(`Duplicate manifest entry for ${entry.equipmentId}.`)
    }
    seenIds.add(entry.equipmentId)

    const equipment = equipmentById.get(entry.equipmentId)
    if (equipment === undefined) {
      throw new Error(`Unknown equipment ID: ${entry.equipmentId}.`)
    }
    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0 || entry.quantity > equipment.maxQuantity) {
      throw new RangeError(`Invalid quantity for ${entry.equipmentId}.`)
    }

    totalItemCount += entry.quantity
    totalCargoMassUnits += equipment.cargoMassUnits * entry.quantity
    quantityByCategory[equipment.category] =
      (quantityByCategory[equipment.category] ?? 0) + entry.quantity
  }

  return {
    distinctEquipmentCount: seenIds.size,
    totalItemCount,
    totalCargoMassUnits,
    quantityByCategory,
    remainingCapacityUnits: cargoCapacityUnits - totalCargoMassUnits,
  }
}
