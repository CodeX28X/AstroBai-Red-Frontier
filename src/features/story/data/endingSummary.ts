import type { GameState } from '../../../shared/types/game.ts'
import { RESULT_LABELS } from './adventureDirector.ts'
import { RESOURCE_ASSETS } from '../../../shared/assets/gameAssets.ts'
import type { Resources } from '../../../shared/types/game.ts'

/** Presentation of recorded outcomes only; never evaluates or awards mission completion. */
export function endingSummary(state:GameState) {
  const reports=state.icebound.investigations.flatMap(site=>site.report?[site.report]:[])
  const lessons:string[]=[]
  if(state.spentActionIds.some(id=>id.startsWith('facility:')&&id.endsWith(':harvest-food')))lessons.push('Growing food helps refill our supplies.')
  if(reports.some(report=>report.conclusion==='inconclusive'))lessons.push('An uncertain result is useful science, too.')
  else if(reports.some(report=>report.conclusion==='no-accessible-ice-detected'))lessons.push('A sample without ice is useful science, too.')
  else if(state.icebound.investigations.some(site=>site.expedition?.plan.method==='rover-only'))lessons.push('Scout can explore while the crew stays at base.')
  if(!lessons.length)lessons.push('Check energy, air, water and food before the next Mars Day.')
  const suppliesAvailable=Object.values(state.resources).every(value=>value>0)
  const depleted = (['oxygen','power','water','food'] as const).filter(id => state.resources[id] === 0)
  const cause = depleted[0]
  const reported = reports.some(report => report.completionStatus === 'complete' || !!report.conclusion)
  const incomplete = !reported
  const latestReport = state.icebound.report ?? reports.at(-1)
  const reason = state.outcome === 'failure' ? cause ? `We ran out of ${cause === 'oxygen' ? 'air' : cause === 'power' ? 'energy' : cause}.` : 'The outpost mission ended early. No supply shortage is confirmed.' : incomplete ? !state.icebound.samples.length ? 'We didn’t collect a sample.' : !state.icebound.analyses.length ? 'Our sample was not analyzed.' : 'Our science report was not finished.' : latestReport?.conclusion === 'no-accessible-ice-detected' ? 'No ice was found in this sample. We learned something new!' : latestReport?.conclusion === 'inconclusive' ? 'Our sample could not give a clear answer. That is useful science, too.' : 'Our investigation is recorded. See what the evidence tells us.'
  const suggestion = state.outcome === 'failure' && cause ? `Next time, ${cause === 'power' ? 'collect energy at the solar array' : cause === 'food' ? 'harvest food in the greenhouse' : cause === 'oxygen' ? 'make oxygen in the habitat' : 'recycle water in the habitat'} before resting.` : incomplete ? 'Next time, explore the research site earlier and leave time for the lab.' : 'Try another site or sampling method on your next adventure.'
  return {
    heading:state.outcome==='failure'?'Mission Paused!':state.outcome==='success'?'Mission Complete!':'Mission Summary',
    explanation: reason,
    suggestion, cause: cause as keyof Resources | undefined, causeName: cause ? RESOURCE_ASSETS[cause].name : undefined,
    scienceHeading: incomplete ? 'ICEBOUND Not Finished' : 'We learned something new!',
    crew:state.facilities.habitat==='operational'&&suppliesAvailable?'Habitat supplied':'Base needs attention',
    science:reports.length?`${reports.length} ${reports.length===1?'site':'sites'} reported`:state.icebound.samples.length?'Samples collected':state.icebound.observations.length?'Survey recorded':'Not yet explored',
    findings:[...new Set(reports.map(report=>report.conclusion?RESULT_LABELS[report.conclusion]:'Investigation in progress'))],
    lessons:lessons.slice(0,2),
  }
}
