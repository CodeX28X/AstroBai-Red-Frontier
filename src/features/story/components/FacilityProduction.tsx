import type { BuildingId, GameAction, GameState, Resources } from '../../../shared/types/game'
import { OUTPOST_BALANCE, operationsFor, productionReadiness } from '../../simulation/outpostSystems'
import { ResourceIcon } from '../../../shared/components/ResourceIcon'
import { ActionButton } from './ActionButton'

export function FacilityProduction({ building, state, dispatch, resource }: { building:BuildingId; state:GameState; dispatch:(action:GameAction)=>void; resource?: keyof Resources }) {
  const success=state.feedback?.code==='FACILITY_PRODUCED' && operationsFor(building).some(id=>state.feedback?.feedbackId===`facility:${state.sol}:${id}`)
  const produced=operationsFor(building).find(id=>state.feedback?.feedbackId===`facility:${state.sol}:${id}`)
  return <section className={`facility-production${success?' production-succeeded':''}`} aria-label="Facility production">
    {operationsFor(building).filter(id => !resource || OUTPOST_BALANCE.operations[id].resource === resource).map(id=>{const op=OUTPOST_BALANCE.operations[id],ready=productionReadiness(state,id)
      return <div key={id}><ActionButton blockedReason={ready.reason} onClick={()=>dispatch({type:'OPERATE_FACILITY',operationId:id,expectedSol:state.sol,expectedResourceRevision:state.resourceRevision})}><ResourceIcon resource={op.resource} size={30}/>{op.name} +{op.gain}</ActionButton><small>{op.powerCost ? `${op.powerCost} Energy · `:''}1 Action · once per Mars Day</small></div>
    })}
    {success&&produced&&<p role="status"><ResourceIcon resource={OUTPOST_BALANCE.operations[produced].resource} size={30}/>✓ {state.feedback?.message}</p>}
  </section>
}
