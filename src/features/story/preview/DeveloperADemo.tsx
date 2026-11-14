import { useState } from 'react'
import { DeveloperAExperience } from '../components/DeveloperAExperience'
import { approvedScenes } from '../data/approvedScenes'
import type { ExperiencePorts, ExperienceView, PowerDraft } from '../types/experience'
import { demoFeedbackByChoice, experienceFixture, presetValidation } from './experienceFixtures'
import './preview.css'

/** Manual scene/response harness. It never runs or pretends to validate gameplay. */
export function DeveloperADemo() {
  const [index,setIndex]=useState(0)
  const [secrets,setSecrets]=useState<readonly string[]>([])
  const [view,setView]=useState<ExperienceView>(() => experienceFixture(0,'menu'))
  const [request,setRequest]=useState('No engine request yet.')
  function load(nextIndex: number,page?: ExperienceView['page']) {setIndex(nextIndex);setView(experienceFixture(nextIndex,page))}
  function record(message: string) {setRequest(`${message} · Preview request only; not applied to C/D state.`)}
  function choose(id: string) {
    record(id)
    const feedbackId=demoFeedbackByChoice[id]
    if (feedbackId) setView(previous => ({...previous,feedback:{id:feedbackId},journal:[...previous.journal,{feedbackId,text:previous.scene.choices.find(choice=>choice.id===id)?.label??id}]}))
  }
  function draft(plan: PowerDraft) {setView(previous=>({...previous,power:{...previous.power,plan,validation:presetValidation(plan,previous.power.budget as 70|100)}}));record('power draft submitted')}
  const ports: ExperiencePorts={
    onInspectLocation:id=>setSecrets(previous=>previous.includes(id)?previous:[...previous,id]),
    onChapterCardDismiss:()=>setView(previous=>({...previous,chapterCard:false})),
    onMainMenu:()=>load(0,'menu'),
    onNewMission:()=>{setSecrets([]);load(0,'prologue')},onContinue:()=>record('continue save requested'),onRestart:scope=>{record(`restart ${scope} requested`);load(0,'menu')},
    onCargo:ids=>{record(`cargo submitted: ${ids.join(', ')}`);load(1,'prologue')},
    onChoice:choose,onAdvanceSol:()=>{record('advance sol requested');load(Math.min(index+1,approvedScenes.length-1))},
    onPowerDraft:draft,onPowerConfirm:plan=>record(`confirm plan submitted: ${JSON.stringify(plan)}`),onLabBoost:mode=>{draft({...view.power.plan,lab:mode==='full'?15:8});record(`lab boost ${mode} submitted through the same power-draft validation path`)},
    onFeedbackDismiss:()=>{if(index<3)load(index+1);else setView(previous=>({...previous,feedback:undefined}))},onPostcardDismiss:()=>setView(previous=>({...previous,postcard:undefined})),
    onMessage:id=>{record(id);setView(previous=>({...previous,selectedMessage:id,feedback:{id:'fb_message_saved'}}))},
  }
  return <><details className="a-demo-review"><summary>Developer A review tools (preview only)</summary><div className="a-demo-toolbar"><strong>Developer A · UI review</strong><label>Scene <select aria-label="Preview scene" value={index} onChange={event=>load(Number(event.target.value))}>{approvedScenes.map((scene,sceneIndex)=><option key={scene.id} value={sceneIndex}>{scene.id} · {scene.title}</option>)}</select></label><label>Screen <select aria-label="Preview screen" value={view.page} onChange={event=>setView(experienceFixture(index,event.target.value as ExperienceView['page']))}>{(['menu','prologue','outpost','home-check','discovery','outcome','debrief','recap'] as const).map(page=><option key={page}>{page}</option>)}</select></label><label>Outcome <select aria-label="Preview outcome" value={view.outcome??'SUCCESS'} onChange={event=>setView(previous=>({...previous,outcome:event.target.value as ExperienceView['outcome'],stars:({SUCCESS:3,PARTIAL_SUCCESS:2,FAILURE:1} as const)[event.target.value as 'SUCCESS'|'PARTIAL_SUCCESS'|'FAILURE']}))}><option>SUCCESS</option><option>PARTIAL_SUCCESS</option><option>FAILURE</option></select></label><label>Science result <select aria-label="Preview science result" value={view.scienceResult??'inconclusive'} onChange={event=>setView(previous=>({...previous,scienceResult:event.target.value as ExperienceView['scienceResult']}))}><option>positive</option><option>inconclusive</option><option>negative</option></select></label><button type="button" onClick={()=>setView(previous=>({...previous,chapterCard:true}))}>Chapter card</button><button type="button" onClick={()=>setView(previous=>({...previous,tutorial:{target:'indicator',instruction:'Tap a light, pick a Quick Plan, then press Advance Sol.'}}))}>Tutorial banner</button><button type="button" onClick={()=>setView(previous=>({...previous,choices:previous.choices.map(choice=>({...choice,available:false,reason:'Not enough battery for this job.'})),advance:{allowed:false,reason:'A mission event needs a choice.',unusedJobs:2}}))}>Preview blocked choices</button><button type="button" onClick={()=>setView(previous=>({...previous,saveNotice:{id:'save_corrupt'}}))}>Corrupt save message</button><button type="button" onClick={()=>setView(previous=>({...previous,saveNotice:{id:'save_old'}}))}>Old save message</button><button type="button" onClick={()=>setView(previous=>({...previous,postcard:{text:`Sol ${previous.sol} done! Let us check what changed.`}}))}>Sol postcard</button></div></details>
    <DeveloperAExperience key={`${index}-${view.page}`} view={{...view,secretsFound:secrets.length}} ports={ports} previewLabel="UI demonstration · fixed snapshots · C/D engine not connected"/>
    <p className="a-demo-notice" role="status">{request}</p>
  </>
}
