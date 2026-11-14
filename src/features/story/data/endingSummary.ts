import type { GameState } from '../../../shared/types/game.ts'
import { RESULT_LABELS } from './adventureDirector.ts'

/** Presentation of recorded outcomes only; never evaluates or awards mission completion. */
export function endingSummary(state:GameState) {
  const reports=state.icebound.investigations.flatMap(site=>site.report?[site.report]:[])
  const lessons:string[]=[]
  if(state.spentActionIds.some(id=>id.startsWith('facility:')&&id.endsWith(':harvest-food')))lessons.push('Growing food helps refill our supplies.')
  if(reports.some(report=>report.conclusion==='inconclusive'))lessons.push('An uncertain result is useful science, too.')
  else if(reports.some(report=>report.conclusion==='no-accessible-ice-detected'))lessons.push('A sample without ice is useful science, too.')
  else if(state.icebound.investigations.some(site=>site.expedition?.plan.method==='rover-only'))lessons.push('Scout can explore while the crew stays at base.')
  if(!lessons.length)lessons.push('Check energy, air, water and food before the next sol.')
  const suppliesAvailable=Object.values(state.resources).every(value=>value>0)
  return {
    heading:state.outcome==='success'?'Mission Complete!':state.outcome==='failure'?"Let's Try Again!":'Mission Summary',
    explanation:state.outcome==='success'?'Great work, Commander! Your Mars mission is complete.':state.outcome==='failure'?"Let's check our supplies and try a new plan together.":'Our mission notes are ready. Let’s see what we learned.',
    crew:state.facilities.habitat==='operational'&&suppliesAvailable?'Habitat supplied':'Base needs attention',
    science:reports.length?`${reports.length} ${reports.length===1?'site':'sites'} reported`:state.icebound.samples.length?'Samples collected':state.icebound.observations.length?'Survey recorded':'Not yet explored',
    findings:[...new Set(reports.map(report=>report.conclusion?RESULT_LABELS[report.conclusion]:'Investigation in progress'))],
    lessons:lessons.slice(0,2),
  }
}
