import type { GameState } from '../../../shared/types/game.ts'
import type { IceboundRuntimeIntent } from '../../../shared/types/iceboundIntegration.ts'
import { selectIceboundContext, selectIceboundView } from '../../../shared/store/iceboundSelectors.ts'
import { capabilitiesFor, fieldIssues } from '../../missions/engine/icebound/readiness.ts'
import { iceboundEngine } from '../../missions/engine/icebound/iceboundEngine.ts'
import type { EvidenceClassification } from '../../missions/types/icebound.ts'
import { CHARACTERS } from './characters.ts'
import { SUPPLY_BALANCE } from '../../missions/data/supplyBalance.ts'
export { CHARACTERS } from './characters.ts'

export const RESULT_LABELS: Record<EvidenceClassification, string> = {
  'supports-accessible-ice': 'Ice Evidence Found', 'no-accessible-ice-detected': 'No Ice Found Here',
  inconclusive: 'Not Sure Yet', 'analysis-incomplete': 'Analysis Not Finished',
}
export interface AdventureGuide {
  id: string; speakerId: keyof typeof CHARACTERS; speakerName: string; text: string;
  objectiveId: string; title: string; actionLabel: string; target?: 'habitat' | 'solar-array' | 'research-lab';
  panel?: 'mission' | 'sites' | 'plan' | 'report' | 'science' | 'supplies' | 'energy'; command?: IceboundRuntimeIntent;
  endSol?: boolean; animationCue?: 'scanning' | 'sampling' | 'working'; blockedReason?: string;
  highlight?: 'energy' | 'supplies' | 'safety' | 'scout'; recovery?: string;
}
function guide(data: Omit<AdventureGuide, 'speakerName'>): AdventureGuide { return { ...data, speakerName: CHARACTERS[data.speakerId].name } }
export function evaReadiness(state: GameState) {
  const ctx = selectIceboundContext(state), r = state.iceboundReadiness
  const reason = !capabilitiesFor(ctx).has('eva') ? 'Pack a Portable Oxygen Kit before launch for crew walks.' :
    !r.crewAvailable || !r.crewSafeForEva ? 'The crew needs to stay safely inside.' :
    state.facilities.habitat !== 'operational' ? 'The airlock needs a working habitat.' :
    Object.entries(state.resources).some(([key, value]) => key !== 'power' && value <= 0) ? 'The crew needs air, water and food before an EVA.' :
    fieldIssues(ctx, true)[0]?.explanation
  return { allowed: !reason, reason }
}
export function adventureDirector(state: GameState): AdventureGuide {
  const base = { id: `sol-${state.sol}`, objectiveId: 'outpost.explore' }
  if (state.outcome || state.completedSol === 10) return guide({ ...base, speakerId: 'kiki', title: 'Our mission story', text: state.outcome === 'failure' ? 'The mission pauses here. Let’s learn and try again.' : 'Ten sols of teamwork! Let’s share what we learned.', actionLabel: 'Mission debrief', endSol: true })
  const inspected = (location: string) => state.guidance.inspections.includes(`${state.sol}:${location}`)
  const lowest = (['oxygen','water','food','power'] as const).find(id => state.resources[id] < (state.preparation.supplies ? SUPPLY_BALANCE.statusBands.needsHelpBelow : 20))
  if (lowest && !inspected(lowest === 'power' ? 'energy' : 'supplies')) return guide({ ...base, id: `safety.${state.sol}.${lowest}`, speakerId: 'bai', title: `${lowest === 'power' ? 'Energy' : lowest[0].toUpperCase()+lowest.slice(1)} needs attention`, text: 'Our reserve is low. Let’s check before choosing more work.', actionLabel: lowest === 'power' ? 'Check energy' : 'Check crew supplies', panel: lowest === 'power' ? 'energy' : 'supplies', highlight: lowest === 'power' ? 'energy' : 'supplies', recovery: 'Compare mission costs before acting. You can finish the outpost without more science.' })
  if (state.sol === 1) {
    if (!inspected('habitat')) return guide({ ...base, id: 'outpost.sol1.habitat', speakerId: 'bai', title: 'Welcome to your Mars home', text: 'Welcome to Mars! Let’s check our new home.', actionLabel: 'Explore the habitat', target: 'habitat' })
    if (!inspected('solar-array')) return guide({ ...base, id: 'outpost.sol1.array', speakerId: 'bai', title: 'Our machines need energy', text: 'This home keeps our crew safe. Now tap the solar array!', actionLabel: 'Inspect solar array', target: 'solar-array' })
    if (!inspected('energy')) return guide({ ...base, id: 'outpost.sol1.energy', speakerId: 'bai', title: 'Check our energy reserve', text: 'Our starter grid is ready. Let’s check the energy for science.', actionLabel: 'Check energy', panel: 'energy', highlight: 'energy' })
    return guide({ ...base, id: 'outpost.sol1.ready', speakerId: 'bai', title: 'Ready for our first day', text: 'Our home and energy are checked. Explore or start tomorrow!', actionLabel: 'Next sol', endSol: true })
  }
  if (state.sol === 2) {
    const damaged = state.facilities['solar-array'] === 'damaged' || state.iceboundReadiness.deployedEquipment.some(e => e.equipmentId === 'folding-solar-array' && e.status === 'damaged')
    if (!inspected('solar-array')) return guide({ ...base, id: `outpost.sol2.${damaged ? 'damaged' : 'check'}`, speakerId: 'menemo', title: damaged ? 'Our solar array needs care' : 'Follow the energy', text: damaged ? 'The array needs care. Let’s inspect it and check our reserve.' : 'Our starter grid is working. Let’s look at our equipment.', actionLabel: 'Inspect solar array', target: 'solar-array' })
    if (!inspected('energy')) return guide({ ...base, id: 'outpost.sol2.energy', speakerId: 'bai', title: 'Watch the energy we use', text: 'Every science job uses energy. Check what we have left.', actionLabel: 'Check energy', panel: 'energy', highlight: 'energy' })
    return guide({ ...base, id: 'outpost.sol2.ready', speakerId: 'bai', title: 'Ready to look for clues', text: 'Tomorrow, Scout can help us investigate hidden ice.', actionLabel: 'Next sol', endSol: true })
  }
  if (state.sol === 4 && !inspected('supplies')) return guide({ ...base, id: 'outpost.sol4.supplies', speakerId: 'bai', title: 'Keep our crew supplied', text: state.facilities.habitat === 'operational' && state.missions['life-support'] !== 'active' ? 'Our crew needs air, water and food. Let’s check our reserves.' : 'Our habitat needs attention. Stay inside and check crew supplies.', actionLabel: 'Check crew supplies', panel: 'supplies', highlight: 'supplies' })
  const mission = state.icebound
  if (mission.report) {
    if (state.sol === 6) return guide({ ...base, id: 'sol-6-science', speakerId: 'olef', title: 'Keep an eye on the Sun', text: 'Space weather can affect explorers. Learn how scientists watch the Sun.', actionLabel: 'Explore space weather', panel: 'science' })
    if (state.sol === 10) return guide({ ...base, id: 'sol-10-check', speakerId: 'kiki', title: 'One last outpost check', text: 'Check our supplies. Then finish Sol 10 and share our story.', actionLabel: 'Check supplies', panel: 'supplies', target: 'habitat' })
    return guide({ ...base, id: 'icebound-complete', objectiveId: 'icebound.science-report', speakerId: 'kofi', title: RESULT_LABELS[mission.report.conclusion ?? 'analysis-incomplete'], text: state.sol === 9 ? 'Our findings are ready. Let’s review what we learned.' : 'Our findings are recorded. Explore, then finish our ten sols.', actionLabel: 'Read our findings', panel: 'report' })
  }
  if (state.actionsRemaining === 0 && !mission.analyses.length) return guide({ ...base, speakerId: 'olef', title: 'Time to rest', text: 'Today’s big jobs are done. Let’s start a fresh sol.', actionLabel: state.sol === 10 ? 'Finish Sol 10' : 'Rest until next sol', endSol: true })
  let command: IceboundRuntimeIntent | undefined, title = '', text = '', actionLabel = '', panel: AdventureGuide['panel'], target: AdventureGuide['target'], animationCue: AdventureGuide['animationCue']
  const has = (id: string) => mission.completedObjectives.some(o => o === id)
  let objectiveId = 'icebound.recon'
  if (!has(objectiveId)) { command = { type: 'RECON' }; title = 'Find clues with Scout'; text = 'Scout can look for clues under the red dust.'; actionLabel = 'Send Scout'; animationCue = 'scanning' }
  else if (!mission.selectedSiteId) { objectiveId = 'icebound.site-selection'; title = 'Choose a place to explore'; text = 'Compare Scout’s clues. Which place should we investigate?'; actionLabel = 'Compare research sites'; panel = 'sites' }
  else if (!mission.approvedPlan) { objectiveId = 'icebound.expedition-plan'; title = 'Plan our expedition'; text = 'Choose who goes and what tools they take.'; actionLabel = 'Plan the expedition'; panel = 'plan' }
  else if (!mission.expedition) { objectiveId = 'icebound.expedition-plan'; command = { type: 'EXECUTE_EXPEDITION' }; title = 'Our expedition is ready'; text = 'Mission Control checked our plan. Let’s explore!'; actionLabel = 'Start expedition'; animationCue = 'working' }
  else if (!mission.samples.length) { objectiveId = 'icebound.sample-collection'; command = { type: 'COLLECT_SAMPLE', method: mission.approvedPlan.activity }; title = 'Collect a careful sample'; text = 'We reached the site. Let’s label and seal a sample.'; actionLabel = 'Collect sample'; animationCue = 'sampling' }
  else if (!mission.analyses.length) { target = 'research-lab'; objectiveId = 'icebound.lab-analysis'; command = { type: 'ANALYZE_SAMPLE', sampleId: mission.samples[0].id }; title = 'Look closer in the lab'; text = 'What does our sample tell us? Let’s test it.'; actionLabel = 'Analyze sample'; animationCue = 'working' }
  else { target = 'research-lab'; objectiveId = 'icebound.science-report'; command = { type: 'GENERATE_REPORT' }; title = RESULT_LABELS[mission.analyses[0].classification]; text = 'Every honest result helps. Let’s record our findings.'; actionLabel = 'Record science report' }
  const proposal = command ? iceboundEngine(selectIceboundContext(state), command) : null
  const blockedReason = proposal && !proposal.allowed ? proposal.reason : undefined
  return guide({ id: `${objectiveId}:${mission.revision}`, objectiveId, speakerId: 'kofi', title, text, actionLabel, panel, command, target, animationCue, blockedReason, highlight: objectiveId === 'icebound.recon' ? 'scout' : undefined, recovery: blockedReason ? /action slots/.test(blockedReason) ? 'Start the next sol to get fresh jobs.' : /power|supply|supplies/.test(blockedReason) ? 'Check reserves and compare a lower-cost plan. Science is optional.' : 'Check your packed science tools. Missing cargo needs a new mission.' : undefined })
}
export function statusGroups(state: GameState) {
  const r = state.resources, safety = evaReadiness(state)
  const bands = state.preparation.supplies ? SUPPLY_BALANCE.statusBands : { needsHelpBelow: 20, watchBelow: 40 }
  const label = (value: number) => value < bands.needsHelpBelow ? 'Needs Help' : value < bands.watchBelow ? 'Watch' : 'Good'
  return [
    { id: 'energy', title: 'Energy', symbol: '☀', status: label(r.power), details: `Power reserve: ${r.power} game units. Mission equipment uses this energy.` },
    { id: 'supplies', title: 'Supplies', symbol: '◈', status: label(Math.min(r.oxygen, r.water, r.food)), details: `Oxygen: ${r.oxygen} · Water: ${r.water} · Food: ${r.food}. Game units, not physical measurements.` },
    { id: 'safety', title: 'Safety', symbol: '✚', status: safety.allowed ? 'Good' : 'Watch', details: safety.allowed ? 'Crew and airlock ready. EVA oxygen equipment packed. Check the expedition review before field work.' : safety.reason! },
  ]
}
export const missionView = selectIceboundView

