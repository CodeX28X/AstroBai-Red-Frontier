import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialGameState, gameReducer } from './gameReducer.ts'
import { gameReducerWithFeedback } from './gameReducerWithFeedback.ts'
import { PLAYER_MISSION_OPTIONS } from '../../features/missions/data/playerMission.ts'
import { DAILY_SUPPLIES, nextDayForecast, reviewOutpostOperation, supplyLevel } from '../../features/simulation/outpostSimulation.ts'
import { decodePlayerSave, loadPlayerSave, writePlayerSave, PLAYER_SAVE_KEY, LEGACY_PLAYER_SAVE_KEY, SAVE_RULES, SAVE_VERSION } from './playerSave.ts'

function landed(siteId = 'landing-safe-zone') {
  let state = createInitialGameState(PLAYER_MISSION_OPTIONS)
  for (const action of [{ type: 'START_GAME' }, { type: 'REVIEW_MANIFEST' }, { type: 'CONFIRM_MANIFEST' },
    { type: 'BEGIN_LAUNCH' }, { type: 'COMPLETE_LAUNCH' }, { type: 'SELECT_LANDING_SITE', siteId }]) state = gameReducer(state, action)
  assert.equal(state.phase, 'outpost')
  return state
}
const advance = state => gameReducer(state, { type: 'ADVANCE_SOL' })
const job = (state, operation, expectedSol = state.sol) => gameReducerWithFeedback(state, { type: 'OUTPOST_OPERATION', operation, expectedSol })
function dayThree() { return advance(advance(advance(landed()))) }
function gameplay(state) {
  const { feedback: _feedback, ...rest } = state
  return rest
}
function freeze(value) {
  if (value && typeof value === 'object') { for (const nested of Object.values(value)) freeze(nested); Object.freeze(value) }
  return value
}

test('normal mission commissions working base facilities; legacy initializer keeps old fixtures unchanged', () => {
  const state = landed()
  assert.deepEqual(state.facilities, { habitat: 'operational', 'solar-array': 'operational', greenhouse: 'operational', 'water-extractor': 'operational' })
  assert.equal(state.iceboundReadiness.laboratoryOperational, true)
  assert.equal(state.survival.lastUpkeepSol, 0)
  assert.equal(createInitialGameState().survival, undefined)
})
test('daily upkeep is forecast without mutation and committed once per accepted day', () => {
  const state = freeze(landed())
  const before = structuredClone(state)
  const forecast = nextDayForecast(state)
  assert.deepEqual(state, before)
  const next = advance(state)
  assert.deepEqual(next.resources, forecast.resources)
  for (const key of Object.keys(DAILY_SUPPLIES)) assert.equal(next.resources[key], state.resources[key] - DAILY_SUPPLIES[key])
  assert.equal(next.survival.lastUpkeepSol, 1)
  assert.equal(next.actionsRemaining, 2)
  const invalid = { ...next, survival: { ...next.survival, lastUpkeepSol: 0 } }
  const rejected = advance(invalid)
  assert.equal(rejected.feedback.kind, 'error')
  assert.deepEqual(rejected.resources, invalid.resources)
  assert.equal(rejected.sol, 1)
  const replayedClick = gameReducer(next, { type: 'ADVANCE_SOL', expectedSol: state.sol })
  assert.equal(replayedClick.feedback.kind, 'error')
  assert.deepEqual(gameplay(replayedClick), gameplay(next))
})
test('solar charging caps actual gain at capacity, spends one job and rejects replay', () => {
  const state = freeze(dayThree())
  const before = structuredClone(state)
  const next = job(state, 'recharge')
  assert.equal(next.resources.power, 95)
  assert.equal(next.actionsRemaining, 1)
  assert.deepEqual(state, before)
  assert.deepEqual(next.survival.care[0].resourceDeltas, { power: 30 })
  assert.equal(next.appliedResolutionIds.length, state.appliedResolutionIds.length + 1)
  assert.equal(next.spentActionIds.length, state.spentActionIds.length + 1)
  const replay = job(next, 'recharge')
  assert.deepEqual(gameplay(replay), gameplay(next))
  assert.match(replay.feedback.message, /done for today/)
  const capped = job(landed(), 'recharge')
  assert.equal(capped.resources.power, 100)
  assert.equal(capped.survival.care[0].resourceDeltas.power, 5)
})
test('harvesting food pays energy once and shares the two-job limit with other care', () => {
  const state = dayThree()
  const next = job(state, 'harvest')
  assert.equal(next.resources.food, 95)
  assert.equal(next.resources.power, 61)
  assert.equal(next.actionsRemaining, 1)
  const second = job(next, 'recharge')
  assert.equal(second.actionsRemaining, 0)
  const third = job(second, 'recycle')
  assert.deepEqual(gameplay(third), gameplay(second))
  assert.match(third.feedback.message, /big jobs/)
  const recon = gameReducer(second, { type: 'ICEBOUND_COMMAND', intent: { type: 'RECON' } })
  assert.equal(recon.feedback.kind, 'error')
  assert.equal(recon.icebound.observations.length, 0)
})
test('recycling refills real air and water, clips surplus and pays the energy cost', () => {
  const state = dayThree()
  const next = job(state, 'recycle')
  assert.deepEqual(next.resources, { power: 62, oxygen: 100, water: 100, food: 65 })
  assert.deepEqual(next.survival.care[0].resourceDeltas, { oxygen: 24, water: 24, power: -3 })
  assert.equal(next.actionsRemaining, 1)
})
test('full stores do not charge energy or jobs', () => {
  for (const [state, operation] of [[landed(), 'recycle'], [landed('landing-research-zone'), 'harvest']]) {
    const after = job(state, operation)
    assert.equal(after.feedback.kind, 'error')
    assert.match(after.feedback.message, /already full/)
    assert.deepEqual(gameplay(after), gameplay(state))
  }
})
test('a job may run again tomorrow but stale-day clicks cannot perform it', () => {
  const done = job(dayThree(), 'harvest')
  const tomorrow = advance(done)
  const stale = job(tomorrow, 'harvest', done.sol)
  assert.deepEqual(gameplay(stale), gameplay(tomorrow))
  assert.match(stale.feedback.message, /new day/)
  const accepted = job(tomorrow, 'harvest')
  assert.equal(accepted.survival.care.length, 2)
  assert.notEqual(accepted.survival.care[0].id, accepted.survival.care[1].id)
})
test('readiness and unknown job rejection do not apply partial effects', () => {
  const state = dayThree()
  const offline = { ...state, facilities: { ...state.facilities, greenhouse: 'offline' } }
  const after = job(offline, 'harvest')
  assert.deepEqual(gameplay(after), gameplay(offline))
  assert.equal(after.feedback.kind, 'error')
  const unknown = job(state, 'not-a-real-job')
  assert.deepEqual(gameplay(unknown), gameplay(state))
  assert.equal(unknown.feedback.kind, 'error')
  for (const operation of ['toString', '__proto__']) assert.deepEqual(gameplay(job(state, operation)), gameplay(state))
  const missingDay = gameReducer(state, { type: 'OUTPOST_OPERATION', operation: 'recharge' })
  assert.equal(missingDay.feedback.kind, 'error')
  assert.deepEqual(gameplay(missingDay), gameplay(state))
})
test('neglecting supplies produces a genuine terminal failure with no negative balances', () => {
  let state = landed()
  while (state.outcome === null && state.sol < 10) state = advance(state)
  assert.equal(state.outcome, 'failure')
  assert.equal(state.sol, 10)
  assert.deepEqual(state.survival.endedBecause, ['power', 'food'])
  assert.ok(Object.values(state.resources).every(value => value >= 0))
  assert.equal(state.iceboundReadiness.crewSafeForEva, false)
  const prior = structuredClone(state)
  assert.deepEqual(gameplay(job(state, 'recharge')), gameplay(prior))
  assert.throws(() => advance(state), /game is terminal/)
  const debrief = gameReducer(state, { type: 'ENTER_DEBRIEF' })
  assert.equal(debrief.phase, 'debrief')
  assert.equal(debrief.outcome, 'failure')
})
test('supply warnings predict the actual next-day shortage', () => {
  let state = landed()
  for (let i = 0; i < 9; i++) state = advance(state)
  assert.equal(supplyLevel(state, 'power'), 'urgent')
  assert.equal(supplyLevel(state, 'food'), 'urgent')
  assert.equal(supplyLevel(state, 'oxygen'), 'ready')
  assert.deepEqual(nextDayForecast(state).shortages, ['power', 'food'])
})
test('regular legal care reaches successful debrief and reset clears all care history', () => {
  let state = landed()
  while (state.sol < 10) {
    if (state.resources.power <= 20) state = job(state, 'recharge')
    if (state.resources.food <= 20) state = job(state, 'harvest')
    assert.notEqual(state.feedback?.kind, 'error')
    state = advance(state)
  }
  assert.equal(state.outcome, null)
  state = gameReducer(state, { type: 'ENTER_DEBRIEF' })
  assert.equal(state.outcome, 'success')
  assert.ok(state.survival.care.length > 0)
  const reset = gameReducer(state, { type: 'RESET_GAME' })
  assert.equal(reset.phase, 'menu')
  assert.deepEqual(reset.survival.care, [])
  assert.equal(reset.survival.lastUpkeepSol, 0)
  assert.deepEqual(reset.survival.endedBecause, [])
  assert.deepEqual(reset.resources, { power: 100, oxygen: 100, water: 100, food: 100 })
  assert.deepEqual(reset.appliedResolutionIds, [])
})
test('old saves are detected without replaying them under the new survival rules', () => {
  const data = new Map([[LEGACY_PLAYER_SAVE_KEY, JSON.stringify({ version: 1, rules: 'icebound-player-1', actions: [] })]])
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }
  const loaded = loadPlayerSave(storage)
  assert.equal(loaded.blocked, true)
  assert.ok(loaded.notice)
  assert.ok(data.has(LEGACY_PLAYER_SAVE_KEY))
  writePlayerSave(storage, [{ type: 'START_GAME' }])
  assert.equal(data.has(LEGACY_PLAYER_SAVE_KEY), false)
  assert.equal(data.has(PLAYER_SAVE_KEY), true)
  writePlayerSave(storage, [])
  assert.equal(data.has(LEGACY_PLAYER_SAVE_KEY), false)
  assert.equal(data.has(PLAYER_SAVE_KEY), false)
  assert.equal(decodePlayerSave(JSON.stringify({ version: SAVE_VERSION, rules: SAVE_RULES, actions: [] })).blocked, false)
})
test('operation reviews are deterministic and do not mutate a frozen shared state', () => {
  const state = freeze(dayThree())
  const before = structuredClone(state)
  assert.deepEqual(reviewOutpostOperation(state, 'harvest'), reviewOutpostOperation(state, 'harvest'))
  assert.deepEqual(state, before)
})

