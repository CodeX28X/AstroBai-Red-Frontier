import type { FacilityId } from '../../mars-map/index.ts'
import { supplyLevel } from '../../simulation/outpostSimulation.ts'
import type { GameState, Resources } from '../../../shared/types/game.ts'
import { resourceNames } from './labels.ts'
const destinations: Record<keyof Resources, FacilityId> = { power: 'solar-array', oxygen: 'habitat', water: 'habitat', food: 'greenhouse' }
const symbols = { power: 'ϟ', oxygen: '◌', water: '◈', food: '♧' }
const words = { ready: 'Enough for tomorrow', low: 'Running low', urgent: 'Refill before bedtime' }
export function SupplyStrip({ state, onOpenRoom }: { state: GameState; onOpenRoom: (id: FacilityId) => void }) {
  return <section className="mvp-supply-strip" aria-label="Base supplies">
    {(Object.keys(state.resources) as (keyof Resources)[]).map(key => {
      const level = supplyLevel(state, key)
      return <button key={key} type="button" className={'mvp-supply mvp-supply-' + level} onClick={() => onOpenRoom(destinations[key])}
        aria-label={resourceNames[key] + ' ' + state.resources[key] + ' of 100. ' + words[level] + '. Open the room to refill.'}>
        <span className="mvp-supply-name"><span aria-hidden="true">{symbols[key]}</span> {resourceNames[key]} <strong>{state.resources[key]}</strong></span>
        <span className="mvp-supply-meter" aria-hidden="true"><span style={{ width: state.resources[key] + '%' }}/></span>
        <small>{words[level]}</small>
      </button>
    })}
  </section>
}

