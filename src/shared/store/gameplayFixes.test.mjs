import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialGameState, gameReducer } from './gameReducer.ts'
import { OUTPOST_BALANCE, productionReadiness } from '../../features/simulation/outpostSystems.ts'
import { selectIceboundContext, selectIceboundView } from './iceboundSelectors.ts'
import { expeditionEquipment } from '../../features/missions/engine/icebound/expeditionEquipment.ts'
import { SCIENCE_KIT_IDS } from '../../features/missions/data/supplyBalance.ts'
import { encodeSave, decodeSave } from './saveGame.ts'

function campaign(kit=false){
  let state=createInitialGameState()
  const actions=[]
  const send=action=>{state=gameReducer(state,action);assert.notEqual(state.feedback?.kind,'error',state.feedback?.message);actions.push(action);assert.ok(Object.values(state.resources).every(value=>value>=0&&value<=10));return state}
  send({type:'START_GAME'});if(kit)send({type:'SET_SCIENCE_KIT',packed:true})
  for(const type of ['REVIEW_MANIFEST','CONFIRM_MANIFEST','BEGIN_LAUNCH','COMPLETE_LAUNCH'])send({type})
  send({type:'SELECT_LANDING_SITE',siteId:'landing-safe-zone'})
  const operate=operationId=>send({type:'OPERATE_FACILITY',operationId,expectedSol:state.sol,expectedResourceRevision:state.resourceRevision})
  const rest=()=>send({type:'ADVANCE_SOL',expectedSol:state.sol})
  const command=intent=>send({type:'ICEBOUND_COMMAND',intent})
  return {get state(){return state},actions,send,operate,rest,command}
}
function rejected(before,action){const after=gameReducer(before,action);assert.equal(after.feedback.kind,'error');const {feedback:_a,...a}=after,{feedback:_b,...b}=before;assert.deepEqual(a,b);return after}

test('equipment options distinguish actual standard capabilities and operational confirmed cargo',()=>{
  const r=campaign()
  const options=expeditionEquipment(selectIceboundContext(r.state))
  assert.equal(options.standard.length,7);assert.deepEqual(options.optional,[])
  assert.deepEqual(r.state.preparation.manifest.optionalCargo,[])
  const packed=campaign(true)
  const tools=expeditionEquipment(selectIceboundContext(packed.state))
  assert.deepEqual(new Set(tools.optional.map(tool=>tool.id)),new Set(SCIENCE_KIT_IDS))
  const broken={...packed.state,iceboundReadiness:{...packed.state.iceboundReadiness,deployedEquipment:packed.state.iceboundReadiness.deployedEquipment.map(tool=>({...tool,status:'damaged'}))}}
  assert.deepEqual(expeditionEquipment(selectIceboundContext(broken)).optional,[])
})

for(const operationId of Object.keys(OUTPOST_BALANCE.operations))test(`${operationId}: one job, exact configurable effects, cap, no repeated result`,()=>{
  const r=campaign(),before=r.state,op=OUTPOST_BALANCE.operations[operationId]
  const action={type:'OPERATE_FACILITY',operationId,expectedSol:before.sol,expectedResourceRevision:before.resourceRevision}
  r.send(action)
  assert.equal(r.state.actionsRemaining,before.actionsRemaining-1)
  assert.equal(r.state.resources[op.resource],Math.min(10,before.resources[op.resource]+op.gain))
  if(op.resource!=='power')assert.equal(r.state.resources.power,before.resources.power-op.powerCost)
  rejected(r.state,action)
  rejected(r.state,{...action,expectedResourceRevision:r.state.resourceRevision})
  const capped={...before,resources:{...before.resources,[op.resource]:9}}
  const produced=gameReducer(capped,action);assert.equal(produced.resources[op.resource],10)
  const full={...before,resources:{...before.resources,[op.resource]:10}}
  rejected(full,action)
  for(const status of ['damaged','offline','unbuilt'])rejected({...before,facilities:{...before.facilities,[op.building]:status}},action)
  rejected({...before,actionsRemaining:0},action)
  if(op.powerCost)rejected({...before,resources:{...before.resources,power:0}},action)
  assert.equal(productionReadiness({...before,phase:'debrief'},operationId).allowed,false)
})

test('daily consumption applies once to all four resources, resets jobs, and rejects stale or terminal advancement',()=>{
  const r=campaign(),before=r.state
  const action={type:'ADVANCE_SOL',expectedSol:before.sol}
  r.send(action)
  for(const key of Object.keys(before.resources))assert.equal(r.state.resources[key],before.resources[key]-OUTPOST_BALANCE.dailyConsumption[key])
  assert.equal(r.state.actionsRemaining,3);assert.deepEqual(r.state.consumedSols,[1]);assert.equal(r.state.sol,2)
  assert.throws(()=>gameReducer(r.state,action),/already advanced/)
  assert.deepEqual(decodeSave(encodeSave(r.actions)).state,r.state)
  const menu=createInitialGameState();assert.throws(()=>gameReducer(menu,{type:'ADVANCE_SOL'}),/outpost/)
  assert.deepEqual(menu.resources,{power:0,oxygen:0,water:0,food:0})
})

test('daily depletion fails naturally; an unaffordable advancement deducts nothing',()=>{
  const r=campaign(),before=r.state
  const empty={...before,resources:{...before.resources,food:0}}
  const failed=gameReducer(empty,{type:'ADVANCE_SOL',expectedSol:empty.sol})
  assert.equal(failed.outcome,'failure');assert.deepEqual(failed.resources,empty.resources);assert.equal(failed.sol,empty.sol)
  const lastUnit={...before,resources:{...before.resources,food:1}}
  const depleted=gameReducer(lastUnit,{type:'ADVANCE_SOL',expectedSol:lastUnit.sol})
  assert.equal(depleted.outcome,'failure');assert.equal(depleted.resources.food,0);assert.equal(depleted.actionsRemaining,0)
  assert.equal(depleted.sol,lastUnit.sol)
  assert.throws(()=>gameReducer(depleted,{type:'ADVANCE_SOL'}),/terminal/)
  assert.equal(gameReducer(depleted,{type:'ENTER_DEBRIEF'}).outcome,'failure')
  const ignored=campaign();while(!ignored.state.outcome)ignored.rest();assert.equal(ignored.state.outcome,'failure')
})

for(const kit of [false,true])test(`default 5-each loadout survives ten sols and completes two distinct sites${kit?' with optional evidence tools':''}`,()=>{
  const r=campaign(kit)
  const plan=siteId=>({siteId,method:'rover-only',activity:'subsurface-drilling',equipmentIds:kit?[...SCIENCE_KIT_IDS]:[],supplies:{power:2}})
  function prepare(siteId){r.command({type:'SELECT_SITE',siteId});r.send({type:'SET_ICEBOUND_EXPEDITION_PLAN',plan:plan(siteId)});r.send({type:'REVIEW_ICEBOUND_EXPEDITION_PLAN'});r.send({type:'CONFIRM_ICEBOUND_EXPEDITION_PLAN',revision:r.state.iceboundPlanning.revision});assert.deepEqual(r.state.icebound.approvedPlan.equipmentIds,kit?[...SCIENCE_KIT_IDS]:[])}
  function sample(){r.command({type:'COLLECT_SAMPLE',method:'subsurface-drilling'})}
  function analyze(){r.command({type:'ANALYZE_SAMPLE',sampleId:r.state.icebound.samples.at(-1).id});r.command({type:'GENERATE_REPORT'})}
  r.operate('collect-energy');r.operate('recycle-water');r.rest()
  r.operate('collect-energy');r.operate('harvest-food');r.rest()
  r.command({type:'RECON'});prepare('icebound.lumen-shelf')
  rejected(r.state,{type:'ICEBOUND_COMMAND',intent:{type:'SELECT_SITE',siteId:'icebound.cinder-flats'}})
  r.command({type:'EXECUTE_EXPEDITION'});r.rest();sample();analyze()
  const first=structuredClone(r.state.icebound.investigations[0]),firstSamples=structuredClone(r.state.icebound.samples)
  assert.equal(first.report.conclusion,kit?'supports-accessible-ice':'inconclusive')
  rejected(r.state,{type:'ICEBOUND_COMMAND',intent:{type:'GENERATE_REPORT'}})
  rejected(r.state,{type:'ICEBOUND_COMMAND',intent:{type:'SELECT_SITE',siteId:'icebound.lumen-shelf'}})
  assert.equal(selectIceboundView(r.state).sites.find(site=>site.site.id==='icebound.cinder-flats').selectable,true)
  r.rest();r.operate('collect-energy');r.operate('replenish-oxygen');r.rest()
  prepare('icebound.cinder-flats')
  assert.equal(r.state.missions.icebound,'completed')
  assert.equal(selectIceboundView(r.state).objectives.find(objective=>objective.id==='icebound.sample-collection').status,'blocked')
  rejected(r.state,{type:'ICEBOUND_COMMAND',intent:{type:'ANALYZE_SAMPLE',sampleId:firstSamples[0].id}})
  r.command({type:'EXECUTE_EXPEDITION'});sample();r.rest()
  r.operate('collect-energy');analyze();r.rest()
  assert.equal(r.state.icebound.investigations[1].report.conclusion,kit?'no-accessible-ice-detected':'inconclusive')
  assert.deepEqual(r.state.icebound.investigations[0],first)
  assert.deepEqual(r.state.icebound.samples.slice(0,1),firstSamples)
  assert.equal(new Set(r.state.icebound.samples.map(item=>item.id)).size,2)
  assert.equal(new Set(r.state.appliedResolutionIds).size,r.state.appliedResolutionIds.length)
  assert.equal(r.state.icebound.observations.length,3);assert.equal(r.state.icebound.analyses.length,2)
  assert.equal(r.state.icebound.costs.length,7)
  r.operate('recycle-water');r.operate('harvest-food');r.rest()
  r.operate('collect-energy');r.operate('replenish-oxygen');r.rest()
  r.rest();assert.equal(r.state.completedSol,10);assert.equal(r.state.outcome,null)
  assert.deepEqual(r.state.consumedSols,[1,2,3,4,5,6,7,8,9,10])
  assert.equal(r.state.spentActionIds.length,18)
  r.send({type:'ENTER_DEBRIEF'});assert.equal(r.state.outcome,'success')
  assert.deepEqual(decodeSave(encodeSave(r.actions)).state,r.state)
})
