import type { FacilityId } from '../../mars-map'
// GDD Part2 P.1. Status-specific lines are supplied by the shared-state adapter.
export const facilityPurpose: Readonly<Record<FacilityId,string>> = {
  habitat:'Where the crew lives and shelters. Needs power to stay warm and ready.',
  'solar-array':'Collects sunlight and turns it into power.',
  greenhouse:'Grows food with water and power.',
  'research-lab':'Studies samples from ICEBOUND.',
}
export const facilityLabels: Readonly<Record<FacilityId,string>> = {habitat:'Habitat','solar-array':'Solar Array',greenhouse:'Greenhouse','research-lab':'Research Laboratory'}
