import type { GameState } from '../../../shared/types/game.ts'
import type { SoundCue } from './sound.ts'

/** Sound follows committed state changes; it never predicts a successful engine result. */
export function gameSound(before:GameState,after:GameState):SoundCue|undefined {
  if(before===after)return undefined
  if(after.feedback?.kind==='error'&&before.feedback!==after.feedback)return 'warning'
  if(after.preparation.revision!==before.preparation.revision||after.iceboundPlanning.revision!==before.iceboundPlanning.revision)return 'selection'
  if(before.feedback===after.feedback)return undefined
  if(before.phase==='landing'&&after.phase==='outpost')return 'landing'
  if(before.completedSol!==after.completedSol)return after.outcome==='failure'?'warning':'day'
  const id=after.feedback?.feedbackId??''
  if(id==='mission-control-review'||id==='icebound.expedition.reviewed')return 'review'
  if(after.feedback?.code==='FACILITY_PRODUCED')return 'production'
  if(after.iceboundEvents.length>before.iceboundEvents.length){
    if(id.includes('recon'))return 'recon'
    if(id.includes('expedition.executed'))return 'expedition'
    if(id.includes('sample.collected'))return 'sample'
    if(id.includes('analysis.recorded'))return 'analysis'
    if(id.includes('report.recorded'))return 'discovery'
    return 'selection'
  }
  if(id==='manifest-confirmed')return 'selection'
  return undefined
}
