import { approvedScenes } from '../data/approvedScenes'
import type { ExperienceView, PowerDraft, PowerView } from '../types/experience'
// Fixture locations reproduce B's preview; D must approve the actual IDs/names.
const explorationDemo: NonNullable<ExperienceView['map']['sites']> = [
 {id:'demo-ridge',label:'Frost Ridge',status:'available',position:{x:15,y:10}},
 {id:'demo-basin',label:'Quiet Basin',status:'locked',position:{x:85,y:10}},
 {id:'demo-crater',label:'Blue Crater',status:'active',assignment:'rover',position:{x:85,y:91}},
 {id:'demo-rock',label:'Layered Rock',status:'completed',assignment:'combined',position:{x:14,y:91}},
]

// STATIC UI FIXTURES ONLY. No reducer, costs, progression, eligibility or scoring.
export const previewPresets: Readonly<Record<70 | 100, PowerView['presets']>> = {
  100:[{label:'Balanced',note:'Everything gets enough.',plan:{life:30,habitat:20,greenhouse:20,lab:15,comms:5}},{label:'Science Boost',note:'The lab works extra hard.',plan:{life:30,habitat:15,greenhouse:15,lab:20,comms:5}},{label:'Safety First',note:'A stronger shelter.',plan:{life:30,habitat:30,greenhouse:15,lab:8,comms:5}}],
  70:[{label:'Balanced',note:'Everything gets enough.',plan:{life:30,habitat:15,greenhouse:10,lab:10,comms:5}},{label:'Science Boost',note:'The lab works extra hard.',plan:{life:30,habitat:10,greenhouse:5,lab:20,comms:5}},{label:'Safety First',note:'A stronger shelter.',plan:{life:30,habitat:20,greenhouse:7,lab:8,comms:5}}],
}
export const powerChannels: PowerView['channels'] = [{id:'life',label:'Life support',min:0,max:40},{id:'habitat',label:'Habitat and shelter',min:0,max:30},{id:'greenhouse',label:'Greenhouse',min:0,max:25},{id:'lab',label:'Laboratory',min:0,max:20},{id:'comms',label:'Communications',min:0,max:10}]
export function fixturePower(budget: 70 | 100): PowerView {
  return {budget,plan:previewPresets[budget][0].plan,channels:powerChannels,presets:previewPresets[budget],validation:{valid:true,allocated:budget === 100 ? 90 : 70,remaining:budget === 100 ? 10 : 0,warnings:[]},comparison:'Your plan vs. recommended plan. Differences are shown with arrows.'}
}
// Reference totals from GDD0.7, used only when selecting one of its fixed presets.
export function presetValidation(plan: PowerDraft, budget: 70 | 100): PowerView['validation'] {
  const index=previewPresets[budget].findIndex(preset => Object.keys(plan).every(key => plan[key as keyof PowerDraft] === preset.plan[key as keyof PowerDraft]))
  if (index < 0) return {valid:false,allocated:null,remaining:null,warnings:['Custom-plan preview: waiting for Developer C’s validator.']}
  const allocated=budget === 70 ? 70 : [90,85,88][index]
  return {valid:true,allocated,remaining:budget === 70 ? 0 : [10,15,12][index],warnings:[]}
}
export const demoFeedbackByChoice: Readonly<Record<string,string>> = {
  cargo_shield:'fb_cargo_shield',cargo_parts:'fb_cargo_parts',cargo_drill:'fb_cargo_drill',cruise_wait:'fb_cruise_wait',cruise_fix:'fb_cruise_fix',cruise_safe:'fb_cruise_safe',landing_safe:'fb_landing_safe',landing_resource:'fb_landing_resource',act_reinforce_array:'fb_reinforce_array',grid_repair:'fb_grid_repair',grid_conserve:'fb_grid_conserve',act_recon:'fb_recon_done',ls_repair:'fb_ls_repair',ls_reroute:'fb_ls_reroute',ls_conserve:'fb_ls_conserve',act_assign_rover:'fb_assign_rover',act_assign_astronaut:'fb_assign_astronaut',act_assign_combined:'fb_assign_combined',storm_shelter:'fb_storm_shelter_planned',storm_continue:'fb_storm_continue_rover',act_sample:'fb_sample_rover',act_analyze:'fb_result_inconclusive',act_reanalyze:'fb_rerun_still',act_sweep:'fb_sweep',act_repair_array:'fb_grid_repair',act_repair_ls:'fb_ls_repair',
}
export function experienceFixture(index: number, page?: ExperienceView['page']): ExperienceView {
  const scene=approvedScenes[index] ?? approvedScenes[0]
  const sol=index < 3 ? 1 : index-2
  // These represent a damaged UI snapshot, not a calculated event trigger.
  const budget = index === 4 ? 70 : 100
  return {
    page:page ?? (index < 3 ? 'prologue' : 'outpost'),scene,sol,chapter:scene.chapter,
    tutorial:index===3?{target:'indicator',instruction:'Tap a light, pick a Quick Plan, then press Advance Sol.'}:undefined,
    jobs:[{label:'Big job',available:true},{label:'Helper job',available:true}],hasSave:false,
    tokens:{sol,repairCost:15,lsRepairCost:10,method:'Rover',evidence:4,result:'INCONCLUSIVE',oxygen:100,water:100,food:55,battery:60,protection:75,health:100},
    indicators:[
      {id:'power',label:'Power',symbol:'ϟ',level:budget===70?'watch':'good',explanation:budget===70?'Watch out! Energy is getting tight. Check the Power Plan.':'Good! We have enough energy to run the base.',values:[{label:'Battery',value:'60'},{label:'Generation',value:String(budget)},{label:'Array',value:budget===70?'Damaged':'Working'}]},
      {id:'life',label:'Life Support',symbol:'◈',level:'good',explanation:'Good! Air, water and food are healthy.',values:[{label:'Oxygen',value:'100'},{label:'Water',value:'100'},{label:'Food',value:'55'},{label:'Equipment',value:'Working'}]},
      {id:'protection',label:'Protection',symbol:'◇',level:'good',explanation:'Good! The crew is well protected.',values:[{label:'Shelter readiness',value:'100%'},{label:'Shielding',value:'50'},{label:'Protection',value:'75'}]},
    ],
    map:{facilityStatuses:{habitat:'operational','solar-array':budget===70?'damaged':'operational',greenhouse:'operational','research-lab':'operational'},sites:explorationDemo,environment:{dustStorm:index===8,solarStormWarning:index===8,crewSheltering:false}},
    choices:scene.choices.map(choice => ({id:choice.id,available:true,cost:choice.id==='grid_repair'?'Big job · Battery -15':choice.id==='ls_repair'?'Big job · Battery -10':undefined})),
    advance:{allowed:true,unusedJobs:2},power:fixturePower(budget),
    readiness:[{id:'C1',passed:true,reason:'Everyone is healthy and has air, water and food.'},{id:'C2',passed:true,reason:'Oxygen, water and food are at safe levels.'},{id:'C3',passed:true,reason:'The battery has enough energy for launch.'},{id:'C4',passed:true,reason:'The crew is well protected.'},{id:'C5',passed:true,reason:'Solar array and life support are working.'},{id:'C6',passed:true,reason:'The lab produced a result. All results count.'}],
    evidence:[{label:'Recon',points:1},{label:'Method',points:1},{label:'Landing',points:1},{label:'Drill kit',points:0},{label:'Lab power',points:1},{label:'Re-run',points:0}],scienceResult:'inconclusive',outcome:'SUCCESS',stars:3,
    badges:['Power Starter','Ice Detective','Storm Guardian','Discovery Maker','Mars Explorer'],
    journal:[],lessons:[{id:'lesson_power',caption:'Power is shared. More here means less there.',text:'Power is shared. Giving more to one machine means less for another.'},{id:'lesson_science',caption:'A no or a maybe is still real science.',text:'A negative or unclear result is still real science. It tells us what to try next.'},{id:'lesson_trade',caption:'Every choice has a good side and a cost.',text:'Every choice has a trade-off. A good plan thinks about tomorrow as well as today.'}],
    nextIdeas:['Protect the air first.','Plan your recon, expedition and lab days early.'],
    science:{id:'[PLACEHOLDER - copy selected DONKI event identifier]',type:'[PLACEHOLDER - event type]',observedDate:'[PLACEHOLDER - date from record]',title:'[PLACEHOLDER - reviewed title]',reportedAttributes:'[PLACEHOLDER - attributes from record]',sourceName:'NASA CCMC DONKI',sourceUrl:'[PLACEHOLDER - direct source URL]',dataMode:'archived'},
    secretsFound:0,checkpointAvailable:false,
    equipment:[{id:'life-support-equipment',label:'Life-Support Equipment',purpose:'Makes oxygen and cleans water for the crew.',status:'Working: Air steady.'},{id:'communication-equipment',label:'Communication Equipment',purpose:'Talks to Earth. Messages are slow because of distance.',status:'On: We can hear Earth.'}],
  }
}
