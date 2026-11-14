import type { Resources } from '../../../shared/types/game'
import { MAX_RESOURCE_VALUE } from '../../../shared/store/resourceEffects'
import './resourceHud.css'
import { ResourceIcon } from '../../../shared/components/ResourceIcon'
import { RESOURCE_ASSETS } from '../../../shared/assets/gameAssets'

const indicators = [
  { id: 'power', panel: 'energy' },
  { id: 'oxygen', panel: 'supplies' },
  { id: 'water', panel: 'supplies' },
  { id: 'food', panel: 'supplies' },
] as const

export function ResourceHud({ resources, hidden, highlight, onInspect }: {
  resources: Resources
  hidden?: boolean
  highlight?: string
  onInspect: (panel: 'energy' | 'supplies' | 'safety') => void
}) {
  return <nav className="resource-hud" aria-label="Outpost resources" hidden={hidden}>
    {indicators.map(item => <button key={item.id} type="button" className={`resource-indicator${highlight === item.panel ? ' is-guided' : ''}`} onClick={() => onInspect(item.panel)}>
      <span className="resource-label"><ResourceIcon resource={item.id} size={30}/><span className="resource-name">{RESOURCE_ASSETS[item.id].name}</span> <strong>{resources[item.id]}/{MAX_RESOURCE_VALUE}</strong></span>
      <progress aria-label={`${RESOURCE_ASSETS[item.id].name} reserve`} max={MAX_RESOURCE_VALUE} value={resources[item.id]}/>
    </button>)}
    <button className={`resource-safety${highlight === 'safety' ? ' is-guided' : ''}`} type="button" onClick={() => onInspect('safety')}>Safety</button>
  </nav>
}
