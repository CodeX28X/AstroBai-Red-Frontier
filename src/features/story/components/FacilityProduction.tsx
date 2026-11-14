import type { BuildingId, GameAction, GameState } from '../../../shared/types/game'
import { OUTPOST_BALANCE, operationsFor, productionReadiness } from '../../simulation/outpostSystems'
import { ResourceIcon } from '../../../shared/components/ResourceIcon'

export function FacilityProduction({ building, state, dispatch }: { building:BuildingId; state:GameState; dispatch:(action:GameAction)=>void }) {
  const success=state.feedback?.code==='FACILITY_PRODUCED' && operationsFor(building).some(id=>state.feedback?.feedbackId===`facility:${state.sol}:${id}`)
  const produced=operationsFor(building).find(id=>state.feedback?.feedbackId===`facility:${state.sol}:${id}`)
  return <section className={`facility-production${success?' production-succeeded':''}`} aria-label="Facility production">
    {operationsFor(building).map(id=>{const op=OUTPOST_BALANCE.operations[id],ready=productionReadiness(state,id)
      return <div key={id}><button type="button" disabled={!ready.allowed} onClick={()=>dispatch({type:'OPERATE_FACILITY',operationId:id,expectedSol:state.sol,expectedResourceRevision:state.resourceRevision})}><ResourceIcon resource={op.resource} size={30}/>{op.name} +{op.gain}</button><small>{op.powerCost ? `${op.powerCost} Energy · `:''}1 big job · once per sol</small>{ready.reason&&<small>{ready.reason}</small>}</div>
    })}
    {success&&produced&&<p role="status"><ResourceIcon resource={OUTPOST_BALANCE.operations[produced].resource} size={30}/>✓ {state.feedback?.message}</p>}
  </section>
}
