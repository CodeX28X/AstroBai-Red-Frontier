import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialGameState, gameReducer } from './gameReducer.ts'
import { CAMPAIGN_OPTIONS } from './campaign.ts'
import { encodeSave, decodeSave } from './saveGame.ts'
import { randomizeSupplies, randomSupplyMinimum } from '../../features/missions/engine/preparation/randomizeSupplies.ts'
import { SUPPLY_BALANCE, supplySpace } from '../../features/missions/data/supplyBalance.ts'
import { reviewMissionPlan } from '../../features/missions/engine/preparation/reviewMissionPlan.ts'
import { calculateManifestSummary } from '../../features/missions/engine/preparation/calculateManifestSummary.ts'
import { maintainOutpost } from './gameplayTestSupport.mjs'
import { lowResourceWarnings, actionHelp } from '../../features/story/data/actionFeedback.ts'
import { endingSummary } from '../../features/story/data/endingSummary.ts'
import { missionDestination } from '../../features/story/data/missionNavigation.ts'
import { adventureDirector } from '../../features/story/data/adventureDirector.ts'

const start = () => gameReducer(createInitialGameState(CAMPAIGN_OPTIONS), { type: 'START_GAME' })
function seeded(seed) { return () => { seed = (Math.imul(seed,1664525) + 1013904223) >>> 0; return seed / 2**32 } }
function land(state) { for (const type of ['REVIEW_MANIFEST','CONFIRM_MANIFEST','BEGIN_LAUNCH','COMPLETE_LAUNCH']) state=gameReducer(state,{type}); return gameReducer(state,{type:'SELECT_LANDING_SITE',siteId:'landing-safe-zone'}) }
test('1000 randomized plans honor ranges, packed cargo, minimum safety, review rules and deterministic randomness', () => {
  for (const packed of [false,true]) {
    const prep=gameReducer(start(),{type:'SET_SCIENCE_KIT',packed}).preparation
    const original=structuredClone(prep)
    for(let seed=0;seed<500;seed++) {
      const selection=randomizeSupplies(prep,seeded(seed))
      assert.deepEqual(selection,randomizeSupplies(prep,seeded(seed)))
      for(const [id,value] of Object.entries(selection)) assert.ok(Number.isInteger(value) && value>=randomSupplyMinimum()[id] && value<=SUPPLY_BALANCE.maxQuantity)
      assert.ok(supplySpace(selection)+calculateManifestSummary(prep.manifest,prep.cargoCapacityUnits).totalCargoMassUnits<=SUPPLY_BALANCE.cargoCapacity)
      assert.equal(reviewMissionPlan(prep.manifest,prep.cargoCapacityUnits,selection).allowed,true)
    }
    assert.deepEqual(prep,original)
  }
})
test('randomization invalidates review atomically, leaves resources untouched, is editable and cannot change confirmed cargo', () => {
  let state=gameReducer(start(),{type:'REVIEW_MANIFEST'}), before=state
  const supplies=randomizeSupplies(state.preparation,seeded(42))
  state=gameReducer(state,{type:'SET_RANDOMIZED_SUPPLIES',supplies})
  assert.equal(state.preparation.status,'editing');assert.equal(state.preparation.latestReview,null);assert.equal(state.preparation.reviewedRevision,null)
  assert.equal(state.preparation.revision,before.preparation.revision+1);assert.deepEqual(state.resources,before.resources)
  assert.equal(gameReducer(state,{type:'CONFIRM_MANIFEST'}).feedback.kind,'error')
  state=gameReducer(state,{type:'SET_SUPPLY_QUANTITY',supplyId:'food',quantity:state.preparation.supplies.food-1});assert.equal(state.preparation.supplies.food,supplies.food-1)
  state=gameReducer(gameReducer(state,{type:'REVIEW_MANIFEST'}),{type:'CONFIRM_MANIFEST'})
  const locked=gameReducer(state,{type:'SET_RANDOMIZED_SUPPLIES',supplies});assert.equal(locked.feedback.kind,'error');assert.deepEqual(locked.preparation,state.preparation)
  for(const supplies of [{power:11,oxygen:4,water:4,food:4},{power:0,oxygen:0,water:0,food:0},{power:10,oxygen:10,water:10,food:10}]) assert.equal(gameReducer(start(),{type:'SET_RANDOMIZED_SUPPLIES',supplies}).feedback.kind,'error')
})
test('three Actions survive edits, free inspections, save/replay, production and daily reset without negative values', () => {
  const actions=[{type:'START_GAME'},{type:'SET_RANDOMIZED_SUPPLIES',supplies:randomizeSupplies(start().preparation,seeded(20))},{type:'REVIEW_MANIFEST'},{type:'CONFIRM_MANIFEST'},{type:'BEGIN_LAUNCH'},{type:'COMPLETE_LAUNCH'},{type:'SELECT_LANDING_SITE',siteId:'landing-safe-zone'}]
  let state=createInitialGameState(CAMPAIGN_OPTIONS)
  for(const action of actions)state=gameReducer(state,action)
  const op={type:'OPERATE_FACILITY',operationId:'harvest-food',expectedSol:state.sol,expectedResourceRevision:state.resourceRevision}
  state=gameReducer(state,op);actions.push(op);assert.equal(state.actionsRemaining,2)
  const inspect={type:'INSPECT_LOCATION',locationId:'greenhouse'};state=gameReducer(state,inspect);actions.push(inspect);assert.equal(state.actionsRemaining,2)
  assert.deepEqual(decodeSave(encodeSave(actions)).state,state)
  assert.equal(decodeSave(JSON.stringify({version:4,campaign:'supplies',actions})).state.actionsRemaining,2)
  const next=gameReducer(state,{type:'ADVANCE_SOL',expectedSol:state.sol});assert.equal(next.actionsRemaining,3)
  const used={...state,actionsRemaining:0};const rejected=gameReducer(used,{...op,operationId:'recycle-water'});assert.equal(rejected.feedback.kind,'error');assert.deepEqual(rejected.resources,used.resources);assert.equal(rejected.actionsRemaining,0)
})
test('warnings prioritize the actual lowest reserve, include exact values, recover and explain production blockers', () => {
  const state=land(start()), low={...state,resources:{power:2,oxygen:1,water:2,food:3}}
  const warnings=lowResourceWarnings(low);assert.deepEqual(warnings.map(warning=>warning.id),['oxygen','power','water']);assert.match(warnings[0].message,/1 air/)
  assert.match(warnings[0].recovery,/Make oxygen/)
  assert.equal(lowResourceWarnings({...low,resources:{power:3,oxygen:3,water:3,food:3}}).length,0)
  assert.match(lowResourceWarnings({...low,facilities:{...low.facilities,habitat:'offline'}})[0].recovery,/operational first/)
  assert.match(lowResourceWarnings({...low,actionsRemaining:0})[0].recovery,/No Actions left/)
  assert.match(lowResourceWarnings({...low,resources:{...low.resources,power:0}}).find(warning=>warning.id==='oxygen').recovery,/Collect energy/)
  assert.equal(actionHelp('There are not enough action slots left this Mars Day.').destination,'end-sol')
})
test('mission log resolves missing prerequisites first and never changes gameplay state', () => {
  const state=land(start()), before=structuredClone(state)
  assert.match(missionDestination(state,'icebound.lab-analysis').blockedReason,/Mars Day 3/)
  assert.deepEqual(state,before)
  const ready={...state,sol:3}
  const guide=missionDestination(ready,'icebound.lab-analysis');assert.equal(guide.kind,'rover');assert.ok(guide.point);assert.equal(guide.panel,undefined);assert.equal(ready.icebound.completedObjectives.length,0)
})
test('early-day guidance uses Mars Day labels while persisted inspection identifiers stay compatible',()=>{
  let state=land(start())
  for(const locationId of ['habitat','solar-array','energy'])state=gameReducer(state,{type:'INSPECT_LOCATION',locationId})
  assert.equal(adventureDirector(state).actionLabel,'Next Mars Day');assert.ok(state.guidance.inspections.includes('1:energy'))
  state=gameReducer(state,{type:'ADVANCE_SOL'})
  for(const locationId of ['solar-array','energy'])state=gameReducer(state,{type:'INSPECT_LOCATION',locationId})
  assert.equal(adventureDirector(state).actionLabel,'Next Mars Day');assert.ok(state.guidance.inspections.includes('2:energy'))
})
test('ending explains confirmed depletion and incomplete work, preserving negative and uncertain scientific results', () => {
  const state=land(start())
  for(const resource of ['power','oxygen','water','food']) {const summary=endingSummary({...state,outcome:'failure',resources:{power:4,oxygen:4,water:4,food:4,[resource]:0}});assert.equal(summary.cause,resource);assert.match(summary.explanation,/ran out/);assert.ok(summary.suggestion)}
  const incomplete=endingSummary({...state,outcome:'success',completedSol:10});assert.equal(incomplete.scienceHeading,'ICEBOUND Not Finished');assert.match(incomplete.explanation,/didn’t collect a sample/)
  const other=endingSummary({...state,outcome:'failure'});assert.match(other.explanation,/No supply shortage is confirmed/)
  for(const conclusion of ['no-accessible-ice-detected','inconclusive']) {const summary=endingSummary({...state,outcome:'success',icebound:{...state.icebound,investigations:[{siteId:'icebound.lumen-shelf',report:{conclusion}}]}});assert.equal(summary.heading,'Mission Complete!');assert.equal(summary.scienceHeading,'We learned something new!');assert.doesNotMatch(summary.explanation,/failed|ran out/)}
})
test('random supply plans remain playable for ten Mars Days with real upkeep and ICEBOUND costs', () => {
  for(const packed of [false,true])for(const seed of [0,1,10,40,100]) {
    let state=gameReducer(start(),{type:'SET_SCIENCE_KIT',packed})
    state=land(gameReducer(state,{type:'SET_RANDOMIZED_SUPPLIES',supplies:randomizeSupplies(state.preparation,seeded(seed))}))
    function send(action){state=gameReducer(state,action);assert.notEqual(state.feedback?.kind,'error',state.feedback?.message);return state}
    function rest(){state=maintainOutpost(state,send);send({type:'ADVANCE_SOL',expectedSol:state.sol});assert.equal(state.outcome,null)}
    while(state.sol<3)rest()
    const command=intent=>send({type:'ICEBOUND_COMMAND',intent})
    command({type:'RECON'});command({type:'SELECT_SITE',siteId:'icebound.lumen-shelf'})
    const plan={siteId:'icebound.lumen-shelf',method:'rover-only',activity:'subsurface-drilling',equipmentIds:state.preparation.manifest.optionalCargo.map(item=>item.equipmentId),supplies:{power:2}}
    send({type:'SET_ICEBOUND_EXPEDITION_PLAN',plan});send({type:'REVIEW_ICEBOUND_EXPEDITION_PLAN'});send({type:'CONFIRM_ICEBOUND_EXPEDITION_PLAN',revision:state.iceboundPlanning.revision})
    command({type:'EXECUTE_EXPEDITION'});rest();command({type:'COLLECT_SAMPLE',method:'subsurface-drilling'});command({type:'ANALYZE_SAMPLE',sampleId:state.icebound.samples[0].id});command({type:'GENERATE_REPORT'})
    while(state.completedSol<10)rest()
    send({type:'ENTER_DEBRIEF'});assert.equal(state.outcome,'success');assert.equal(state.icebound.report.conclusion,packed?'supports-accessible-ice':'inconclusive')
  }
})
