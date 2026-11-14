// @ts-nocheck -- Node's built-in test runner supplies these test module types at runtime.
import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateManifestSummary } from '../engine/preparation/calculateManifestSummary.ts'
import { validateManifest } from '../engine/preparation/validateManifest.ts'

function manifest(optionalCargo = []) {
  return {
    missionId: 'icebound',
    baselineId: 'fictional-predeployed-outpost-v1',
    optionalCargo,
  }
}

function issueCodes(result) {
  return result.issues.map((entry) => entry.code)
}

test('accepts an empty optional manifest and reports all capacity remaining', () => {
  const result = validateManifest(manifest(), 12)
  assert.equal(result.valid, true)
  assert.deepEqual(result.summary, {
    distinctEquipmentCount: 0,
    totalItemCount: 0,
    totalCargoMassUnits: 0,
    quantityByCategory: {},
    remainingCapacityUnits: 12,
  })
})

test('accepts a valid manifest with required dependencies', () => {
  const result = validateManifest(manifest([
    { equipmentId: 'folding-solar-array', quantity: 1 },
    { equipmentId: 'portable-battery-bank', quantity: 1 },
    { equipmentId: 'repair-toolkit', quantity: 1 },
    { equipmentId: 'field-rover', quantity: 1 },
  ]), 20)
  assert.equal(result.valid, true)
  assert.equal(result.summary?.totalItemCount, 4)
  assert.equal(result.summary?.totalCargoMassUnits, 16)
  assert.equal(result.summary?.remainingCapacityUnits, 4)
})

test('accepts a manifest exactly at the capacity boundary', () => {
  const result = validateManifest(manifest([
    { equipmentId: 'repair-toolkit', quantity: 1 },
  ]), 2)
  assert.equal(result.valid, true)
  assert.equal(result.summary?.remainingCapacityUnits, 0)
})

test('rejects an over-capacity manifest as a safety blocker', () => {
  const result = validateManifest(manifest([
    { equipmentId: 'repair-toolkit', quantity: 1 },
  ]), 1)
  assert.equal(result.valid, false)
  assert.ok(issueCodes(result).includes('CAPACITY_EXCEEDED'))
  assert.equal(result.blockers[0]?.severity, 'blocker')
  assert.deepEqual(result.warnings, [])
})

test('rejects unknown equipment IDs', () => {
  const result = validateManifest(manifest([
    { equipmentId: 'unknown-crate', quantity: 1 },
  ]), 10)
  assert.ok(issueCodes(result).includes('UNKNOWN_EQUIPMENT'))
  assert.equal(result.summary, null)
})

test('rejects negative quantities', () => {
  const result = validateManifest(manifest([
    { equipmentId: 'repair-toolkit', quantity: -1 },
  ]), 10)
  assert.ok(issueCodes(result).includes('INVALID_QUANTITY'))
})

test('rejects zero quantities', () => {
  const result = validateManifest(manifest([
    { equipmentId: 'repair-toolkit', quantity: 0 },
  ]), 10)
  assert.ok(issueCodes(result).includes('INVALID_QUANTITY'))
})

test('rejects fractional quantities', () => {
  const result = validateManifest(manifest([
    { equipmentId: 'repair-toolkit', quantity: 1.5 },
  ]), 10)
  assert.ok(issueCodes(result).includes('INVALID_QUANTITY'))
})

test('rejects quantities above the catalog maximum', () => {
  const result = validateManifest(manifest([
    { equipmentId: 'portable-oxygen-kit', quantity: 4 },
  ]), 20)
  assert.ok(issueCodes(result).includes('QUANTITY_EXCEEDS_LIMIT'))
})

test('rejects duplicate equipment entries instead of merging them', () => {
  const result = validateManifest(manifest([
    { equipmentId: 'repair-toolkit', quantity: 1 },
    { equipmentId: 'repair-toolkit', quantity: 1 },
  ]), 10)
  assert.ok(issueCodes(result).includes('DUPLICATE_EQUIPMENT'))
  assert.equal(result.summary, null)
})

test('rejects a missing equipment dependency', () => {
  const result = validateManifest(manifest([
    { equipmentId: 'portable-battery-bank', quantity: 1 },
  ]), 10)
  assert.ok(issueCodes(result).includes('MISSING_DEPENDENCY'))
  assert.equal(result.summary?.totalCargoMassUnits, 3)
})

test('rejects invalid cargo limits', () => {
  for (const capacity of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const result = validateManifest(manifest(), capacity)
    assert.equal(result.valid, false)
    assert.ok(issueCodes(result).includes('INVALID_CARGO_LIMIT'))
    assert.equal(result.summary, null)
  }
})

test('does not mutate the manifest input', () => {
  const input = manifest([
    { equipmentId: 'repair-toolkit', quantity: 1 },
  ])
  Object.freeze(input.optionalCargo[0])
  Object.freeze(input.optionalCargo)
  Object.freeze(input)
  const before = structuredClone(input)

  validateManifest(input, 10)
  assert.deepEqual(input, before)
})

test('returns the same result for the same input', () => {
  const input = manifest([
    { equipmentId: 'folding-solar-array', quantity: 1 },
    { equipmentId: 'portable-battery-bank', quantity: 1 },
  ])
  assert.deepEqual(validateManifest(input, 12), validateManifest(input, 12))
  assert.deepEqual(calculateManifestSummary(input, 12), calculateManifestSummary(input, 12))
})
