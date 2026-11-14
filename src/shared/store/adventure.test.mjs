import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialGameState, gameReducer } from './gameReducer.ts'
import { CAMPAIGN_OPTIONS } from './campaign.ts'
import { encodeSave, decodeSave } from './saveGame.ts'
import { adventureDirector, evaReadiness, RESULT_LABELS } from '../../features/story/data/adventureDirector.ts'
import { SCIENCE_FACTS, FICTION_NOTE } from '../../data/nasa/scienceFacts.ts'

function campaign(site='icebound.lumen-shelf',method='rover-only',activity='subsurface-drilling') {
  let state=createInitialGameState(CAMPAIGN_OPTIONS)
  const actions=[]
  const send=action=>{const next=gameReducer(state,action);assert.notEqual(next.feedback?.kind,'error',next.feedback?.message);state=next;actions.push(action);return state}
  send({type:'START_GAME'})
  for(const [supplyId,quantity] of Object.entries({power:5,oxygen:5,water:5,food:5})) send({type:'SET_SUPPLY_QUANTITY',supplyId,quantity})
  for(const equipmentId of ['field-rover','repair-toolkit','soil-analysis-kit','sample-container-set','portable-oxygen-kit']) send({type:'SET_EQUIPMENT_QUANTITY',equipmentId,quantity:1})
  for(const type of ['REVIEW_MANIFEST','CONFIRM_MANIFEST','BEGIN_LAUNCH','COMPLETE_LAUNCH']) send({type})
  send({type:'SELECT_LANDING_SITE',siteId:'landing-safe-zone'})
  assert.equal(adventureDirector(state).speakerName,'BAI')
  send({type:'ADVANCE_SOL'}); assert.equal(adventureDirector(state).speakerName,'Menemo')
  send({type:'ADVANCE_SOL'})
  const command=intent=>send({type:'ICEBOUND_COMMAND',intent})
  command({type:'RECON'});command({type:'SELECT_SITE',siteId:site})
  const plan={siteId:site,method,activity,equipmentIds:state.preparation.manifest.optionalCargo.map(e=>e.equipmentId),supplies:{power:2,oxygen:1,water:1,food:1}}
  send({type:'SET_ICEBOUND_EXPEDITION_PLAN',plan});send({type:'REVIEW_ICEBOUND_EXPEDITION_PLAN'});send({type:'CONFIRM_ICEBOUND_EXPEDITION_PLAN',revision:state.iceboundPlanning.revision})
  command({type:'EXECUTE_EXPEDITION'});send({type:'ADVANCE_SOL'});send({type:'INSPECT_LOCATION',locationId:'supplies'})
  command({type:'COLLECT_SAMPLE',method:activity});command({type:'ANALYZE_SAMPLE',sampleId:state.icebound.samples[0].id})
  // Generating the report is free, even after the two major jobs are spent.
  command({type:'GENERATE_REPORT'});send({type:'INSPECT_LOCATION',locationId:'energy'})
  return {get state(){return state},actions,send}
}
for(const [site,method,activity,expected] of [
  ['icebound.lumen-shelf','combined','subsurface-drilling','supports-accessible-ice'],
  ['icebound.cinder-flats','rover-only','surface-sampling','no-accessible-ice-detected'],
  ['icebound.echo-ridge','astronaut-team','surface-sampling','inconclusive'],
]) test(`real campaign records ${expected}, survives reload and reaches debrief`,()=>{
  const run=campaign(site,method,activity)
  assert.equal(run.state.icebound.report.conclusion,expected)
  assert.equal(adventureDirector(run.state).title,RESULT_LABELS[expected])
  assert.deepEqual(decodeSave(encodeSave(run.actions)).state,run.state)
  const before=structuredClone(run.state)
  const repeat=gameReducer(run.state,{type:'ICEBOUND_COMMAND',intent:{type:'GENERATE_REPORT'}})
  assert.equal(repeat.feedback.kind,'error');assert.deepEqual(repeat.resources,before.resources)
  while(run.state.completedSol<10) run.send({type:'ADVANCE_SOL'})
  run.send({type:'ENTER_DEBRIEF'})
  assert.equal(run.state.phase,'debrief');assert.equal(run.state.outcome,'success')
  assert.equal(run.state.icebound.report.conclusion,expected)
})
test('corrupt, older, unsupported and impossible save histories fail closed',()=>{
  for(const raw of ['{',JSON.stringify({version:0,actions:[]}),JSON.stringify({version:1,actions:[{type:'UPDATE_RESOURCES',deltas:{power:999}}]}),encodeSave([{type:'ICEBOUND_COMMAND',intent:{type:'GENERATE_REPORT'}}])]) assert.throws(()=>decodeSave(raw))
})
test('saving stores actions, never trusts arbitrary serialized resource state',()=>{
  const run=campaign(), data=JSON.parse(encodeSave(run.actions));data.resources={power:999999}
  assert.deepEqual(decodeSave(JSON.stringify(data)).state.resources,run.state.resources)
})
test('EVA uses standard capabilities and still respects hazards',()=>{
  const run=campaign()
  assert.equal(evaReadiness(run.state).allowed,true)
  const noSuit={...run.state,iceboundReadiness:{...run.state.iceboundReadiness,deployedEquipment:run.state.iceboundReadiness.deployedEquipment.filter(e=>e.equipmentId!=='portable-oxygen-kit')}}
  assert.equal(evaReadiness(noSuit).allowed,true)
  assert.equal(evaReadiness({...run.state,iceboundReadiness:{...run.state.iceboundReadiness,radiation:'blocked'}}).allowed,false)
})
test('facts are cached, NASA-backed and explicitly separate from fictional outcomes',()=>{
  assert.equal(new Set(SCIENCE_FACTS.map(f=>f.id)).size,SCIENCE_FACTS.length)
  for(const fact of SCIENCE_FACTS){assert.match(new URL(fact.sourceUrl).hostname,/(^|\.)nasa\.gov$/);assert.equal(fact.mode,'static');assert.equal(fact.describes,'real-science')}
  assert.match(SCIENCE_FACTS[0].description,/38%/);assert.match(SCIENCE_FACTS[0].description,/same inside/)
  assert.match(SCIENCE_FACTS[1].description,/24 hours, 39/);assert.match(FICTION_NOTE,/fictional/)
})
test('a rejected operation does not poison later successful saves or sol progression',()=>{
  const run=campaign()
  const rejected=gameReducer(run.state,{type:'ICEBOUND_COMMAND',intent:{type:'RECON'}})
  assert.equal(rejected.feedback.kind,'error')
  const recovered=gameReducer(rejected,{type:'ADVANCE_SOL'})
  assert.equal(recovered.feedback,null)
  const loaded=decodeSave(encodeSave([...run.actions,{type:'ADVANCE_SOL'}])).state
  assert.deepEqual(loaded,recovered)
})
test('completing the final sol seals gameplay even before the debrief opens',()=>{
  const run=campaign()
  while(run.state.completedSol<10)run.send({type:'ADVANCE_SOL'})
  const before=structuredClone(run.state)
  assert.equal(before.actionsRemaining,0)
  assert.throws(()=>gameReducer(run.state,{type:'SPEND_ACTION_SLOT',actionId:'after-ending',category:'operation'}),/terminal/)
  const rejected=gameReducer(run.state,{type:'ICEBOUND_COMMAND',intent:{type:'RECON'}})
  assert.equal(rejected.feedback.kind,'error')
  assert.deepEqual(rejected.resources,before.resources)
  assert.equal(rejected.icebound.revision,before.icebound.revision)
})
