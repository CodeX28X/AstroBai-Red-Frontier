// Deliberately imports no App stylesheet: verifies the public map boundary.
import { useState } from 'react';
import { MarsMap } from '../components/mars/MarsMap';
import { explorationDemo } from '../demo/explorationDemo';
import type { FacilityId, FacilityStatuses, FacilityStatus, ScienceSite, ExpeditionKind, MarsEnvironment } from '../types/marsMap';

export default function MapFixture() {
  const [facility, setFacility] = useState<FacilityId | null>(null);
  const [site, setSite] = useState<string | null>(null);
  const [calls, setCalls] = useState(0);
  const [statuses, setStatuses] = useState<FacilityStatuses>({ habitat: 'operational', 'solar-array': 'operational', greenhouse: 'operational', 'research-lab': 'operational' });
  const [sites, setSites] = useState<readonly ScienceSite[]>(explorationDemo);
  const [environment, setEnvironment] = useState<MarsEnvironment>({});
  const [motion, setMotion] = useState(true);
  const [active, setActive] = useState(true);
  const updateSite = (patch: Partial<Pick<ScienceSite, 'status' | 'assignment'>>) => setSites(previous => previous.map(item => item.id === (site ?? 'demo-ridge') ? { ...item, ...patch } : item));
  return <main style={{ maxWidth: 960, margin: 'auto', fontFamily: 'system-ui' }}>
    <h1>Standalone MarsMap test fixture</h1>
    <p>Display mocks only. Controls update props; callbacks record inspection IDs.</p>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      <label>Facility status <select aria-label="Facility status" value={statuses[facility ?? 'habitat']} onChange={event => setStatuses(previous => ({ ...previous, [facility ?? 'habitat']: event.target.value as FacilityStatus }))}>{['operational', 'offline', 'damaged'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Site status <select aria-label="Site status" value={sites.find(item => item.id === (site ?? 'demo-ridge'))?.status} onChange={event => updateSite({ status: event.target.value as ScienceSite['status'] })}>{['available', 'locked', 'active', 'completed'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Assignment <select aria-label="Assignment" value={sites.find(item => item.id === (site ?? 'demo-ridge'))?.assignment ?? ''} onChange={event => updateSite({ assignment: (event.target.value || undefined) as ExpeditionKind | undefined })}><option value="">None</option>{['rover', 'astronaut', 'combined'].map(value => <option key={value}>{value}</option>)}</select></label>
      {(['dustStorm', 'solarStormWarning', 'crewSheltering'] as const).map(key => <label key={key}><input type="checkbox" checked={Boolean(environment[key])} onChange={event => setEnvironment(previous => ({ ...previous, [key]: event.target.checked }))}/>{key}</label>)}
      <label><input type="checkbox" checked={motion} onChange={event => setMotion(event.target.checked)}/>Motion enabled</label>
      <label><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)}/>Map active</label>
    </div>
    <output data-testid="selection">{JSON.stringify({ facility, site, calls })}</output>
    <MarsMap facilityStatuses={statuses} selectedFacilityId={facility} selectedSiteId={site} sites={sites} environment={environment} animationsEnabled={motion} isActive={active}
      onSelectFacility={id => { setFacility(id); setSite(null); setCalls(value => value + 1); }}
      onSelectSite={id => { setSite(id); setFacility(null); setCalls(value => value + 1); }}/>
  </main>;
}

