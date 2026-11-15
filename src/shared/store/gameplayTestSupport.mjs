import { gameReducer } from './gameReducer.ts'
import { productionReadiness } from '../../features/simulation/outpostSystems.ts'

/** Test player policy: use genuine facility jobs in spare slots before resting. */
export function maintainOutpost(initial, send) {
  let state=initial
  const dispatch=send ?? (action=>gameReducer(state,action))
  while(state.phase==='outpost' && !state.outcome && state.actionsRemaining>0 && state.completedSol<10){
    const priorities = [
      ...(state.resources.power<=7 ? ['collect-energy'] : []),
      ...[['oxygen','replenish-oxygen'],['water','recycle-water'],['food','harvest-food']]
        .sort((a,b)=>state.resources[a[0]]-state.resources[b[0]])
        .filter(([resource])=>state.resources[resource]<=5).map(([,operation])=>operation),
    ]
    const operationId=priorities.find(id=>productionReadiness(state,id).allowed)
    if(!operationId)break
    state=dispatch({type:'OPERATE_FACILITY',operationId,expectedSol:state.sol,expectedResourceRevision:state.resourceRevision})
  }
  return state
}
