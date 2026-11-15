import { EQUIPMENT_CATALOG } from '../../features/missions/data/equipmentCatalog'
import { EQUIPMENT_ART } from '../assets/gameAssets'
import { PixelImage } from './PixelImage'

export function EquipmentIllustration({equipmentId,size=36}:{equipmentId:string;size?:number}) {
  const item=EQUIPMENT_CATALOG.find(item=>item.id===equipmentId)
  return <PixelImage src={item?EQUIPMENT_ART[item.id]:undefined} alt={`${item?.name??'Equipment'} illustration`} fallbackAlt={`${item?.name??'Equipment'} illustration placeholder`} fallbackText={item?.category==='maintenance'?'⚒':'◇'} width={size} height={size} className="equipment-illustration"/>
}
