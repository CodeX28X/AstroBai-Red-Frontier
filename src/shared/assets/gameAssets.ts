import type { Resources } from '../types/game.ts'
import type { EquipmentId } from '../../features/missions/types/preparation.ts'

export const RESOURCE_ASSETS = {
  power: {name:'Energy',src:'/assets/resources/energy.png',fallback:'/assets/supplies/energy.svg'},
  oxygen: {name:'Oxygen',src:'/assets/resources/oxygen.png',fallback:'/assets/supplies/oxygen.svg'},
  water: {name:'Water',src:'/assets/resources/water.png',fallback:'/assets/supplies/water.svg'},
  food: {name:'Food',src:'/assets/resources/food.png',fallback:'/assets/supplies/food.svg'},
} as const satisfies Record<keyof Resources,{name:string;src:string;fallback:string}>

/** No equipment PNGs were supplied. Add only inspected, matching catalog artwork here. */
export const EQUIPMENT_ART: Partial<Record<EquipmentId,string>> = {}
