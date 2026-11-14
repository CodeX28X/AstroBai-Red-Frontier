import type { FacilityLocation } from '../types/marsMap';

export const marsLocations = [
  { id: 'habitat', label: 'Habitat', shortLabel: 'CREW QUARTERS', description: 'Home, sweet Mars.', detail: 'A cozy place for the crew to rest and take shelter between adventures.', position: { x: 38, y: 32 }, color: '#ffcf70' },
  { id: 'solar-array', label: 'Solar Array', shortLabel: 'ENERGY STATION', description: 'A little sunshine goes a long way.', detail: 'These wide panels collect sunlight for the outpost. Look for their bright blue squares!', position: { x: 62, y: 32 }, color: '#83d9ff' },
  { id: 'greenhouse', label: 'Greenhouse', shortLabel: 'PLANT MODULE', description: 'A patch of green on the red planet.', detail: 'Plants have their own protected space here. Spot the leafy rows under the glass roof.', position: { x: 38, y: 67 }, color: '#a7e8a0' },
  { id: 'research-lab', label: 'Research Laboratory', shortLabel: 'SCIENCE MODULE', description: 'Big questions. Tiny samples.', detail: 'The crew studies samples here to learn more about Mars. Every careful observation matters.', position: { x: 62, y: 67 }, color: '#c7b4ff' },
] as const satisfies readonly FacilityLocation[];

