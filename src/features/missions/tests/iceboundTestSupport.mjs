import assert from 'node:assert/strict'
import { gameReducer, createInitialGameState } from '../../../shared/store/gameReducer.ts'
import { createIceboundState, iceboundEngine } from '../engine/icebound/index.ts'
import { createPreparationState, preparationEngine } from '../engine/preparation/preparationEngine.ts'
import { validateMissionTransition } from '../engine/progression/missionProgression.ts'
import { PREDEPLOYED_OUTPOST_BASELINE } from '../data/equipmentCatalog.ts'

export const equipmentIds = ['field-rover', 'repair-toolkit', 'soil-analysis-kit', 'sample-container-set', 'portable-oxygen-kit']

export function fixture(scenarioId = 'icebound.training-v1') {
  let preparation = createPreparationState({
    missionId: 'icebound', baselineId: PREDEPLOYED_OUTPOST_BASELINE.id, optionalCargo: [],
  }, 30)
  const prepare = (intent) => {
    const result = preparationEngine(preparation, intent)
    assert.equal(result.accepted, true, result.issues[0]?.message)
    preparation = result.state
  }
  for (const equipmentId of equipmentIds) prepare({ type: 'SET_EQUIPMENT_QUANTITY', equipmentId, quantity: 1 })
  prepare({ type: 'REVIEW_MANIFEST' })
  prepare({ type: 'CONFIRM_MANIFEST' })

  // Current GameAction does not host Phase 3 preparation/progression yet. Build the
  // test's outpost boundary using the actual mission engines, not unsupported reducer actions.
  const initial = createInitialGameState()
  let opening = { phase: initial.phase, outcome: initial.outcome, objectives: initial.objectives, preparation, completedSol: 0 }
  const resources = { ...initial.resources }
  for (const intent of [
    { type: 'START_GAME' }, { type: 'BEGIN_LAUNCH' }, { type: 'COMPLETE_LAUNCH' },
    { type: 'SELECT_LANDING_SITE', siteId: 'landing-safe-zone' },
  ]) {
    const result = validateMissionTransition(opening, intent)
    assert.equal(result.allowed, true, result.message)
    const objectives = [...opening.objectives]
    for (const effect of result.effects) {
      for (const [resource, delta] of Object.entries(effect.resourceDeltas)) resources[resource] += delta
      for (const change of effect.objectiveChanges) objectives.push({ id: change.objectiveId, completed: change.completed })
    }
    opening = { ...opening, phase: result.nextPhase, objectives }
  }
  assert.equal(opening.phase, 'outpost')
  // Habitat readiness represents the documented commissioned baseline, established before Sol 1.
  let game = { ...initial, phase: opening.phase, resources, objectives: opening.objectives,
    facilities: { ...initial.facilities, habitat: 'operational' } }
  for (let sol = 0; sol < 3; sol++) {
    game = gameReducer(game, { type: 'ADVANCE_SOL' })
    assert.equal(game.outcome, null, 'fixture must genuinely survive to reconnaissance')
    assert.equal(game.phase, 'outpost')
  }
  return {
    game,
    preparation,
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
