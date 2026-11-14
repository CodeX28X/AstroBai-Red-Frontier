import type { Resources } from '../../../shared/types/game'
import { RESOURCE_ASSETS } from '../../../shared/assets/gameAssets'
import { ResourceIcon } from '../../../shared/components/ResourceIcon'
import { MAX_RESOURCE_VALUE, RESOURCE_KEYS } from '../../../shared/store/resourceEffects'

export function ResourceSummary({resources}:{resources:Resources}) {
  return <div className="resource-summary" aria-label="Resource summary">{RESOURCE_KEYS.map(id=><div key={id}><ResourceIcon resource={id} size={44}/><span><small>{RESOURCE_ASSETS[id].name}</small><strong>{resources[id]}/{MAX_RESOURCE_VALUE}</strong></span></div>)}</div>
}
