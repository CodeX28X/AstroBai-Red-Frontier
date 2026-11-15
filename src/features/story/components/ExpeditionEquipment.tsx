import type { IceboundContext, ExpeditionPlan } from '../../missions/types/icebound'
import { expeditionEquipment } from '../../missions/engine/icebound/expeditionEquipment'
import { EquipmentIllustration } from '../../../shared/components/EquipmentIllustration'

export function ExpeditionEquipment({ context, plan, onChange }: { context:IceboundContext; plan:ExpeditionPlan; onChange:(ids:ExpeditionPlan['equipmentIds'])=>void }) {
  const tools=expeditionEquipment(context)
  return <><p>Standard mission equipment is included. Optional cargo can improve evidence quality.</p>
    <ul className="standard-tools" aria-label="Included standard equipment">{tools.standard.map(tool=><li key={tool.capability}><span aria-hidden="true">{tool.icon}</span> {tool.name} <small>Included</small></li>)}</ul>
    <h4>Optional tools you packed</h4>{tools.optional.length ? tools.optional.map(tool=><label className="tool-check" key={tool.id}><input type="checkbox" checked={plan.equipmentIds.includes(tool.id)} onChange={event=>onChange(event.target.checked?[...plan.equipmentIds,tool.id]:plan.equipmentIds.filter(id=>id!==tool.id))}/><EquipmentIllustration equipmentId={tool.id}/> {tool.name}</label>) : <p>No optional tools were packed. Your standard equipment supports this investigation.</p>}
  </>
}
