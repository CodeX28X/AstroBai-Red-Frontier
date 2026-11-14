import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..')
const cache = join(root, 'node_modules/.cache')
mkdirSync(cache, { recursive: true })
const scratch = mkdtempSync(join(cache, 'player-mvp-tests-'))
after(() => { assert.ok(resolve(scratch).startsWith(resolve(cache)+sep)); rmSync(scratch, { recursive: true, force: true }) })
const entries = {
 'src/shared/store/gameReducer.ts': ['gameReducer','createInitialGameState'],
 'src/shared/store/playerSave.ts': ['emptyPlayerSave','decodePlayerSave','writePlayerSave','loadPlayerSave','PLAYER_SAVE_KEY','SAVE_VERSION','SAVE_RULES','MAX_SAVED_ACTIONS','isPlayerAction'],
 'src/shared/store/providerSession.ts': ['reduceProviderSession'],
 'src/shared/store/GameContext.ts': ['GameContext'],
 'src/shared/store/GameProvider.tsx': ['GameProvider'],
 'src/features/simulation/outpostSimulation.ts': ['nextDayForecast','DAILY_SUPPLIES','reviewOutpostOperation'],
 'src/features/missions/index.ts': ['LANDING_SITES','validateMissionTransition'],
 'src/features/story/gameplay/PreparationScreen.tsx': ['PreparationScreen'],
 'src/features/story/gameplay/ArrivalScreens.tsx': ['LaunchScreen','LandingScreen'],
 'src/features/story/gameplay/OutpostScreen.tsx': ['OutpostScreen'],
 'src/features/story/gameplay/IceboundMission.tsx': ['IceboundMission'],
 'src/features/story/gameplay/MissionReport.tsx': ['DebriefScreen','MissionReport'],
 'src/features/story/gameplay/BaseCarePanel.tsx': ['BaseCarePanel'],
 'src/features/story/gameplay/LaboratoryPanel.tsx': ['LaboratoryPanel'],
 'src/features/story/gameplay/SupplyStrip.tsx': ['SupplyStrip'],
 'src/features/story/gameplay/friendlyFeedback.ts': ['friendlyFeedback','feedbackTone'],
 'src/features/story/gameplay/ending.ts': ['missionEnding','missionEndingReady'],
 'src/features/story/gameplay/PlayerApp.tsx': ['default as PlayerApp'],
}
writeFileSync(join(scratch,'entry.ts'),Object.entries(entries).map(([path,names]) =>
 'export { '+names.join(', ')+' } from '+JSON.stringify(join(root,path).replaceAll('\\','/'))+';').join('\n'))
await build({ configFile:false,root,logLevel:'silent',build:{outDir:scratch,emptyOutDir:false,minify:false,
 lib:{entry:join(scratch,'entry.ts'),formats:['cjs'],fileName:()=> 'player.cjs'},rolldownOptions:{external:['react','react/jsx-runtime']}}})
const api=createRequire(import.meta.url)(join(scratch,'player.cjs'))
// Media queries affect presentation only; no gameplay state or results are stubbed.
globalThis.document={visibilityState:'visible'}
globalThis.window={matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null}}
function render(Component,state,extra={}) {
 return renderToStaticMarkup(React.createElement(api.GameContext.Provider,
  {value:{state,dispatch(){assert.fail('render dispatched')},save:{available:state.phase!=='menu',notice:null}}},
  React.createElement(Component,{state,send(){assert.fail('render dispatched')},...extra})))
}
function game() {
 let session={...api.emptyPlayerSave(),persist:true}
 const send=action=> {session=api.reduceProviderSession(session,action);return session.state}
 const command=intent=>send({type:'ICEBOUND_COMMAND',intent,expectedMissionRevision:session.state.icebound.revision})
 const start=(landing='landing-safe-zone')=>{
  send({type:'START_GAME'})
  for(const equipmentId of ['field-rover','repair-toolkit','soil-analysis-kit','sample-container-set','portable-oxygen-kit'])send({type:'SET_EQUIPMENT_QUANTITY',equipmentId,quantity:1})
  send({type:'REVIEW_MANIFEST'}); assert.equal(session.state.preparation.latestReview.allowed,true)
  send({type:'CONFIRM_MANIFEST'});send({type:'BEGIN_LAUNCH'})
  assert.equal(session.state.phase,'launch')
  send({type:'COMPLETE_LAUNCH'});assert.equal(session.state.phase,'landing')
  send({type:'SELECT_LANDING_SITE',siteId:landing});assert.equal(session.state.phase,'outpost')
  for(let i=0;i<3;i++)send({type:'ADVANCE_SOL'})
 }
 const science=(siteId='icebound.lumen-shelf',method='rover-only',activity='subsurface-drilling')=>{
  command({type:'RECON'});command({type:'SELECT_SITE',siteId})
  send({type:'SET_ICEBOUND_EXPEDITION_PLAN',plan:{siteId,method,activity,
   equipmentIds:session.state.preparation.manifest.optionalCargo.map(item=>item.equipmentId),
   supplies:{power:30,oxygen:15,water:8,food:8}}})
  send({type:'REVIEW_ICEBOUND_EXPEDITION_PLAN'});assert.equal(session.state.iceboundPlanning.review.allowed,true)
  send({type:'CONFIRM_ICEBOUND_EXPEDITION_PLAN',revision:session.state.iceboundPlanning.revision})
  command({type:'EXECUTE_EXPEDITION'});assert.equal(session.state.actionsRemaining,0)
  send({type:'ADVANCE_SOL'});command({type:'COLLECT_SAMPLE',method:activity})
  command({type:'ANALYZE_SAMPLE',sampleId:session.state.icebound.samples[0].id})
  command({type:'GENERATE_REPORT'})
  assert.equal(session.state.feedback.kind,'success')
 }
 const nextDay=()=>{
  for(const [key,operation] of [['power','recharge'],['food','harvest']]){
    if(session.state.resources[key]<=api.DAILY_SUPPLIES[key]*2 && session.state.actionsRemaining>0)send({type:'OUTPOST_OPERATION',operation,expectedSol:session.state.sol})
  }
  const before=session.state.sol
  send({type:'ADVANCE_SOL'})
  assert.equal(session.state.sol,before+1)
 }
 const finish=()=>{while(session.state.sol<10 && session.state.outcome===null)nextDay();send({type:'ENTER_DEBRIEF'})}
 return {get state(){return session.state},get session(){return session},send,command,start,science,finish,nextDay}
}
function stored(session) {return JSON.stringify({version:api.SAVE_VERSION,rules:api.SAVE_RULES,actions:session.actions})}

for(const [label,site,method,activity,result] of [
 ['supporting evidence','icebound.lumen-shelf','rover-only','subsurface-drilling','supports-accessible-ice'],
 ['negative science','icebound.cinder-flats','rover-only','surface-sampling','no-accessible-ice-detected'],
 ['uncertain science','icebound.echo-ridge','astronaut-team','surface-sampling','inconclusive'],
]) test('normal player scenario: menu to report, save/resume and Sol 10 debrief with '+label,()=>{
 const run=game();run.start();run.science(site,method,activity)
 assert.equal(run.state.icebound.report.conclusion,result)
 assert.equal(run.state.sol,4);assert.equal(run.state.outcome,null);assert.equal(run.state.phase,'outpost')
 assert.equal(run.state.icebound.completedObjectives.length,6)
 assert.equal(run.state.actionsRemaining,0)
 const restored=api.decodePlayerSave(stored(run.session))
 assert.equal(restored.blocked,false);assert.deepEqual(restored.state,run.state)
 const balances=structuredClone(run.state.resources)
 run.command({type:'GENERATE_REPORT'});run.command({type:'EXECUTE_EXPEDITION'})
 assert.deepEqual(run.state.resources,balances)
 run.finish()
 assert.equal(run.state.sol,10);assert.equal(run.state.outcome,'success');assert.equal(run.state.phase,'debrief')
 assert.equal(api.missionEnding(run.state).complete,true)
 for(const key of Object.keys(run.state.resources)){
  const care=run.state.survival.care.reduce((sum,item)=>sum+(item.resourceDeltas[key]??0),0)
  const science=run.state.icebound.costs.reduce((sum,item)=>sum+(item.resources[key]??0),0)
  const landing=api.LANDING_SITES.find(item=>item.id===run.state.selectedLandingSite)
  assert.equal(run.state.resources[key],100+(landing.resourceDeltas[key]??0)+care-science-api.DAILY_SUPPLIES[key]*run.state.survival.lastUpkeepSol)
 }
 const html=render(api.DebriefScreen,run.state,{onAgain(){},onMenu(){}})
 assert.match(html,/Mission complete/);assert.match(html,/Research steps completed: 6 of 6/)
 assert.ok(render(api.MissionReport,run.state).includes(run.state.icebound.analyses[0].conclusion))
 assert.equal(api.decodePlayerSave(stored(run.session)).blocked,false)
})

test('a legitimate incomplete-science mission still ends successfully and cannot reach Sol 11',()=>{
 const run=game();run.start();run.finish()
 assert.equal(run.state.outcome,'success');assert.equal(run.state.icebound.report,null)
 assert.equal(api.missionEnding(run.state).complete,false)
 assert.match(render(api.DebriefScreen,run.state,{onAgain(){},onMenu(){}}),/Investigation unfinished/)
 run.send({type:'ADVANCE_SOL'});assert.equal(run.state.feedback.kind,'error');assert.equal(run.state.sol,10)
})
test('preparation constraints and stale review locks hold through the player provider',()=>{
 const run=game();run.send({type:'START_GAME'})
 run.send({type:'BEGIN_LAUNCH'});assert.equal(run.state.phase,'preparation')
 run.send({type:'SET_EQUIPMENT_QUANTITY',equipmentId:'portable-battery-bank',quantity:1})
 run.send({type:'REVIEW_MANIFEST'});assert.equal(run.state.preparation.latestReview.allowed,false)
 run.send({type:'CONFIRM_MANIFEST'});assert.notEqual(run.state.preparation.status,'confirmed')
 run.send({type:'SET_EQUIPMENT_QUANTITY',equipmentId:'folding-solar-array',quantity:1})
 run.send({type:'CONFIRM_MANIFEST'});assert.notEqual(run.state.preparation.status,'confirmed')
 run.send({type:'REVIEW_MANIFEST'});run.send({type:'CONFIRM_MANIFEST'})
 const before=structuredClone(run.state.preparation.manifest)
 run.send({type:'SET_EQUIPMENT_QUANTITY',equipmentId:'folding-solar-array',quantity:0})
 assert.deepEqual(run.state.preparation.manifest,before)
 assert.match(render(api.PreparationScreen,run.state),/confirmed and locked/)
})
test('overweight manifest does not confirm',()=>{
 const run=game();run.send({type:'START_GAME'})
 for(const [equipmentId,quantity] of [['field-rover',1],['folding-solar-array',2],['portable-battery-bank',2],['repair-toolkit',2],['spare-parts-crate',2]])
  run.send({type:'SET_EQUIPMENT_QUANTITY',equipmentId,quantity})
 run.send({type:'REVIEW_MANIFEST'});assert.equal(run.state.preparation.latestReview.allowed,false)
 run.send({type:'CONFIRM_MANIFEST'});assert.notEqual(run.state.preparation.status,'confirmed')
})
test('landing choices use actual engine costs, commission real cargo and cannot repeat',()=>{
 for(const site of api.LANDING_SITES){
  const run=game();run.start(site.id)
  assert.equal(run.state.resources.power,100+(site.resourceDeltas.power??0)-3*api.DAILY_SUPPLIES.power)
  assert.equal(run.state.facilities.habitat,'operational')
  assert.equal(run.state.iceboundReadiness.laboratoryOperational,true)
  assert.equal(run.state.iceboundReadiness.deployedEquipment.length,5)
  const balances=structuredClone(run.state.resources);run.send({type:'SELECT_LANDING_SITE',siteId:site.id})
  assert.deepEqual(run.state.resources,balances)
 }
})
test('blocked expedition reviews are saved; later edits invalidate them',()=>{
 const run=game();run.start();run.command({type:'RECON'});run.command({type:'SELECT_SITE',siteId:'icebound.lumen-shelf'})
 const draft={siteId:'icebound.lumen-shelf',method:'rover-only',activity:'surface-sampling',equipmentIds:[],supplies:{}}
 run.send({type:'SET_ICEBOUND_EXPEDITION_PLAN',plan:draft})
 run.send({type:'REVIEW_ICEBOUND_EXPEDITION_PLAN'});assert.equal(run.state.feedback.kind,'error')
 assert.deepEqual(api.decodePlayerSave(stored(run.session)).state,run.state)
 run.send({type:'SET_ICEBOUND_EXPEDITION_PLAN',plan:{...draft,equipmentIds:['field-rover']}})
 assert.equal(run.state.iceboundPlanning.reviewedRevision,null)
 run.send({type:'CONFIRM_ICEBOUND_EXPEDITION_PLAN',revision:run.state.iceboundPlanning.revision})
 assert.equal(run.state.icebound.approvedPlan,null)
})
test('rejected actions are omitted but an accepted sol after rejection is saved',()=>{
 const run=game();run.start()
 const count=run.session.actions.length
 run.command({type:'SELECT_SITE',siteId:'invented'})
 assert.equal(run.session.actions.length,count)
 run.send({type:'ADVANCE_SOL'})
 assert.equal(run.state.feedback.kind,'success')
 assert.equal(run.session.actions.length,count+1)
 assert.deepEqual(api.decodePlayerSave(stored(run.session)).state,run.state)
})
test('rendering the real dashboard, mission panel and report preserves central state',()=>{
 const run=game();run.start();run.science()
 const before=structuredClone(run.state)
 for(const Component of [api.OutpostScreen,api.IceboundMission,api.MissionReport,api.OutpostScreen]){
  const html=render(Component,run.state)
  assert.ok(html.length>100)
 }
 assert.deepEqual(run.state,before)
 assert.match(render(api.OutpostScreen,run.state),/Lumen Shelf/)
 assert.match(render(api.IceboundMission,run.state),/Your investigation is recorded/)
})
test('reset clears the prior report, costs, equipment, identifiers and save stream',()=>{
 const run=game();run.start();run.science();run.finish()
 run.send({type:'RESET_GAME'})
 assert.deepEqual(run.state,api.emptyPlayerSave().state);assert.deepEqual(run.session.actions,[])
 run.send({type:'START_GAME'})
 assert.equal(run.state.phase,'preparation');assert.equal(run.state.icebound.report,null)
})
test('versioned persistence rejects corrupt, incompatible, overlong and forged saves',()=>{
 const run=game();run.start()
 for(const raw of ['{', '{}', stored({...run.session,actions:[{type:'SET_OUTCOME',outcome:'success'}]}),
   JSON.stringify({version:1,rules:'icebound-player-1',actions:[{type:'ICEBOUND_COMMAND',intent:{type:'RECON'}}]}),
   JSON.stringify({version:1,rules:'icebound-player-1',actions:Array(api.MAX_SAVED_ACTIONS+1).fill({type:'START_GAME'})})]){
  const loaded=api.decodePlayerSave(raw);assert.equal(loaded.blocked,true);assert.equal(loaded.state.phase,'menu');assert.ok(loaded.notice)
 }
 const old=api.decodePlayerSave(JSON.stringify({version:0,rules:'old',actions:[]}));assert.equal(old.blocked,true)
 assert.equal(api.isPlayerAction({type:'SET_OUTCOME',outcome:'failure'}),false)
})
test('storage writes only actions, reset removes the record, unavailable storage reports a notice',()=>{
 let value=null
 const storage={getItem:key=>key===api.PLAYER_SAVE_KEY?value:null,setItem:(key,data)=>{assert.equal(key,api.PLAYER_SAVE_KEY);value=data},removeItem:key=>{if(key===api.PLAYER_SAVE_KEY)value=null}}
 const run=game();run.start();api.writePlayerSave(storage,run.session.actions)
 assert.ok(!Object.hasOwn(JSON.parse(value),'state'))
 assert.deepEqual(api.loadPlayerSave(storage).state,run.state)
 api.writePlayerSave(storage,[]);assert.equal(value,null)
 assert.match(api.loadPlayerSave({getItem(){throw Error('denied')}}).notice,/Saving is unavailable/)
})
test('player entry has one provider, no debug preset, and no interactive travel phase',()=>{
 const main=readFileSync(join(root,'src/main.tsx'),'utf8')
 assert.equal((main.match(/<GameProvider/g)||[]).length,1)
 assert.match(main,/persistPlayerSession/)
 const player=readFileSync(join(root,'src/features/story/gameplay/PlayerApp.tsx'),'utf8')
 assert.doesNotMatch(player,/dev-playtest|experienceFixture|explorationDemo/)
 assert.match(player,/ENTER_DEBRIEF/)
 assert.match(render(api.LaunchScreen,api.emptyPlayerSave().state),/Skip to landing/)
})
test('a real neglected-supplies ending keeps a completed scientific report',()=>{
 const run=game();run.start();run.science()
 while(run.state.outcome===null && run.state.sol<10)run.send({type:'ADVANCE_SOL'})
 assert.equal(run.state.outcome,'failure')
 assert.ok(run.state.sol<10)
 assert.equal(api.missionEndingReady(run.state),true)
 run.send({type:'ENTER_DEBRIEF'})
 assert.equal(api.missionEnding(run.state).heading,'Outpost mission ended')
 assert.equal(api.missionEnding(run.state).complete,true)
 assert.match(render(api.DebriefScreen,run.state,{onAgain(){},onMenu(){}}),/ran out overnight/)
 assert.deepEqual(api.decodePlayerSave(stored(run.session)).state,run.state)
})

test('automatic ending eligibility comes from progression; early science completion does not end the campaign',()=>{
 const run=game();run.start();run.science()
 assert.equal(api.missionEndingReady(run.state),false)
 while(run.state.sol<10)run.nextDay()
 assert.equal(api.missionEndingReady(run.state),true)
 run.send({type:'ENTER_DEBRIEF'})
 assert.equal(api.missionEndingReady(run.state),false)
})

function elements(node) {
 if (!React.isValidElement(node)) return []
 return [node,...React.Children.toArray(node.props.children).flatMap(elements)]
}
test('player quantity and expedition controls dispatch typed actions and preserve review validation',()=>{
 const run=game();run.send({type:'START_GAME'})
 const sent=[]
 const send=action=>{sent.push(action);run.send(action)}
 const screen=api.PreparationScreen({state:run.state,send})
 const quantity=elements(screen).find(node=>node.type==='input'&&node.props.type==='number')
 quantity.props.onChange({target:{value:'1'}})
 assert.deepEqual(sent[0],{type:'SET_EQUIPMENT_QUANTITY',equipmentId:'portable-oxygen-kit',quantity:1})
 const fresh=game();fresh.start();fresh.command({type:'RECON'});fresh.command({type:'SELECT_SITE',siteId:'icebound.lumen-shelf'})
 const tree=api.IceboundMission({state:fresh.state,send:fresh.send})
 const create=elements(tree).find(node=>node.type==='button'&&node.props.children==='Plan the trip')
 create.props.onClick()
 assert.equal(fresh.state.iceboundPlanning.draft.siteId,'icebound.lumen-shelf')
 assert.equal(fresh.state.icebound.approvedPlan,null)
 const inputs=elements(api.IceboundMission({state:fresh.state,send:fresh.send}))
 const method=inputs.find(node=>node.type==='select'&&node.props.value==='rover-only')
 method.props.onChange({target:{value:'combined'}})
 assert.equal(fresh.state.iceboundPlanning.draft.method,'combined')
 assert.equal(fresh.state.iceboundPlanning.reviewedRevision,null)
})

test('temporarily invalid supply drafts round-trip without losing revision history',()=>{
 const run=game();run.start();run.command({type:'RECON'});run.command({type:'SELECT_SITE',siteId:'icebound.lumen-shelf'})
 const draft={siteId:'icebound.lumen-shelf',method:'rover-only',activity:'surface-sampling',equipmentIds:[],supplies:{power:-1,food:500}}
 run.send({type:'SET_ICEBOUND_EXPEDITION_PLAN',plan:draft})
 run.send({type:'REVIEW_ICEBOUND_EXPEDITION_PLAN'})
 assert.equal(run.state.iceboundPlanning.review.allowed,false)
 assert.equal(run.session.blocked,false)
 assert.deepEqual(api.decodePlayerSave(stored(run.session)).state,run.state)
 run.send({type:'SET_ICEBOUND_EXPEDITION_PLAN',plan:{...draft,supplies:{power:20}}})
 assert.deepEqual(api.decodePlayerSave(stored(run.session)).state,run.state)
})

test('the actual provider restores the saved player state exactly once',()=>{
 const run=game();run.start();run.science()
 const oldStorage=window.localStorage
 window.localStorage={getItem:()=>stored(run.session)}
 let restored
 function Probe(){restored=React.useContext(api.GameContext);return null}
 renderToStaticMarkup(React.createElement(api.GameProvider,{persistPlayerSession:true},React.createElement(Probe)))
 assert.deepEqual(restored.state,run.state)
 assert.equal(restored.save.available,true)
 window.localStorage=oldStorage
})

test('greenhouse room button dispatches a real care job; repeated clicks cannot refill twice',()=>{
 const run=game();run.start()
 const before=structuredClone(run.state)
 const sent=[]
 const panel=api.BaseCarePanel({state:run.state,operation:'harvest',send:action=>{sent.push(action);run.send(action)}})
 const button=elements(panel).find(item=>item.type==='button'&&item.props.children==='Pick food')
 assert.equal(button.props.disabled,false)
 assert.deepEqual(run.state,before)
 button.props.onClick()
 assert.deepEqual(sent[0],{type:'OUTPOST_OPERATION',operation:'harvest',expectedSol:before.sol})
 assert.equal(run.state.resources.food,before.resources.food+30)
 assert.equal(run.state.resources.power,before.resources.power-4)
 assert.equal(run.state.actionsRemaining,1)
 const after=structuredClone(run.state.resources)
 button.props.onClick()
 assert.deepEqual(run.state.resources,after)
 assert.equal(run.state.actionsRemaining,1)
 assert.deepEqual(api.decodePlayerSave(stored(run.session)).state.resources,run.state.resources)
})

test('lab room buttons study a real sample and share its report without duplicate costs',()=>{
 const run=game();run.start();run.command({type:'RECON'});run.command({type:'SELECT_SITE',siteId:'icebound.lumen-shelf'})
 run.send({type:'SET_ICEBOUND_EXPEDITION_PLAN',plan:{siteId:'icebound.lumen-shelf',method:'rover-only',activity:'surface-sampling',
  equipmentIds:run.state.preparation.manifest.optionalCargo.map(item=>item.equipmentId),supplies:{power:20,oxygen:8,water:8,food:8}}})
 run.send({type:'REVIEW_ICEBOUND_EXPEDITION_PLAN'})
 run.send({type:'CONFIRM_ICEBOUND_EXPEDITION_PLAN',revision:run.state.iceboundPlanning.revision})
 run.command({type:'EXECUTE_EXPEDITION'});run.send({type:'ADVANCE_SOL'});run.command({type:'COLLECT_SAMPLE',method:'surface-sampling'})
 const before=structuredClone(run.state)
 render(api.LaboratoryPanel,run.state)
 assert.deepEqual(run.state,before)
 const lab=api.LaboratoryPanel({state:run.state,send:run.send})
 const study=elements(lab).find(item=>item.type==='button'&&item.props.children==='Study this sample')
 assert.equal(study.props.disabled,false)
 study.props.onClick()
 assert.equal(run.state.resources.power,before.resources.power-2)
 assert.equal(run.state.actionsRemaining,0)
 assert.equal(run.state.icebound.analyses[0].classification,'no-accessible-ice-detected')
 const studied=structuredClone(run.state.resources)
 study.props.onClick()
 assert.deepEqual(run.state.resources,studied)
 const refreshed=api.LaboratoryPanel({state:run.state,send:run.send})
 const share=elements(refreshed).find(item=>item.type==='button'&&item.props.children==='Share my science report')
 assert.equal(share.props.disabled,false)
 share.props.onClick()
 assert.equal(run.state.icebound.report.completionStatus,'complete')
 assert.deepEqual(run.state.resources,studied)
 assert.equal(run.state.actionsRemaining,0)
 assert.deepEqual(api.decodePlayerSave(stored(run.session)).state,run.state)
})

test('compact supply buttons open the correct rooms without changing gameplay',()=>{
 const run=game();run.start()
 const before=structuredClone(run.state)
 const opened=[]
 const strip=api.SupplyStrip({state:run.state,onOpenRoom:id=>opened.push(id)})
 for(const button of elements(strip).filter(item=>item.type==='button'))button.props.onClick()
 assert.deepEqual(opened,['solar-array','habitat','habitat','greenhouse'])
 assert.deepEqual(run.state,before)
 assert.match(renderToStaticMarkup(strip),/Energy/)
 assert.match(renderToStaticMarkup(strip),/mvp-supply-meter/)
})

test('a blocked packing check is shown as help needed, not a green success',()=>{
 const run=game();run.send({type:'START_GAME'})
 run.send({type:'SET_EQUIPMENT_QUANTITY',equipmentId:'portable-battery-bank',quantity:1})
 run.send({type:'REVIEW_MANIFEST'})
 assert.equal(api.feedbackTone(run.state),'error')
 assert.match(api.friendlyFeedback(run.state.feedback,run.state),/fix your packing/)
})

test('charging before harvest resolves an actual low-energy situation without free refills',()=>{
 const run=game();run.start();run.science()
 while(run.state.sol<8)run.send({type:'ADVANCE_SOL'})
 assert.equal(run.state.resources.power,1)
 const before=structuredClone(run.state.resources)
 run.send({type:'OUTPOST_OPERATION',operation:'harvest',expectedSol:run.state.sol})
 assert.equal(run.state.feedback.kind,'error')
 assert.deepEqual(run.state.resources,before)
 run.send({type:'OUTPOST_OPERATION',operation:'recharge',expectedSol:run.state.sol})
 run.send({type:'OUTPOST_OPERATION',operation:'harvest',expectedSol:run.state.sol})
 assert.equal(run.state.actionsRemaining,0)
 assert.equal(run.state.resources.power,27)
 assert.equal(run.state.resources.food,45)
 run.nextDay()
 assert.equal(run.state.outcome,null)
 assert.deepEqual(api.decodePlayerSave(stored(run.session)).state,run.state)
})

