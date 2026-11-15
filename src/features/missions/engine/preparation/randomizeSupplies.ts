import type { PreparationState } from '../../types/preparationEngine.ts'
import type { SupplySelection } from '../../types/preparation.ts'
import { SUPPLY_BALANCE, SUPPLY_ITEMS, supplySpace } from '../../data/supplyBalance.ts'
import { calculateManifestSummary } from './calculateManifestSummary.ts'

/** Conservative starting reserves, leaving time to use the real production systems. */
export function randomSupplyMinimum(): SupplySelection {
  return Object.fromEntries(SUPPLY_ITEMS.map(({ id }) => [id, Math.max(SUPPLY_BALANCE.minimum[id], SUPPLY_BALANCE.suggested[id] - (id === 'power' ? 0 : 1))])) as unknown as SupplySelection
}

/** Pure and deterministic for an injected [0,1) source. Packed equipment is never removed. */
export function randomizeSupplies(state: PreparationState, random: () => number = Math.random): SupplySelection {
  const supplies = randomSupplyMinimum()
  const budget = Math.min(SUPPLY_BALANCE.maxQuantity * SUPPLY_ITEMS.length, Math.floor((state.cargoCapacityUnits - calculateManifestSummary(state.manifest, state.cargoCapacityUnits).totalCargoMassUnits) / SUPPLY_BALANCE.spacePerPack))
  if (budget < supplySpace(supplies) / SUPPLY_BALANCE.spacePerPack) throw new Error('Remove extra equipment to make room for a safe supply plan.')
  const draw = () => { const value = random(); if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Random source must return a value from 0 up to 1.'); return value }
  const target = Math.max(supplySpace(supplies) / SUPPLY_BALANCE.spacePerPack, Math.floor(budget * (.9 + draw() * .1)))
  while (supplySpace(supplies) / SUPPLY_BALANCE.spacePerPack < target) {
    const choices = SUPPLY_ITEMS.filter(({ id }) => supplies[id] < SUPPLY_BALANCE.maxQuantity)
    supplies[choices[Math.floor(draw() * choices.length)].id] += 1
  }
  return supplies
}
