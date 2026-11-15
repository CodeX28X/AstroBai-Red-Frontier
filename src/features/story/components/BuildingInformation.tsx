import type { GameAction, GameState, Resources } from '../../../shared/types/game'
import type { FacilityId } from '../../mars-map'
import { marsLocations } from '../../mars-map/data/marsLocations'
import { FacilityArt } from '../../mars-map/components/mars/FacilityArt'
import { operationsFor, OUTPOST_BALANCE } from '../../simulation/outpostSystems'
import { FacilityProduction } from './FacilityProduction'
import { RESOURCE_ASSETS } from '../../../shared/assets/gameAssets'

export function BuildingInformation({ id, state, dispatch, onEnter, onCheck, compact = false }: { id: FacilityId; state: GameState; dispatch: (action: GameAction) => void; onEnter: () => void; onCheck: (resource: keyof Resources | 'science') => void; compact?: boolean }) {
  const location = marsLocations.find(item => item.id === id)!
  const status = id === 'research-lab' ? state.iceboundReadiness.laboratoryOperational ? 'operational' : 'offline' : state.facilities[id]
  const operations = id === 'research-lab' ? [] : operationsFor(id)
  return <><div className="building-card-title"><span className="building-mini-art" aria-hidden="true"><FacilityArt id={id}/></span><h2>{location.label}</h2></div><p><strong>Condition:</strong> {status === 'operational' ? 'Working' : status === 'damaged' ? 'Needs care' : 'Offline'}</p>{!compact && <p>{location.detail}</p>}
    {operations.length > 0 ? <><p>Produces: {operations.map(operation => RESOURCE_ASSETS[OUTPOST_BALANCE.operations[operation].resource].name).join(' and ')}.</p><FacilityProduction building={id as Exclude<FacilityId, 'research-lab'>} state={state} dispatch={dispatch}/></> : <p>Study collected samples here. This lab does not produce supplies.</p>}
    {status !== 'operational' && <p>No repair operation is available in this mission. Check other supplies before resting.</p>}
    <div className="context-actions"><button type="button" onClick={onEnter}>Enter {location.label}</button>{operations.map(operation => { const resource = OUTPOST_BALANCE.operations[operation].resource; return <button type="button" key={resource} onClick={() => onCheck(resource)}>Check {RESOURCE_ASSETS[resource].name}</button> })}{id === 'research-lab' && <button type="button" onClick={() => onCheck('science')}>Science notebook</button>}</div>
  </>
}
