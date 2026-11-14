import type { Resources } from '../types/game.ts'

export const MAX_RESOURCE_VALUE = 10
export const RESOURCE_KEYS = ['power', 'oxygen', 'water', 'food'] as const

/** Validate every delta and resulting balance before returning a candidate immutable resource state. */
export function resolveResourceEffects(
  current: Resources,
  proposed: readonly Partial<Resources>[],
): { allowed: true; resources: Resources } | { allowed: false; reason: string } {
  const resources = { ...current }
  for (const resource of RESOURCE_KEYS) {
    if (!Number.isFinite(resources[resource]) || resources[resource] < 0 || resources[resource] > MAX_RESOURCE_VALUE) {
      return { allowed: false, reason: `The ${resource} balance is outside its safe range.` }
    }
  }
  for (const deltas of proposed) {
    for (const [key, delta] of Object.entries(deltas)) {
      if (!RESOURCE_KEYS.some((resource) => resource === key) || !Number.isFinite(delta)) {
        return { allowed: false, reason: `The proposed ${key} change is invalid.` }
      }
      const resource = key as keyof Resources
      const value = resources[resource] + delta
      if (!Number.isFinite(value) || value < 0) {
        return { allowed: false, reason: `The proposed ${resource} balance is outside its safe range.` }
      }
      resources[resource] = delta > 0 ? Math.min(MAX_RESOURCE_VALUE, value) : value
    }
  }
  return { allowed: true, resources: RESOURCE_KEYS.every((resource) => resources[resource] === current[resource]) ? current : resources }
}
