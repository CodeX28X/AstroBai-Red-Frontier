import type { SupplySelection } from '../types/preparation.ts'
import { EQUIPMENT_CATALOG } from './equipmentCatalog.ts'
import { MAX_RESOURCE_VALUE } from '../../../shared/store/resourceEffects.ts'

/** Illustrative game values. No physical quantities or NASA engineering limits. */
export const SUPPLY_BALANCE = {
  maxQuantity: MAX_RESOURCE_VALUE,
  cargoCapacity: 35,
  spacePerPack: 1,
  baseline: { power: 0, oxygen: 0, water: 0, food: 0 },
  resourcePerPack: { power: 1, oxygen: 1, water: 1, food: 1 },
  minimum: { power: 1, oxygen: 0, water: 0, food: 0 },
  suggested: { power: 5, oxygen: 5, water: 5, food: 5 },
  statusBands: { needsHelpBelow: 3, watchBelow: 4 },
} as const
export const SUPPLY_ITEMS = [
  { id: 'power', name: 'Energy Pack', benefit: '+1 Energy Supply', image: '/assets/supplies/energy.svg' },
  { id: 'oxygen', name: 'Oxygen Tank', benefit: '+1 Oxygen Supply', image: '/assets/supplies/oxygen.svg' },
  { id: 'water', name: 'Water Container', benefit: '+1 Water Supply', image: '/assets/supplies/water.svg' },
  { id: 'food', name: 'Food Pack', benefit: '+1 Food Supply', image: '/assets/supplies/food.svg' },
] as const
export const SCIENCE_KIT_IDS = ['repair-toolkit', 'field-rover', 'soil-analysis-kit', 'sample-container-set', 'portable-oxygen-kit'] as const
export const SCIENCE_KIT_SPACE = EQUIPMENT_CATALOG.filter(item => SCIENCE_KIT_IDS.some(id => id === item.id)).reduce((sum, item) => sum + item.cargoMassUnits, 0)
export function emptySupplies(): SupplySelection { return { power: 0, oxygen: 0, water: 0, food: 0 } }
export function validSupplies(value: SupplySelection): boolean {
  return !!value && SUPPLY_ITEMS.every(item => Number.isInteger(value[item.id]) && value[item.id] >= 0 && value[item.id] <= SUPPLY_BALANCE.maxQuantity) && Object.keys(value).length === 4
}
export function supplySpace(selection: SupplySelection | null): number {
  return selection ? SUPPLY_ITEMS.reduce((sum, item) => sum + selection[item.id] * SUPPLY_BALANCE.spacePerPack, 0) : 0
}
export function supplyReserves(selection: SupplySelection): SupplySelection {
  if (!validSupplies(selection)) throw new Error('Invalid supply selection.')
  return { ...selection }
}
