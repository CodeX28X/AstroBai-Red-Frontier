export interface WalkPoint { readonly x: number; readonly y: number }

// Front courtyards below the two building rows, linked by the central path.
// These are drawing coordinates, never expedition locations or crew state.
export function facilityApproach(position: WalkPoint, compact = false): WalkPoint {
  // On the small map, approach the inner side instead of covering its label.
  if (compact) return { x: position.x < 50 ? 47 : 53, y: position.y };
  return { x: position.x, y: position.y < 50 ? 52 : 86 };
}

export const walkerHome: WalkPoint = { x: 50, y: 50 };

export function planFacilityWalk(current: WalkPoint, destination: WalkPoint): WalkPoint[] {
  if (current.x === destination.x && current.y === destination.y) return [current];
  const candidates = [current, { x: 50, y: current.y }, { x: 50, y: destination.y }, destination];
  return candidates.filter((point, index) => index === 0 || point.x !== candidates[index - 1].x || point.y !== candidates[index - 1].y);
}
