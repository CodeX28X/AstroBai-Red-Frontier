import test from 'node:test'
import { maintainOutpost } from './gameplayTestSupport.mjs'
import assert from 'node:assert/strict'
import { createInitialGameState, gameReducer } from './gameReducer.ts'
import { resolveResourceEffects } from './resourceEffects.ts'
import { SUPPLY_BALANCE, supplySpace } from '../../features/missions/data/supplyBalance.ts'
import { LANDING_SITES, LANDING_RESOURCE_EFFECTS } from '../../features/missions/data/landingSites.ts'

function run(selection = SUPPLY_BALANCE.suggested) {
  let state = createInitialGameState()
  const send = action => {
    if(action.type==='ADVANCE_SOL')state=maintainOutpost(state,send)
    state = gameReducer(state, action)
    assert.notEqual(state.feedback?.kind, 'error', state.feedback?.message)
    assert.ok(Object.values(state.resources).every(value => value >= 0 && value <= 10))
    return state
  }
  send({type:'START_GAME'})
  for (const [supplyId, quantity] of Object.entries(selection)) send({type:'SET_SUPPLY_QUANTITY',supplyId,quantity})
  for (const type of ['REVIEW_MANIFEST','CONFIRM_MANIFEST','BEGIN_LAUNCH','COMPLETE_LAUNCH']) send({type})
  return {send,get state(){return state}}
}

test('default loadout is separate from active reserves, with no hidden cargo cost', () => {
  const initial = createInitialGameState()
  assert.deepEqual(initial.preparation.supplies,{power:0,oxygen:0,water:0,food:0})
  const prep = gameReducer(initial,{type:'START_GAME'})
  assert.deepEqual(prep.preparation.supplies,{power:5,oxygen:5,water:5,food:5})
  assert.deepEqual(prep.resources,initial.resources)
  assert.equal(prep.preparation.cargoCapacityUnits,35)
  assert.equal(supplySpace(prep.preparation.supplies),20)
  assert.deepEqual(prep.preparation.manifest.optionalCargo,[])
  assert.deepEqual(run({power:8,oxygen:4,water:7,food:6}).state.resources,{power:8,oxygen:4,water:7,food:6})
})

test('each counter supports 0–10; all 35 cargo units are usable and overflow is rejected', () => {
  for (const supplyId of ['power','oxygen','water','food']) {
    let state = gameReducer(createInitialGameState(),{type:'START_GAME'})
    for (let quantity=0;quantity<=10;quantity++) {
      state = gameReducer(state,{type:'SET_SUPPLY_QUANTITY',supplyId,quantity})
      assert.equal(state.preparation.supplies[supplyId],quantity)
    }
  }
  let state = gameReducer(createInitialGameState(),{type:'START_GAME'})
  for (const supplyId of ['power','oxygen','water']) state=gameReducer(state,{type:'SET_SUPPLY_QUANTITY',supplyId,quantity:10})
  assert.equal(supplySpace(state.preparation.supplies),35)
  const rejected=gameReducer(state,{type:'SET_SUPPLY_QUANTITY',supplyId:'food',quantity:6})
  assert.equal(rejected.feedback.kind,'error')
  assert.deepEqual(rejected.preparation,state.preparation)
  state=gameReducer(state,{type:'REVIEW_MANIFEST'})
  assert.equal(state.preparation.latestReview.allowed,true)
  state=gameReducer(state,{type:'CONFIRM_MANIFEST'})
  assert.deepEqual(state.resources,{power:10,oxygen:10,water:10,food:5})
})

for (const site of LANDING_SITES) test(`${site.id}: shared effects apply once, cap rewards and reject unpaid costs`, () => {
  assert.deepEqual(site.resourceDeltas,LANDING_RESOURCE_EFFECTS[site.id])
  assert.ok(Object.values(site.resourceDeltas).every(delta=>Number.isInteger(delta)&&Math.abs(delta)<=3))
  const r=run({power:5,oxygen:10,water:10,food:5})
  const before=r.state
  r.send({type:'SELECT_LANDING_SITE',siteId:site.id})
  for (const key of ['power','oxygen','water','food']) assert.equal(r.state.resources[key],Math.min(10,before.resources[key]+(site.resourceDeltas[key]??0)))
  const duplicate=gameReducer(r.state,{type:'SELECT_LANDING_SITE',siteId:site.id})
  assert.equal(duplicate.feedback.kind,'error')
  assert.deepEqual(duplicate.resources,r.state.resources)
  assert.deepEqual(duplicate.iceboundEvents,r.state.iceboundEvents)
  const unpaid={...before,resources:{...before.resources,power:0}}
  const rejected=gameReducer(unpaid,{type:'SELECT_LANDING_SITE',siteId:site.id})
  assert.equal(rejected.feedback.kind,'error')
  assert.deepEqual(rejected.resources,unpaid.resources)
  assert.equal(rejected.phase,'landing')
  assert.equal(rejected.selectedLandingSite,null)
})

test('rewards cap at ten; underflow, nonfinite changes and invalid starting balances reject atomically', () => {
  const reserves={power:9,oxygen:0,water:5,food:10}
  assert.deepEqual(resolveResourceEffects(reserves,[{power:3,food:2}]),{allowed:true,resources:{...reserves,power:10}})
  for (const effects of [[{power:-10}],[{oxygen:1},{water:-6}],[{food:NaN}],[{power:Infinity}]]) assert.equal(resolveResourceEffects(reserves,effects).allowed,false)
  for (const value of [-1,11,NaN]) assert.equal(resolveResourceEffects({...reserves,water:value},[]).allowed,false)
  assert.deepEqual(reserves,{power:9,oxygen:0,water:5,food:10})
})

for (const [landing,method,power,siteId] of [
  ['landing-safe-zone','rover-only',5,'icebound.lumen-shelf'],
  ['landing-safe-zone','combined',5,'icebound.cinder-flats'],
  ['landing-safe-zone','astronaut-team',5,'icebound.echo-ridge'],
  ['landing-research-zone','astronaut-team',5,'icebound.lumen-shelf'],
  ['landing-research-zone','rover-only',6,'icebound.lumen-shelf'],
]) test(`no optional gear: ${landing}, ${method}, ${power} energy completes real ICEBOUND and ten sols`,()=>{
  const r=run({power,oxygen:5,water:5,food:5})
  const cmd=intent=>r.send({type:'ICEBOUND_COMMAND',intent})
  r.send({type:'SELECT_LANDING_SITE',siteId:landing})
  while(r.state.sol<3)r.send({type:'ADVANCE_SOL'})
  const skipped=gameReducer(r.state,{type:'ICEBOUND_COMMAND',intent:{type:'GENERATE_REPORT'}})
  assert.equal(skipped.feedback.kind,'error')
  cmd({type:'RECON'});cmd({type:'SELECT_SITE',siteId})
  const plan={siteId,method,activity:'subsurface-drilling',equipmentIds:[],supplies:{power:method==='astronaut-team'?1:2,oxygen:1,water:1,food:1}}
  r.send({type:'SET_ICEBOUND_EXPEDITION_PLAN',plan})
  r.send({type:'REVIEW_ICEBOUND_EXPEDITION_PLAN'})
  r.send({type:'CONFIRM_ICEBOUND_EXPEDITION_PLAN',revision:r.state.iceboundPlanning.revision})
  cmd({type:'EXECUTE_EXPEDITION'})
  assert.equal(r.state.actionsRemaining,0)
  const tooSoon=gameReducer(r.state,{type:'ICEBOUND_COMMAND',intent:{type:'COLLECT_SAMPLE',method:'subsurface-drilling'}})
  assert.equal(tooSoon.feedback.kind,'error');assert.deepEqual(tooSoon.resources,r.state.resources)
  r.send({type:'ADVANCE_SOL'});cmd({type:'COLLECT_SAMPLE',method:'subsurface-drilling'})
  const sampleId=r.state.icebound.samples[0].id
  const analysisAction={type:'ICEBOUND_COMMAND',intent:{type:'ANALYZE_SAMPLE',sampleId}}
  assert.deepEqual(gameReducer(r.state,analysisAction),gameReducer(r.state,analysisAction))
  r.send(analysisAction);cmd({type:'GENERATE_REPORT'})
  assert.equal(r.state.icebound.report.completionStatus,'complete')
  // Standard capabilities allow investigation; existing evidence-quality rules remain unchanged.
  assert.equal(r.state.icebound.report.conclusion,'inconclusive')
  assert.deepEqual(r.state.preparation.manifest.optionalCargo,[])
  assert.deepEqual(r.state.iceboundReadiness.deployedEquipment,[])
  assert.equal(r.state.spentActionIds.filter(id=>id.startsWith('icebound:')).length,4)
  assert.equal(r.state.iceboundEvents.length,7)
  assert.ok(r.state.resources.power>=0 && r.state.resources.power<=10)
  const reported=r.state
  const repeat=gameReducer(reported,{type:'ICEBOUND_COMMAND',intent:{type:'GENERATE_REPORT'}})
  assert.equal(repeat.feedback.kind,'error');assert.deepEqual(repeat.resources,reported.resources)
  while(r.state.completedSol<10)r.send({type:'ADVANCE_SOL'})
  r.send({type:'ENTER_DEBRIEF'});assert.equal(r.state.outcome,'success')
})
