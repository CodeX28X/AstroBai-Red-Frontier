// @ts-nocheck -- Node's built-in test runner supplies these test module types at runtime.
import assert from 'node:assert/strict'
import test from 'node:test'
import { EQUIPMENT_CATALOG } from '../data/equipmentCatalog.ts'

const expectedCategories = [
  'life-support',
  'power',
  'maintenance',
  'shielding',
  'exploration',
  'science',
  'food',
]

test('equipment catalog IDs are unique', () => {
  const ids = EQUIPMENT_CATALOG.map((item) => item.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('all equipment has positive abstract cargo mass', () => {
  for (const item of EQUIPMENT_CATALOG) {
    assert.ok(Number.isFinite(item.cargoMassUnits), `${item.id} mass must be finite`)
    assert.ok(item.cargoMassUnits > 0, `${item.id} mass must be positive`)
  }
})

test('all quantity limits are positive integers', () => {
  for (const item of EQUIPMENT_CATALOG) {
    assert.ok(Number.isInteger(item.maxQuantity), `${item.id} quantity limit must be an integer`)
    assert.ok(item.maxQuantity > 0, `${item.id} quantity limit must be positive`)
  }
})

test('every dependency exists in the catalog', () => {
  const ids = new Set(EQUIPMENT_CATALOG.map((item) => item.id))
  for (const item of EQUIPMENT_CATALOG) {
    for (const dependency of item.dependencies) {
      assert.ok(ids.has(dependency), `${item.id} depends on missing ${dependency}`)
    }
  }
})

test('no equipment depends on itself', () => {
  for (const item of EQUIPMENT_CATALOG) {
    assert.ok(!item.dependencies.includes(item.id), `${item.id} cannot depend on itself`)
  }
})

test('all preparation categories are represented', () => {
  const categories = new Set(EQUIPMENT_CATALOG.map((item) => item.category))
  for (const category of expectedCategories) {
    assert.ok(categories.has(category), `missing category ${category}`)
  }
})

test('catalog contains at least ten optional equipment definitions', () => {
  assert.ok(EQUIPMENT_CATALOG.length >= 10)
})
