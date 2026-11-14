import type { FacilityId, FacilityStatus, FacilityStatuses } from '../types/marsMap';

interface DemoControlsProps {
  selectedId: FacilityId | null;
  selectedLabel?: string;
  statuses: FacilityStatuses;
  previewStatus: (id: FacilityId, status: FacilityStatus) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
}

export function FacilityVisualDemoControls({ selectedId, selectedLabel, statuses, previewStatus, animationsEnabled, setAnimationsEnabled }: DemoControlsProps) {
  return <section className="demo-controls" aria-label="Visual demo controls">
    <div><h2>Visual demo · Phase 3</h2><p>Preview building looks only. No game resources change.</p></div>
    <fieldset disabled={!selectedId}><legend>{selectedLabel ? `Preview: ${selectedLabel}` : 'Select a building to preview its status'}</legend>
      {(['operational', 'offline', 'damaged'] as const).map(status => <button key={status} type="button" aria-pressed={selectedId ? statuses[selectedId] === status : false} onClick={() => { if (selectedId) previewStatus(selectedId, status); }}>{status}</button>)}
    </fieldset>
    <label className="motion-control"><input type="checkbox" checked={animationsEnabled} onChange={event => setAnimationsEnabled(event.target.checked)} /> Enable animations</label>
  </section>;
}
