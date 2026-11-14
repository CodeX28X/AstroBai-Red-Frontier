import test from 'node:test'
import { maintainOutpost } from './gameplayTestSupport.mjs'
import assert from 'node:assert/strict'
import { createInitialGameState, gameReducer } from './gameReducer.ts'
import { CAMPAIGN_OPTIONS } from './campaign.ts'
import { SUPPLY_BALANCE, SUPPLY_ITEMS, SCIENCE_KIT_IDS, supplyReserves, supplySpace } from '../../features/missions/data/supplyBalance.ts'
import { decodeSave, encodeSave } from './saveGame.ts'
import { adventureDirector } from '../../features/story/data/adventureDirector.ts'
import { guideDialogue, mayAdvanceDialogue } from '../../features/story/data/guideDialogue.ts'
import { CHARACTERS } from '../../features/story/data/characters.ts'
import { readFileSync, existsSync } from 'node:fs'

function prepared(selection=SUPPLY_BALANCE.suggested, kit=true) {
  let state=gameReducer(createInitialGameState(CAMPAIGN_OPTIONS),{type:'START_GAME'})
  const actions=[{type:'START_GAME'}]
  const send=a=>{if(a.type==='ADVANCE_SOL')state=maintainOutpost(state,send);state=gameReducer(state,a);assert.notEqual(state.feedback?.kind,'error',state.feedback?.message);actions.push(a);return state}
  for(const [supplyId,quantity] of Object.entries(selection))send({type:'SET_SUPPLY_QUANTITY',supplyId,quantity})
  if(kit)send({type:'SET_SCIENCE_KIT',packed:true})
  send({type:'REVIEW_MANIFEST'});assert.equal(state.preparation.latestReview.allowed,true)
  send({type:'CONFIRM_MANIFEST'})
  return {get state(){return state},send,actions}
}
function land(run) {for(const type of ['BEGIN_LAUNCH','COMPLETE_LAUNCH'])run.send({type});run.send({type:'SELECT_LANDING_SITE',siteId:'landing-research-zone'})}
test('supply selections and active reserves start at zero before defaults',()=>{
  const state=createInitialGameState(CAMPAIGN_OPTIONS)
  assert.deepEqual(state.preparation.supplies,{power:0,oxygen:0,water:0,food:0})
  assert.deepEqual(state.resources,SUPPLY_BALANCE.baseline)
  assert.equal(state.preparation.cargoCapacityUnits,35)
  assert.deepEqual(state.preparation.manifest.optionalCargo,[])
})
test('integer range, exact steps and immediate combined cargo limits are authoritative',()=>{
  let state=gameReducer(createInitialGameState(CAMPAIGN_OPTIONS),{type:'START_GAME'})
  for(let quantity=1;quantity<=10;quantity++){state=gameReducer(state,{type:'SET_SUPPLY_QUANTITY',supplyId:'power',quantity});assert.equal(state.preparation.supplies.power,quantity)}
  for(const quantity of [-1,11,1.5,NaN]){const next=gameReducer(state,{type:'SET_SUPPLY_QUANTITY',supplyId:'power',quantity});assert.equal(next.feedback.kind,'error');assert.deepEqual(next.preparation,state.preparation)}
  for(const supplyId of ['oxygen','water','food'])state=gameReducer(state,{type:'SET_SUPPLY_QUANTITY',supplyId,quantity:0})
  state=gameReducer(state,{type:'SET_SCIENCE_KIT',packed:true})
  assert.equal(state.preparation.manifest.optionalCargo.length,5)
  assert.equal(supplySpace(state.preparation.supplies),10)
  state=gameReducer(state,{type:'SET_SUPPLY_QUANTITY',supplyId:'oxygen',quantity:10})
  const overflow=gameReducer(state,{type:'SET_SUPPLY_QUANTITY',supplyId:'food',quantity:2})
  assert.equal(overflow.feedback.kind,'error');assert.deepEqual(overflow.preparation,state.preparation)
  assert.deepEqual(state.resources,SUPPLY_BALANCE.baseline)
})
test('review highlights missing supplies, confirmation initializes exactly once and locks both selections',()=>{
  let empty=gameReducer(createInitialGameState(CAMPAIGN_OPTIONS),{type:'START_GAME'})
  empty=gameReducer(empty,{type:'SET_SUPPLY_QUANTITY',supplyId:'power',quantity:0})
  empty=gameReducer(empty,{type:'REVIEW_MANIFEST'})
  assert.equal(empty.preparation.latestReview.allowed,false)
  assert.equal(empty.preparation.latestReview.blockers[0].code,'supply-power-low')
  const run=prepared()
  assert.deepEqual(run.state.resources,{power:5,oxygen:5,water:5,food:5})
  for(const action of [{type:'SET_SUPPLY_QUANTITY',supplyId:'food',quantity:3},{type:'SET_SCIENCE_KIT',packed:false},{type:'CONFIRM_MANIFEST'}]){const rejected=gameReducer(run.state,action);assert.equal(rejected.feedback.kind,'error');assert.deepEqual(rejected.resources,run.state.resources);assert.deepEqual(rejected.preparation,run.state.preparation)}
  assert.ok(SCIENCE_KIT_IDS.every(id=>run.state.preparation.manifest.optionalCargo.some(e=>e.equipmentId===id)))
})
for(const selection of [{power:6,oxygen:4,water:4,food:4},{power:6,oxygen:5,water:5,food:5},{power:7,oxygen:3,water:5,food:5}])test(`real 10-sol investigation balances ${JSON.stringify(selection)}`,()=>{
  const run=prepared(selection);land(run)
  while(run.state.sol<3)run.send({type:'ADVANCE_SOL'})
  const cmd=intent=>run.send({type:'ICEBOUND_COMMAND',intent})
  cmd({type:'RECON'});cmd({type:'SELECT_SITE',siteId:'icebound.lumen-shelf'})
  const plan={siteId:'icebound.lumen-shelf',method:'combined',activity:'subsurface-drilling',equipmentIds:[...SCIENCE_KIT_IDS],supplies:{power:2,oxygen:1,water:1,food:1}}
  run.send({type:'SET_ICEBOUND_EXPEDITION_PLAN',plan});run.send({type:'REVIEW_ICEBOUND_EXPEDITION_PLAN'});run.send({type:'CONFIRM_ICEBOUND_EXPEDITION_PLAN',revision:run.state.iceboundPlanning.revision});cmd({type:'EXECUTE_EXPEDITION'});run.send({type:'ADVANCE_SOL'});cmd({type:'COLLECT_SAMPLE',method:'subsurface-drilling'});cmd({type:'ANALYZE_SAMPLE',sampleId:run.state.icebound.samples[0].id});cmd({type:'GENERATE_REPORT'})
  assert.equal(run.state.icebound.report.conclusion,'supports-accessible-ice')
  while(run.state.completedSol<10)run.send({type:'ADVANCE_SOL'})
  assert.ok(Object.values(run.state.resources).every(v=>v>=0));run.send({type:'ENTER_DEBRIEF'});assert.equal(run.state.outcome,'success')
  assert.deepEqual(decodeSave(encodeSave(run.actions)).state,run.state)
})
test('conversion covers every counter value without clipping or accidental mixed scales',()=>{
  for(let quantity=0;quantity<=10;quantity++){const values={power:quantity,oxygen:quantity,water:quantity,food:quantity};const reserves=supplyReserves(values);for(const item of SUPPLY_ITEMS)assert.equal(reserves[item.id],quantity)}
})
test('guidance follows actual inspection, conditions, readiness and completed missions',()=>{
  const run=prepared();land(run)
  assert.equal(adventureDirector(run.state).target,'habitat')
  run.send({type:'INSPECT_LOCATION',locationId:'habitat'});assert.equal(adventureDirector(run.state).target,'solar-array')
  run.send({type:'INSPECT_LOCATION',locationId:'solar-array'});assert.equal(adventureDirector(run.state).panel,'energy')
  run.send({type:'INSPECT_LOCATION',locationId:'energy'});assert.equal(adventureDirector(run.state).endSol,true)
  run.send({type:'ADVANCE_SOL'});assert.equal(adventureDirector(run.state).id,'outpost.sol2.check')
  assert.equal(adventureDirector({...run.state,facilities:{...run.state.facilities,'solar-array':'damaged'}}).id,'outpost.sol2.damaged')
  run.send({type:'ADVANCE_SOL'});assert.equal(adventureDirector(run.state).command.type,'RECON')
  run.send({type:'ADVANCE_SOL'});assert.equal(adventureDirector(run.state).panel,'supplies')
  run.send({type:'INSPECT_LOCATION',locationId:'supplies'});run.send({type:'ADVANCE_SOL'});assert.equal(adventureDirector(run.state).command.type,'RECON')
  run.send({type:'ICEBOUND_COMMAND',intent:{type:'RECON'}});run.send({type:'ICEBOUND_COMMAND',intent:{type:'SELECT_SITE',siteId:'icebound.lumen-shelf'}});assert.equal(adventureDirector(run.state).panel,'plan')
  const low={...run.state,resources:{...run.state.resources,oxygen:1}}
  assert.equal(adventureDirector(low).highlight,'supplies')
  assert.ok(adventureDirector(low).recovery)
})
test('inspection and conversation persistence are free, duplicate-safe and resettable',()=>{
  const run=prepared();land(run);const before=structuredClone(run.state)
  run.send({type:'INSPECT_LOCATION',locationId:'habitat'});run.send({type:'ACKNOWLEDGE_DIALOGUE',dialogueId:'outpost.sol1.habitat'});run.send({type:'ACKNOWLEDGE_DIALOGUE',dialogueId:'outpost.sol1.habitat'})
  assert.equal(run.state.guidance.completedDialogueIds.length,1);assert.deepEqual(run.state.resources,before.resources);assert.equal(run.state.actionsRemaining,before.actionsRemaining)
  assert.deepEqual(decodeSave(encodeSave(run.actions)).state.guidance,run.state.guidance)
  assert.deepEqual(gameReducer(run.state,{type:'RESET_GAME'}).guidance,{inspections:[],completedDialogueIds:[]})
})
test('portrait slots are labeled local vectors and dialogue debounces repeated clicks',()=>{
  for(const [id,c] of Object.entries(CHARACTERS)){assert.ok(existsSync(`public${c.portrait}`));assert.match(readFileSync(`public${c.portrait}`,'utf8'),/portrait placeholder/);assert.ok(c.name);assert.ok(id)}
  assert.notEqual(CHARACTERS.bai.portrait,CHARACTERS.kiki.portrait)
  const g=adventureDirector({...prepared().state,phase:'outpost',sol:1})
  assert.deepEqual(guideDialogue(g).map(b=>b.speakerId),['bai','kiki'])
  assert.equal(mayAdvanceDialogue(100,200),false);assert.equal(mayAdvanceDialogue(100,450),true)
})
test('old resource-scale saves fail explicitly; current histories round-trip',()=>{
  for(const version of [1,2,3])assert.throws(()=>decodeSave(JSON.stringify({version,actions:[{type:'START_GAME'}]})),/unsupported resource scale/)
  const run=prepared();assert.deepEqual(decodeSave(encodeSave(run.actions)).state,run.state)
})
