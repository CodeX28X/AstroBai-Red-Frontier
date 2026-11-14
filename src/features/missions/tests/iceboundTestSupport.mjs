import assert from 'node:assert/strict'
import { gameReducer, createInitialGameState } from '../../../shared/store/gameReducer.ts'
import { createIceboundState, iceboundEngine } from '../engine/icebound/index.ts'

export const equipmentIds = ['field-rover', 'repair-toolkit', 'soil-analysis-kit', 'sample-container-set', 'portable-oxygen-kit']

export function fixture(scenarioId = 'icebound.training-v1') {
  let game = gameReducer(createInitialGameState(), { type: 'START_GAME' })
  for (const equipmentId of equipmentIds) game = gameReducer(game, { type: 'SET_EQUIPMENT_QUANTITY', equipmentId, quantity: 1 })
  for (const type of ['REVIEW_MANIFEST', 'CONFIRM_MANIFEST', 'BEGIN_LAUNCH', 'COMPLETE_LAUNCH']) game = gameReducer(game, { type })
  game = gameReducer(game, { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' })
  for (let sol = 0; sol < 3; sol++) game = gameReducer(game, { type: 'ADVANCE_SOL' })
  return {
    game: { ...game, facilities: { ...game.facilities, habitat: 'operational' } },
    mission: createIceboundState('test-run', scenarioId),
    readiness: {
      deployedEquipment: equipmentIds.map((equipmentId) => ({ equipmentId, status: 'operational' })),
      baselineCapabilities: ['lab-analysis', 'drilling'],
      roverOperational: true, roverEnergyReady: true, crewAvailable: true, crewSafeForEva: true,
      communicationsReady: true, laboratoryOperational: true, weather: 'clear', radiation: 'clear',
    },
  }
}

/** Test-only transaction harness. Production application remains exclusively C's responsibility. */
export function commit(context, resolution) {
  assert.equal(resolution.allowed, true, resolution.reason)
  assert.equal(resolution.expectedMissionRevision, context.mission.revision, 'stale mission revision')
  assert.equal(resolution.expectedSol, context.game.sol, 'stale sol')
  assert.ok(!context.game.spentActionIds.includes(resolution.resolutionId), 'duplicate resolution')
  const effects = resolution.proposedEffects
  assert.ok(context.game.actionsRemaining >= effects.actionSlotCost)
  const resources = { ...context.game.resources }
  for (const [key, delta] of Object.entries(effects.resourceDeltas)) {
    resources[key] += delta
    assert.ok(Number.isFinite(resources[key]) && resources[key] >= 0 && resources[key] <= 100)
  }
  const objectives = [...context.game.objectives]
  for (const change of effects.objectiveChanges) {
    assert.ok(!objectives.some((item) => item.id === change.objectiveId && item.completed), 'duplicate objective')
    objectives.push({ id: change.objectiveId, completed: change.completed })
  }
  return { ...context, game: { ...context.game, resources, objectives,
    actionsRemaining: context.game.actionsRemaining - effects.actionSlotCost,
    spentActionIds: [...context.game.spentActionIds, resolution.resolutionId],
    missions: { ...context.game.missions, icebound: effects.missionStatus },
  }, mission: effects.nextMissionState }
}
export function act(context, intent) { return commit(context, iceboundEngine(context, intent)) }
export function nextSol(context) { return { ...context, game: gameReducer(context.game, { type: 'ADVANCE_SOL' }) } }
export function plan(siteId = 'icebound.lumen-shelf', method = 'rover-only', activity = 'subsurface-drilling') {
  return { siteId, method, activity, equipmentIds: [...equipmentIds], supplies: { power: 30, oxygen: 15, water: 8, food: 8 } }
}
export function selected(siteId = 'icebound.lumen-shelf', scenarioId = 'icebound.training-v1') {
  let context = act(fixture(scenarioId), { type: 'RECON' })
  return act(context, { type: 'SELECT_SITE', siteId })
}
export function executed(siteId = 'icebound.lumen-shelf', method = 'rover-only', activity = 'subsurface-drilling', scenarioId = 'icebound.training-v1') {
  let context = selected(siteId, scenarioId)
  context = act(context, { type: 'APPROVE_PLAN', plan: plan(siteId, method, activity) })
  context = act(context, { type: 'EXECUTE_EXPEDITION' })
  return nextSol(context)
}
export function sampled(siteId = 'icebound.lumen-shelf', method = 'rover-only', activity = 'subsurface-drilling', scenarioId = 'icebound.training-v1') {
  return act(executed(siteId, method, activity, scenarioId), { type: 'COLLECT_SAMPLE', method: activity })
}
export function deepFreeze(object) {
  for (const value of Object.values(object)) if (value && typeof value === 'object') deepFreeze(value)
  return Object.freeze(object)
}
