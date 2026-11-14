import { useState } from 'react';
import type { FacilityId, FacilityStatus, FacilityStatuses } from '../types/marsMap';

// Disposable visual fixture. This is not simulation state or a shared game action.
const initialStatuses: FacilityStatuses = {
  habitat: 'operational', 'solar-array': 'operational',
  greenhouse: 'operational', 'research-lab': 'operational',
};

export function useFacilityVisualDemo() {
  const [statuses, setStatuses] = useState<FacilityStatuses>(initialStatuses);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  function previewStatus(id: FacilityId, status: FacilityStatus) {
    setStatuses(previous => ({ ...previous, [id]: status }));
  }
  return { statuses, previewStatus, animationsEnabled, setAnimationsEnabled };
}

