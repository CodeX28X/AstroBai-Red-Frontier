// @ts-nocheck -- Node's built-in test runner supplies these test module types at runtime.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPreparationState,
  preparationEngine,
} from '../engine/preparation/preparationEngine.ts'

const emptyManifest = {
  missionId: 'icebound',
  baselineId: 'fictional-predeployed-outpost-v1',
  optionalCargo: [],
}

function initialState(cargoCapacityUnits = 30, optionalCargo = []) {
  return createPreparationState({ ...emptyManifest, optionalCargo }, cargoCapacityUnits)
}

function setQuantity(state, equipmentId, quantity) {
  return preparationEngine(state, { type: 'SET_EQUIPMENT_QUANTITY', equipmentId, quantity })
}

function review(state) {
  return preparationEngine(state, { type: 'REVIEW_MANIFEST' })
}

function confirm(state) {
  return preparationEngine(state, { type: 'CONFIRM_MANIFEST' })
}

test('adds equipment to the optional manifest', () => {
  const result = setQuantity(initialState(), 'repair-toolkit', 1)
  assert.equal(result.accepted, true)
  assert.deepEqual(result.state.manifest.optionalCargo, [
    { equipmentId: 'repair-toolkit', quantity: 1 },
  ])
  assert.equal(result.state.revision, 1)
  assert.equal(result.state.status, 'editing')
})

test('quantity zero removes the selected equipment', () => {
  const state = initialState(30, [{ equipmentId: 'repair-toolkit', quantity: 1 }])
  const result = setQuantity(state, 'repair-toolkit', 0)
  assert.deepEqual(result.state.manifest.optionalCargo, [])
  assert.equal(result.state.revision, 1)
})

test('changing a quantity updates the existing entry and increments once', () => {
  const state = initialState(30, [{ equipmentId: 'repair-toolkit', quantity: 1 }])
  const result = setQuantity(state, 'repair-toolkit', 2)
  assert.deepEqual(result.state.manifest.optionalCargo, [
    { equipmentId: 'repair-toolkit', quantity: 2 },
  ])
  assert.equal(result.state.revision, 1)
})

test('a no-op quantity selection does not increment the revision', () => {
  const state = initialState(30, [{ equipmentId: 'repair-toolkit', quantity: 1 }])
  const result = setQuantity(state, 'repair-toolkit', 1)
  assert.equal(result.state, state)
  assert.equal(result.state.revision, 0)
})

test('rejects negative, zero-invalid, fractional, and over-limit quantities', () => {
  const state = initialState()
  for (const quantity of [-1, 1.5, 4]) {
    const result = setQuantity(state, 'portable-oxygen-kit', quantity)
    assert.equal(result.accepted, false)
    assert.ok(result.issues.length > 0)
    assert.equal(result.state, state)
  }
})

test('rejects unknown equipment IDs', () => {
  const state = initialState()
  const result = setQuantity(state, 'unknown-equipment', 1)
  assert.equal(result.accepted, false)
  assert.equal(result.issues[0]?.code, 'UNKNOWN_EQUIPMENT')
  assert.equal(result.state, state)
})

test('allows an over-capacity draft but blocks its review confirmation', () => {
  let state = initialState(4)
  const selected = setQuantity(state, 'folding-solar-array', 2)
  assert.equal(selected.accepted, true)
  state = selected.state
  assert.equal(state.status, 'editing')
  assert.equal(state.revision, 1)

  const reviewed = review(state)
  assert.equal(reviewed.accepted, true)
  assert.equal(reviewed.state.status, 'reviewed')
  assert.equal(reviewed.state.latestReview?.allowed, false)
  assert.ok(reviewed.state.latestReview?.blockers.some((item) => item.code === 'manifest-capacity-exceeded'))

  const confirmation = confirm(reviewed.state)
  assert.equal(confirmation.accepted, false)
  assert.equal(confirmation.issues[0]?.code, 'MANIFEST_BLOCKED')
  assert.notEqual(confirmation.state.status, 'confirmed')
})

test('review records the current manifest revision', () => {
  const state = setQuantity(initialState(), 'repair-toolkit', 1).state
  const result = review(state)
  assert.equal(result.accepted, true)
  assert.equal(result.state.status, 'reviewed')
  assert.equal(result.state.reviewedRevision, result.state.revision)
  assert.ok(result.state.latestReview)
})

test('changing cargo after review invalidates that review', () => {
  const reviewed = review(setQuantity(initialState(), 'repair-toolkit', 1).state).state
  const changed = setQuantity(reviewed, 'dust-shield-panels', 1)
  assert.equal(changed.state.status, 'editing')
  assert.equal(changed.state.revision, reviewed.revision + 1)
  assert.equal(changed.state.reviewedRevision, null)
  assert.equal(changed.state.latestReview, null)
  assert.equal(confirm(changed.state).issues[0]?.code, 'REVIEW_REQUIRED')
})

test('confirms a valid manifest and locks its confirmed revision', () => {
  const selected = setQuantity(initialState(), 'repair-toolkit', 1).state
  const reviewed = review(selected).state
  const confirmed = confirm(reviewed)
  assert.equal(confirmed.accepted, true)
  assert.equal(confirmed.state.status, 'confirmed')
  assert.equal(confirmed.state.confirmedAtRevision, selected.revision)
})

test('confirmation permits noncritical warnings', () => {
  const reviewed = review(initialState()).state
  assert.equal(reviewed.latestReview?.warnings.length > 0, true)
  const confirmed = confirm(reviewed)
  assert.equal(confirmed.accepted, true)
  assert.equal(confirmed.state.status, 'confirmed')
})

test('rejects a stale review revision', () => {
  const reviewed = review(initialState()).state
  const stale = { ...reviewed, revision: reviewed.revision + 1 }
  const result = confirm(stale)
  assert.equal(result.accepted, false)
  assert.equal(result.issues[0]?.code, 'STALE_REVIEW')
})

test('rejects edits and repeated confirmations after confirmation', () => {
  const confirmed = confirm(review(initialState()).state).state
  const edit = setQuantity(confirmed, 'repair-toolkit', 1)
  const secondConfirmation = confirm(confirmed)
  assert.equal(edit.accepted, false)
  assert.equal(edit.issues[0]?.code, 'PREPARATION_CONFIRMED')
  assert.equal(secondConfirmation.accepted, false)
  assert.equal(secondConfirmation.issues[0]?.code, 'DUPLICATE_CONFIRMATION')
})

test('does not mutate the input state or manifest', () => {
  const state = initialState(30, [{ equipmentId: 'repair-toolkit', quantity: 1 }])
  Object.freeze(state.manifest.optionalCargo[0])
  Object.freeze(state.manifest.optionalCargo)
  Object.freeze(state.manifest)
  Object.freeze(state)
  const before = structuredClone(state)

  const result = setQuantity(state, 'repair-toolkit', 2)
  assert.deepEqual(state, before)
  assert.equal(result.state.manifest.optionalCargo[0]?.quantity, 2)
})

test('returns deterministic results for identical inputs and intents', () => {
  const state = initialState(30, [{ equipmentId: 'repair-toolkit', quantity: 1 }])
  const intent = { type: 'REVIEW_MANIFEST' }
  assert.deepEqual(preparationEngine(state, intent), preparationEngine(state, intent))
})
