import type { Resources } from '../../../shared/types/game'
import { MAX_RESOURCE_VALUE } from '../../../shared/store/resourceEffects'
import './resourceHud.css'

const indicators = [
  { id: 'power', name: 'Energy', icon: '⚡', panel: 'energy' },
  { id: 'oxygen', name: 'Oxygen', icon: 'O₂', panel: 'supplies' },
  { id: 'water', name: 'Water', icon: '◉', panel: 'supplies' },
  { id: 'food', name: 'Food', icon: '✿', panel: 'supplies' },
] as const

export function ResourceHud({ resources, hidden, highlight, onInspect }: {
  resources: Resources
  hidden?: boolean
  highlight?: string
  onInspect: (panel: 'energy' | 'supplies' | 'safety') => void
}) {
  return <nav className="resource-hud" aria-label="Outpost resources" hidden={hidden}>
    {indicators.map(item => <button key={item.id} type="button" className={`resource-indicator${highlight === item.panel ? ' is-guided' : ''}`} onClick={() => onInspect(item.panel)}>
      <span className="resource-label"><span aria-hidden="true">{item.icon}</span> {item.name} <strong>{resources[item.id]}/{MAX_RESOURCE_VALUE}</strong></span>
      <progress aria-label={`${item.name} reserve`} max={MAX_RESOURCE_VALUE} value={resources[item.id]}/>
    </button>)}
    <button className={`resource-safety${highlight === 'safety' ? ' is-guided' : ''}`} type="button" onClick={() => onInspect('safety')}>Safety</button>
  </nav>
}
