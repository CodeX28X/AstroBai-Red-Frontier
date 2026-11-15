import type { IceboundReadiness } from '../../missions/types/icebound.ts'

export function weatherResults(readiness?: Pick<IceboundReadiness,'weather'|'radiation'>) {
  const describe=(value:unknown,space:boolean)=>{
    if(!['clear','caution','blocked'].includes(String(value)))return {status:'Unavailable',observed:'We cannot read this game condition.',meaning:'Missing information does not tell us whether outside conditions are safe.',next:'Use Safety and the expedition readiness checks. You can keep playing.'}
    if(value==='clear')return {status:'No scenario restriction',observed:space?'This game scenario has no radiation advisory.':'This game scenario has no weather restriction on fieldwork.',meaning:space?'This is not a measurement of radiation on Mars.':'Real Mars can have dust storms. This game does not measure wind or temperature.',next:'Still check crew suits, supplies and the route before leaving.'}
    if(value==='caution')return {status:'Scenario caution',observed:space?'A radiation caution is active in the game.':'A weather caution is active on the game route.',meaning:space?'Activity from the Sun can put explorers and spacecraft at risk.':'Dust can make outdoor work and equipment operations harder.',next:'Check Safety and the route review before authorizing an expedition.'}
    return {status:'Scenario restriction',observed:space?'A radiation restriction is active in this scenario.':'The game marks field weather as restricted.',meaning:space?'Crew trips may need approved protection; this is not a current solar observation.':'The mission engine may block fieldwork until its actual safety requirements are met.',next:'Keep the crew protected and review Safety. Read the real expedition blocker before trying again.'}
  }
  return {surface:describe(readiness?.weather,false),space:describe(readiness?.radiation,true),live:'Live Mars observations unavailable: no temperature, wind or surface radiation feed is connected.'}
}
