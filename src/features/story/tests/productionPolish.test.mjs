import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { preferredEnglishVoice, createAutoNarration, createDialogueSpeech } from '../data/speech.ts'
import { createSoundEffects, SOUND_PATTERNS } from '../data/sound.ts'
import { weatherResults } from '../data/weatherResults.ts'
import { WEATHER_SOURCES, WEATHER_SOURCE_CHECKED } from '../../../data/nasa/weatherContext.ts'
import { RESEARCH_SITE_ART, ADVENTURE_ASSETS } from '../../../shared/assets/gameAssets.ts'
import { publicAssetUrl } from '../../../shared/assets/publicAssetUrl.ts'
import { evidencePlanAdvice, sciencePresentation } from '../data/sciencePresentation.ts'
import { evidenceQualityIssues, plannedSampleQuality, evaluateSampleAnalysis, generateScienceReport } from '../../missions/engine/icebound/science.ts'
import { sampled, executed, selected, act, plan } from '../../missions/tests/iceboundTestSupport.mjs'
import { getActionBlocker } from '../../../shared/store/actionReadiness.ts'
import { gameReducer, createInitialGameState } from '../../../shared/store/gameReducer.ts'
import { endingSummary } from '../data/endingSummary.ts'
import { gameSound } from '../data/gameSound.ts'
import { maintainOutpost } from '../../../shared/store/gameplayTestSupport.mjs'

test('voice priority prefers a known natural English voice, supports arbitrary libraries and has no gender assumption',()=>{
  const ordinary={name:'English default',lang:'en-US'},other={name:'Microsoft Jenny Natural',lang:'en-US'},foreign={name:'Jenny Natural',lang:'fr-FR'}
  assert.equal(preferredEnglishVoice([foreign,ordinary,other]),other)
  assert.equal(preferredEnglishVoice([ordinary]),ordinary)
  assert.equal(preferredEnglishVoice([foreign]),undefined)
  assert.equal(preferredEnglishVoice([]),undefined)
})
test('automatic narration unlocks once, deduplicates rerenders, cancels old captions and cleans pending voices',()=>{
  const lines=[],timers=new Map();let next=0,cancels=0,ready=false
  const speech={play(...args){lines.push(args)},cancel(){cancels++}}
  const audio=createAutoNarration(speech,()=>ready,()=>{}, {set(run){const id=++next;timers.set(id,run);return id},clear(id){timers.delete(id)}})
  const line={id:'caption-1',text:'Existing written caption.',speaker:'bai'},options={enabled:true,unlocked:false,rate:.9,visible:()=>true}
  audio.request(line,options);assert.equal(timers.size,0);assert.equal(lines.length,0)
  audio.request(line,{...options,unlocked:true});assert.equal(timers.size,1)
  ready=true;audio.voicesChanged();assert.equal(timers.size,0);assert.equal(lines.length,1)
  audio.request(line,{...options,unlocked:true});assert.equal(lines.length,1);assert.equal(timers.size,0)
  audio.request({...line,id:'next',text:'Next caption.'},{...options,unlocked:true});audio.cancel('caption-1');assert.equal(timers.size,1)
  audio.cancel('next');assert.equal(timers.size,0);assert.equal(lines.length,1)
  audio.request({...line,id:'muted'},{...options,enabled:false,unlocked:true});assert.equal(timers.size,0)
  audio.retryCurrent();audio.request(line,{...options,unlocked:true});[...timers.values()][0]();assert.equal(lines.length,2)
  audio.reset();assert.ok(cancels>=5)
})
test('hidden captions never speak and asynchronous voice-load retries do not repeat played lines',()=>{
  let played=0,run;const audio=createAutoNarration({play(){played++},cancel(){}},()=>true,()=>{}, {set(fn){run=fn;return 1},clear(){}})
  audio.request({id:'hidden',text:'Hidden panel',speaker:'bai'},{enabled:true,unlocked:true,rate:.9,visible:()=>false});run();assert.equal(played,0)
  audio.voicesChanged();assert.equal(played,0)
})
test('closing a manually replayed caption cancels that speech without clearing another pending caption',()=>{
  let cancellations=0
  const speech=createDialogueSpeech({cancel(){cancellations++},speak(){},getVoices(){return[]}},text=>({text}))
  const timers=new Map();let next=0
  const narration=createAutoNarration(speech,()=>false,()=>{},{set(run){const id=++next;timers.set(id,run);return id},clear(id){timers.delete(id)}})
  speech.play('replay','Manually replayed line.','bai',.9,()=>{})
  const before=cancellations;narration.cancel('replay');assert.equal(cancellations,before+1)
  narration.request({id:'next',text:'Next line.',speaker:'bai'},{enabled:true,unlocked:true,rate:.9,visible:()=>true})
  narration.cancel('replay');assert.equal(timers.size,1);narration.cancel('next');assert.equal(timers.size,0)
})
test('sound effects respect gesture unlock, enable state, duplicate guards, unsupported audio and cleanup',async()=>{
  let starts=0,closes=0,stops=0
  const context={state:'suspended',currentTime:0,destination:{},async resume(){this.state='running'},async close(){this.state='closed';closes++},createOscillator(){return{frequency:{value:0},connect(){},disconnect(){},start(){starts++},stop(){stops++}}},createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(value){assert.ok(value<=.02)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}}
  const sound=createSoundEffects(()=>context);sound.play('sample');assert.equal(starts,0);await sound.unlock();sound.play('sample','one');assert.equal(starts,2);sound.play('sample','one');assert.equal(starts,2)
  sound.enable(false);sound.play('launch','two');assert.equal(starts,2);sound.enable(true);context.currentTime=2;sound.play('launch','two');assert.equal(starts,6);sound.play('close','launch-confirmed');sound.play('tap','next');assert.equal(starts,6,'confirmation cleanup cannot cut off launch');sound.dispose();assert.equal(closes,1);assert.ok(stops>=6)
  const unsupported=createSoundEffects(()=>null);await unsupported.unlock();assert.doesNotThrow(()=>unsupported.play('warning'));unsupported.dispose()
  assert.equal(Object.keys(SOUND_PATTERNS).length,15)
})
test('weather distinguishes simulated conditions and unavailable measurements, retaining NASA attribution',()=>{
  for(const flag of ['clear','caution','blocked']){const result=weatherResults({weather:flag,radiation:flag});assert.ok(result.surface.observed);assert.ok(result.space.meaning);assert.ok(result.space.next);assert.match(result.live,/unavailable/);assert.match(result.live,/no temperature/)}
  assert.equal(weatherResults().surface.status,'Unavailable');assert.equal(weatherResults({weather:'unknown',radiation:'unknown'}).space.status,'Unavailable')
  assert.ok(WEATHER_SOURCES.every(source=>source.url.startsWith('https://science.nasa.gov/')));assert.match(WEATHER_SOURCE_CHECKED,/^\d{4}-\d{2}-\d{2}$/)
})
test('all actual site and sample methods map to distinct supplied files and deployment URLs',()=>{
  assert.deepEqual(Object.keys(RESEARCH_SITE_ART),['icebound.lumen-shelf','icebound.cinder-flats','icebound.echo-ridge'])
  const paths=Object.values(RESEARCH_SITE_ART).map(art=>art.src);assert.equal(new Set(paths).size,3)
  for(const path of [...paths,ADVENTURE_ASSETS.samples['surface-sampling'],ADVENTURE_ASSETS.samples['subsurface-drilling']]){assert.ok(existsSync(`public${path}`));const bytes=readFileSync(`public${path}`);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a')}
  assert.equal(publicAssetUrl('/assets/science/samples/surface-sample.png','/red-frontier/'),'/red-frontier/assets/science/samples/surface-sample.png')
  assert.equal(publicAssetUrl('/assets/a.png','./'),'./assets/a.png');assert.equal(publicAssetUrl('https://example.com/a.png','/game/'),'https://example.com/a.png')
})
test('evidence advice exposes the existing quality boundary without manufacturing ice or selecting cargo',()=>{
  const context=selected(),good=plan(),before=structuredClone(context)
  assert.deepEqual(plannedSampleQuality(context,good),{handling:'sealed',instrument:'field',documented:true});assert.equal(evidencePlanAdvice(context,good).issues.length,0)
  const basic={...good,equipmentIds:[]};assert.equal(evidencePlanAdvice(context,basic).issues.length,2);assert.match(evidencePlanAdvice(context,basic).quality,/inconclusive/)
  assert.match(evidencePlanAdvice(context,{...good,activity:'surface-sampling'}).scope,/cannot rule out buried ice/)
  assert.equal(evidenceQualityIssues({handling:'basic',instrument:'basic',documented:false}).length,3);assert.deepEqual(context,before)
})
for(const [site,method,activity,expected]of [['icebound.lumen-shelf','rover-only','subsurface-drilling','supports-accessible-ice'],['icebound.lumen-shelf','rover-only','surface-sampling','no-accessible-ice-detected'],['icebound.cinder-flats','rover-only','subsurface-drilling','no-accessible-ice-detected'],['icebound.echo-ridge','astronaut-team','subsurface-drilling','inconclusive']])test(`recorded report maps site, method, observation and ${expected} honestly`,()=>{
  let context=sampled(site,method,activity);context=act(context,{type:'ANALYZE_SAMPLE',sampleId:context.mission.samples[0].id});context=act(context,{type:'GENERATE_REPORT'})
  const view=sciencePresentation(context.mission.report);assert.equal(view.classification,expected);assert.equal(view.sample.method,activity);assert.equal(view.site.includes('fictional'),false);assert.ok(view.finding.observed);assert.ok(view.lesson);assert.ok(view.control);assert.ok(view.next)
})
test('quality-limited and incomplete reports explain missing evidence, without silently becoming negative',()=>{
  const context=sampled(),sample={...context.mission.samples[0],quality:{handling:'basic',instrument:'basic',documented:true}}
  assert.equal(evaluateSampleAnalysis(context,sample).classification,'inconclusive')
  const incomplete=sciencePresentation(generateScienceReport(executed()));assert.equal(incomplete.classification,'analysis-incomplete');assert.match(incomplete.next,/Collect a sample/)
  const partial=generateScienceReport({...context,mission:{...context.mission,analyses:[evaluateSampleAnalysis(context,context.mission.samples[0])]}})
  assert.equal(partial.completionStatus,'incomplete');assert.equal(sciencePresentation(partial).classification,'analysis-incomplete','a partial report cannot promote an analysis into a completed investigation')
})
test('confirmation previews share reducer rejection rules and never mutate state or consume resources',()=>{
  const state=gameReducer(createInitialGameState(),{type:'START_GAME'}),before=structuredClone(state)
  assert.match(getActionBlocker(state,{type:'CONFIRM_MANIFEST'}),/Review/);assert.deepEqual(state,before)
  const reviewed=gameReducer(state,{type:'REVIEW_MANIFEST'});assert.equal(getActionBlocker(reviewed,{type:'CONFIRM_MANIFEST'}),undefined)
  const confirmed=gameReducer(reviewed,{type:'CONFIRM_MANIFEST'});assert.ok(getActionBlocker(confirmed,{type:'CONFIRM_MANIFEST'}));assert.deepEqual(confirmed.resources,reviewed.preparation.supplies)
})
test('debrief highlights the actual most recent finding instead of letting an older negative override it',()=>{
  const state=createInitialGameState(),old={conclusion:'no-accessible-ice-detected'},latest={conclusion:'supports-accessible-ice'}
  const summary=endingSummary({...state,outcome:'success',icebound:{...state.icebound,report:latest,investigations:[{report:old},{report:latest}]}})
  assert.doesNotMatch(summary.explanation,/No ice was found/)
})
test('all gameplay sound cues follow actual accepted transactions, and rejected work only warns',()=>{
  let state=createInitialGameState();const cues=[]
  const send=action=>{const before=state;state=gameReducer(state,action);const cue=gameSound(before,state);if(cue)cues.push(cue);return state}
  const rest=()=>{state=maintainOutpost(state,send);send({type:'ADVANCE_SOL',expectedSol:state.sol})}
  send({type:'START_GAME'});send({type:'SET_SUPPLY_QUANTITY',supplyId:'food',quantity:6});for(const type of ['REVIEW_MANIFEST','CONFIRM_MANIFEST','BEGIN_LAUNCH','COMPLETE_LAUNCH'])send({type});send({type:'SELECT_LANDING_SITE',siteId:'landing-safe-zone'});while(state.sol<3)rest()
  const command=intent=>send({type:'ICEBOUND_COMMAND',intent});command({type:'RECON'});command({type:'SELECT_SITE',siteId:'icebound.lumen-shelf'});send({type:'SET_ICEBOUND_EXPEDITION_PLAN',plan:{siteId:'icebound.lumen-shelf',method:'rover-only',activity:'subsurface-drilling',equipmentIds:[],supplies:{power:2}}});send({type:'REVIEW_ICEBOUND_EXPEDITION_PLAN'});send({type:'CONFIRM_ICEBOUND_EXPEDITION_PLAN',revision:state.iceboundPlanning.revision});command({type:'EXECUTE_EXPEDITION'});rest();command({type:'COLLECT_SAMPLE',method:'subsurface-drilling'});command({type:'ANALYZE_SAMPLE',sampleId:state.icebound.samples[0].id});command({type:'GENERATE_REPORT'});const resources=state.resources;command({type:'GENERATE_REPORT'});assert.deepEqual(state.resources,resources)
  for(const cue of ['selection','review','landing','day','production','recon','expedition','sample','analysis','discovery','warning'])assert.ok(cues.includes(cue),cue)
})
