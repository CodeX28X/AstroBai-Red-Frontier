import { EQUIPMENT_CATALOG } from '../../data/equipmentCatalog.ts'
import { reviewMissionPlan } from './reviewMissionPlan.ts'
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

  const latestReview = reviewMissionPlan(state.manifest, state.cargoCapacityUnits)
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
  const latestReview = reviewMissionPlan(state.manifest, state.cargoCapacityUnits)
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
): PreparationState {
  return {
    manifest: {
      ...manifest,
      optionalCargo: manifest.optionalCargo.map((entry) => ({ ...entry })),
    },
    cargoCapacityUnits,
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
