import type { ScienceSite } from '../types/marsMap';
// Illustrative fixtures only. Developer D supplies actual locations and eligibility.
export const explorationDemo: readonly ScienceSite[] = [
  { id: 'demo-ridge', label: 'Frost Ridge', status: 'available', position: { x: 15, y: 10 } },
  { id: 'demo-basin', label: 'Quiet Basin', status: 'locked', position: { x: 85, y: 10 } },
  { id: 'demo-crater', label: 'Blue Crater', status: 'active', position: { x: 85, y: 91 }, assignment: 'rover' },
  { id: 'demo-rock', label: 'Layered Rock', status: 'completed', position: { x: 14, y: 91 }, assignment: 'combined' },
];
