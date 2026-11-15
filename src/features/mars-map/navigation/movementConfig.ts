/** Scene units/second and matching gait periods; 25% faster than 14/20/22. */
const travelMultiplier = 1.25
export const MOVEMENT_CONFIG = {
  travelMultiplier,
  outdoorSpeed:14*travelMultiplier,
  indoorSpeed:20*travelMultiplier,
  roverSpeed:22*travelMultiplier,
  reducedMotionTravelSeconds:.35,
  cadence:{eva:.72/travelMultiplier,indoor:.42/travelMultiplier,feet:.4/travelMultiplier,wheels:.3/travelMultiplier},
} as const
