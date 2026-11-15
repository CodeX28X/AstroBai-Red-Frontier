import type { GameState } from '../../../shared/types/game'
import { RESOURCE_ASSETS } from '../../../shared/assets/gameAssets'
import { lowResourceWarnings } from '../data/actionFeedback'

export function HudObjective({state,objective,minimized,onMission,onResource}:{state:GameState;objective:string;minimized:boolean;onMission:()=>void;onResource:(panel:'energy'|'supplies')=>void}) {
  const low=lowResourceWarnings(state).map(warning=>warning.id)
  return <div className={`hud-objective-stack${state.sol>=3||state.icebound.observations.length?' has-research-sites':''}`}>
    <section className="adventure-objective" hidden={minimized}><div><span className="overline">Your next goal</span><h1>{objective}</h1></div><button type="button" onClick={onMission}>Mission log <span aria-hidden="true">↗</span></button></section>
    {minimized&&<button type="button" className="hud-objective-access" aria-label={`Current objective: ${objective}`} onClick={onMission}><span>Objective</span><strong>{objective}</strong></button>}
    {low.length>0&&<div role="status" aria-live="polite"><button type="button" className="hud-resource-warning" onClick={()=>onResource(low[0]==='power'?'energy':'supplies')}><span aria-hidden="true">⚠</span> Low {low.map(id=>`${RESOURCE_ASSETS[id].name} ${state.resources[id]}/10`).join(' · ')}<small>Check supplies</small></button></div>}
  </div>
}
