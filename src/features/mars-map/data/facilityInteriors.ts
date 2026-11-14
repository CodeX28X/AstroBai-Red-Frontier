import type { FacilityId } from '../types/marsMap';

export interface InteriorSpot { readonly id: string; readonly label: string; readonly description: string; readonly x: number; readonly y: number }
// Inspection copy only. No workstations operate equipment or grant science progress.
export const facilityInteriors: Record<FacilityId, { subtitle: string; spots: readonly InteriorSpot[] }> = {
  'research-lab': { subtitle: 'Small samples. Big questions.', spots: [
    { id: 'samples', label: 'Sample cabinet', description: 'A tidy place to keep rock and soil samples ready for the crew to study.', x: 23, y: 38 },
    { id: 'microscope', label: 'Microscope bench', description: 'Look closely! This is where the crew can examine tiny details in a sample.', x: 72, y: 40 },
    { id: 'terminal', label: 'Research terminal', description: 'A workstation where the crew records what they notice about Mars.', x: 69, y: 76 },
  ] },
  habitat: { subtitle: 'Your cozy corner of the red planet.', spots: [
    { id: 'bunks', label: 'Crew bunks', description: 'Comfy sleeping spaces for the crew between days of exploration.', x: 23, y: 38 },
    { id: 'table', label: 'Mess table', description: 'A shared place to sit, talk, and plan the next adventure.', x: 72, y: 40 },
    { id: 'shelter', label: 'Shelter nook', description: 'A protected corner where the crew can gather during a storm.', x: 69, y: 76 },
  ] },
  greenhouse: { subtitle: 'A little green goes a long way.', spots: [
    { id: 'beds', label: 'Plant beds', description: 'Leafy plants sit in neat rows inside their protected growing space.', x: 23, y: 38 },
    { id: 'water', label: 'Water equipment', description: 'Pipes and containers help bring water to the growing space.', x: 72, y: 40 },
    { id: 'seed', label: 'Seed station', description: 'A tidy shelf of seeds and tools for looking after the plants.', x: 69, y: 76 },
  ] },
  'solar-array': { subtitle: 'Behind the panels: the equipment bay.', spots: [
    { id: 'battery', label: 'Battery cabinets', description: 'Cabinets hold the equipment used to store energy for the outpost.', x: 23, y: 38 },
    { id: 'monitor', label: 'Array monitor', description: 'A display where the crew checks the solar panel equipment.', x: 72, y: 40 },
    { id: 'tools', label: 'Maintenance bench', description: 'Tools wait here for the crew to look after the solar panels.', x: 69, y: 76 },
  ] },
};
