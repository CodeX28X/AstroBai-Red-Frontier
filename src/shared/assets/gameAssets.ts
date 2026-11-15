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

/** Inspected supplied artwork. PixelImage must wrap every optional bitmap. */
export const ADVENTURE_ASSETS = {
  missionIntro: '/assets/mission-intro/main-mission.png',
  sites: { selection: '/assets/exploration/sites/site-selection.png', placeholder: '/assets/exploration/sites/site-placeholder.png' },
  expedition: { 'rover-only': '/assets/exploration/expedition/rover-only.png', 'astronaut-team': '/assets/exploration/expedition/astronaut-only.png', combined: '/assets/exploration/expedition/combined-team.png' },
  equipment: '/assets/exploration/equipment/equipment-placeholder.png',
  actions: { scan: '/assets/exploration/actions/scan.png', collect: '/assets/exploration/actions/collect-sample.png', analyze: '/assets/exploration/actions/analyze.png' },
  feedback: { ready: '/assets/exploration/feedback/ready.png', warning: '/assets/exploration/feedback/warning.png', blocked: '/assets/exploration/feedback/blocked.png' },
  samples: { placeholder: '/assets/science/samples/sample-placeholder.png', 'surface-sampling': '/assets/science/samples/surface-sample.png', 'subsurface-drilling': '/assets/science/samples/drilled-sample.png' },
  results: { 'supports-accessible-ice': '/assets/science/results/evidence-found.png', 'no-accessible-ice-detected': '/assets/science/results/no-ice-detected.png', inconclusive: '/assets/science/results/inconclusive.png', 'analysis-incomplete': '/assets/science/results/incomplete.png' },
  laboratory: '/assets/science/laboratory/sample-analysis.png',
  bai: { happy: '/assets/characters/bai/happy.png', thinking: '/assets/characters/bai/thinking.png', worried: '/assets/characters/bai/worried.png' },
} as const
