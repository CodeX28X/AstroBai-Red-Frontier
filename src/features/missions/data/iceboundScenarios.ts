import type { IceboundScenario } from '../types/icebound.ts'

/** Ground conditions are independent of equipment, player score and handling quality. */
export const ICEBOUND_SCENARIOS: readonly IceboundScenario[] = [
  { id: 'icebound.training-v1', fictional: true, conditions: {
    'icebound.lumen-shelf': { surface: 'dry', subsurface: 'ice', reconIndicator: 'possible-ice' },
    'icebound.cinder-flats': { surface: 'dry', subsurface: 'dry', reconIndicator: 'weak-evidence' },
    'icebound.echo-ridge': { surface: 'unknown', subsurface: 'unknown', reconIndicator: 'unclear' },
  } },
  { id: 'icebound.dry-v1', fictional: true, conditions: {
    'icebound.lumen-shelf': { surface: 'dry', subsurface: 'dry', reconIndicator: 'possible-ice' },
    'icebound.cinder-flats': { surface: 'dry', subsurface: 'dry', reconIndicator: 'weak-evidence' },
    'icebound.echo-ridge': { surface: 'unknown', subsurface: 'unknown', reconIndicator: 'unclear' },
  } },
]
