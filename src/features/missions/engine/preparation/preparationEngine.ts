import { EQUIPMENT_CATALOG } from '../../data/equipmentCatalog.ts'
import { reviewMissionPlan } from './reviewMissionPlan.ts'
import { emptySupplies, SCIENCE_KIT_IDS, SCIENCE_KIT_SPACE, SUPPLY_BALANCE, SUPPLY_ITEMS, supplySpace } from '../../data/supplyBalance.ts'
import { calculateManifestSummary } from './calculateManifestSummary.ts'
import type {
  PreparationIntent,
  PreparationIssue,
  PreparationResolution,
  PreparationState,
} from '../../types/preparationEngine.ts'

function result(
  state: PreparationState,
  accepted: boolean,
  issues: PreparationIssue[] = [],
  review = state.latestReview,
): PreparationResolution {
  return { accepted, state, issues, review }
}

function reject(
  state: PreparationState,
  code: PreparationIssue['code'],
  message: string,
): PreparationResolution {
  return result(state, false, [{ code, message }])
}

function setEquipmentQuantity(
  state: PreparationState,
  equipmentId: string,
  quantity: number,
): PreparationResolution {
  if (state.status === 'confirmed') {
    return reject(state, 'PREPARATION_CONFIRMED', 'The confirmed cargo list is locked.')
  }

  const definition = EQUIPMENT_CATALOG.find((item) => item.id === equipmentId)
  if (definition === undefined) {
    return reject(state, 'UNKNOWN_EQUIPMENT', `Equipment "${equipmentId}" is not in the catalog.`)
  }
  if (!Number.isInteger(quantity) || quantity < 0) {
    return reject(state, 'INVALID_QUANTITY', 'Choose zero or a positive whole-number quantity.')
  }
  if (quantity > definition.maxQuantity) {
    return reject(
      state,
      'QUANTITY_EXCEEDS_LIMIT',
      `${definition.name} allows up to ${definition.maxQuantity} per manifest.`,
    )
  }

  const existing = state.manifest.optionalCargo.find((entry) => entry.equipmentId === equipmentId)
  const currentQuantity = existing?.quantity ?? 0
  if (currentQuantity === quantity) return result(state, true)

  const optionalCargo = state.manifest.optionalCargo.filter((entry) => entry.equipmentId !== equipmentId)
  if (quantity > 0) optionalCargo.push({ equipmentId, quantity })
  if (state.supplies && calculateManifestSummary({ ...state.manifest, optionalCargo }, state.cargoCapacityUnits).totalCargoMassUnits + supplySpace(state.supplies) > state.cargoCapacityUnits) return reject(state, 'CAPACITY_EXCEEDED', 'Our cargo is full. Remove a pack or extra equipment first.')

  return result({
    ...state,
    manifest: { ...state.manifest, optionalCargo },
    status: 'editing',
    revision: state.revision + 1,
    reviewedRevision: null,
    confirmedAtRevision: null,
    latestReview: null,
  }, true, [], null)
}

function review(state: PreparationState): PreparationResolution {
  if (state.status === 'confirmed') {
    return reject(state, 'PREPARATION_CONFIRMED', 'The confirmed cargo list is locked.')
  }

  const latestReview = reviewMissionPlan(state.manifest, state.cargoCapacityUnits, state.supplies)
  const reviewedState: PreparationState = {
    ...state,
    status: 'reviewed',
    reviewedRevision: state.revision,
    latestReview,
  }
  return result(reviewedState, true, [], latestReview)
}

function confirm(state: PreparationState): PreparationResolution {
  if (state.status === 'confirmed' || state.confirmedAtRevision !== null) {
    return reject(state, 'DUPLICATE_CONFIRMATION', 'This cargo list has already been confirmed.')
  }
  if (state.reviewedRevision === null || state.latestReview === null || state.status !== 'reviewed') {
    return reject(state, 'REVIEW_REQUIRED', 'Review the current cargo list before confirming it.')
  }
  if (state.reviewedRevision !== state.revision) {
    return reject(state, 'STALE_REVIEW', 'The cargo list changed after review. Review it again before confirming.')
  }

  // Re-run the rule checks at the confirmation boundary; warnings remain non-blocking.
  const latestReview = reviewMissionPlan(state.manifest, state.cargoCapacityUnits, state.supplies)
  if (!latestReview.allowed) {
    const blockedState: PreparationState = { ...state, latestReview }
    return reject(blockedState, 'MANIFEST_BLOCKED', 'Fix the blocking cargo issues before confirmation.')
  }

  const confirmedState: PreparationState = {
    ...state,
    status: 'confirmed',
    confirmedAtRevision: state.revision,
    latestReview,
  }
  return result(confirmedState, true, [], latestReview)
}


export function createPreparationState(
  manifest: PreparationState['manifest'],
  cargoCapacityUnits: number,
  supplyMode = false,
): PreparationState {
  return {
    manifest: {
      ...manifest,
      optionalCargo: manifest.optionalCargo.map((entry) => ({ ...entry })),
    },
    cargoCapacityUnits,
    supplies: supplyMode ? emptySupplies() : null,
    status: 'editing',
    revision: 0,
    reviewedRevision: null,
    confirmedAtRevision: null,
    latestReview: null,
  }
}
/** Runs preparation intents as pure transitions. It never changes game resources or browser state. */
export function preparationEngine(
  state: PreparationState,
  intent: PreparationIntent,
): PreparationResolution {
  switch (intent.type) {
    case 'SET_SUPPLY_QUANTITY': {
      if (!state.supplies) return reject(state, 'INVALID_QUANTITY', 'This mission uses the original equipment manifest.')
      if (state.status === 'confirmed') return reject(state, 'PREPARATION_CONFIRMED', 'The confirmed cargo list is locked.')
      if (!SUPPLY_ITEMS.some(item => item.id === intent.supplyId) || !Number.isInteger(intent.quantity) || intent.quantity < 0 || intent.quantity > SUPPLY_BALANCE.maxQuantity) return reject(state, 'INVALID_QUANTITY', 'Choose a whole number from 0 to 10.')
      if (state.supplies[intent.supplyId] === intent.quantity) return result(state, true)
      const supplies = { ...state.supplies, [intent.supplyId]: intent.quantity }
      const mass = calculateManifestSummary(state.manifest, state.cargoCapacityUnits).totalCargoMassUnits + supplySpace(supplies)
      if (mass > state.cargoCapacityUnits) return reject(state, 'CAPACITY_EXCEEDED', 'Our cargo is full. Remove a pack or the science kit first.')
      return result({ ...state, supplies, status: 'editing', revision: state.revision + 1, reviewedRevision: null, confirmedAtRevision: null, latestReview: null }, true, [], null)
    }
    case 'SET_SCIENCE_KIT': {
      if (!state.supplies || typeof intent.packed !== 'boolean') return reject(state, 'INVALID_QUANTITY', 'Choose whether to pack the science kit.')
      if (state.status === 'confirmed') return reject(state, 'PREPARATION_CONFIRMED', 'The confirmed cargo list is locked.')
      const optionalCargo = state.manifest.optionalCargo.filter(entry => !SCIENCE_KIT_IDS.some(id => id === entry.equipmentId))
      if (intent.packed) optionalCargo.push(...SCIENCE_KIT_IDS.map(equipmentId => ({ equipmentId, quantity: 1 })))
      if (calculateManifestSummary({ ...state.manifest, optionalCargo }, state.cargoCapacityUnits).totalCargoMassUnits + supplySpace(state.supplies) > state.cargoCapacityUnits) return reject(state, 'CAPACITY_EXCEEDED', `The science kit needs ${SCIENCE_KIT_SPACE} cargo spaces. Remove some supply packs first.`)
      if (JSON.stringify(optionalCargo) === JSON.stringify(state.manifest.optionalCargo)) return result(state, true)
      return result({ ...state, manifest: { ...state.manifest, optionalCargo }, status: 'editing', revision: state.revision + 1, reviewedRevision: null, confirmedAtRevision: null, latestReview: null }, true, [], null)
    }
    case 'SET_EQUIPMENT_QUANTITY':
      return setEquipmentQuantity(state, intent.equipmentId, intent.quantity)
    case 'REVIEW_MANIFEST':
      return review(state)
    case 'CONFIRM_MANIFEST':
      return confirm(state)
    default: {
      const exhaustiveIntent: never = intent
      return exhaustiveIntent
    }
  }
}
