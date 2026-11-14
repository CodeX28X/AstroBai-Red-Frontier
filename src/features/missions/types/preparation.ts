import type { MissionId } from '../../../shared/types/game.ts'

export type EquipmentCategory =
  | 'life-support'
  | 'power'
  | 'maintenance'
  | 'shielding'
  | 'exploration'
  | 'science'
  | 'food'

export type EquipmentId = string

export interface EquipmentDefinition {
  id: EquipmentId
  name: string
  category: EquipmentCategory
  description: string
  /** Abstract balancing units only; this value is not a real-world or NASA mass. */
  cargoMassUnits: number
  /** Maximum number of this item allowed in one manifest. */
  maxQuantity: number
  /** Other optional catalog items that must also be in the manifest. */
  dependencies: readonly EquipmentId[]
  /** Search and mission-design labels; tags do not imply gameplay effects. */
  gameplayTags: readonly string[]
}

export interface ManifestEntry {
  equipmentId: EquipmentId
  quantity: number
}

export interface MandatoryOutpostSystem {
  id: string
  description: string
}

export interface OutpostBaselineAssumptions {
  id: string
  description: string
  mandatorySystems: readonly MandatoryOutpostSystem[]
}

export interface MissionManifest {
  missionId: MissionId
  baselineId: string
  optionalCargo: readonly ManifestEntry[]
}

/** Base item and mass totals; the preparation engine adds remaining capacity to its calculation result. */
export interface ManifestSummary {
  distinctEquipmentCount: number
  totalItemCount: number
  totalCargoMassUnits: number
  quantityByCategory: Partial<Record<EquipmentCategory, number>>
}
