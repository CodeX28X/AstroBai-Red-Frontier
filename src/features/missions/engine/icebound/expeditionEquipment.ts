import type { IceboundContext } from '../../types/icebound.ts'
import { EQUIPMENT_CATALOG } from '../../data/equipmentCatalog.ts'
import { availableEquipment, ICEBOUND_EQUIPMENT_CAPABILITIES } from './readiness.ts'

const standardTools = [
  {capability:'recon',name:'Scout survey system',icon:'▣'},
  {capability:'rover',name:'Standard mission rover',icon:'▣'},
  {capability:'eva',name:'Standard EVA equipment',icon:'★'},
  {capability:'surface-sampling',name:'Surface sampling tools',icon:'⚒'},
  {capability:'drilling',name:'Drilling station',icon:'⚒'},
  {capability:'sample-handling',name:'Basic sample handling',icon:'◇'},
  {capability:'lab-analysis',name:'Outpost laboratory',icon:'⌕'},
] as const
/** Baseline capabilities are not invented cargo IDs and cannot be removed from the outpost. */
export function expeditionEquipment(context: IceboundContext) {
  const inventory = new Set(availableEquipment(context))
  return {
    standard:standardTools.filter(tool=>context.readiness.baselineCapabilities.includes(tool.capability)),
    optional:EQUIPMENT_CATALOG.filter(item=>inventory.has(item.id) && Object.hasOwn(ICEBOUND_EQUIPMENT_CAPABILITIES,item.id)),
  }
}
