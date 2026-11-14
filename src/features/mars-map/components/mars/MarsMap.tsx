import { useId } from 'react';
import { MarsTerrain } from './MarsTerrain';
import { marsLocations } from '../../data/marsLocations';
import type { MarsMapProps } from '../../types/marsMap';
import { Facility } from './Facility';
import './MarsMap.css';
import { ExplorationSite } from './ExplorationSite';
import { AmbientActors } from './AmbientActors';
import { useAmbientMotion } from '../../hooks/useAmbientMotion';
import { MarsEffects, MarsEnvironmentNotice } from './MarsEffects';

export function MarsMap({ selectedFacilityId, onSelectFacility, facilityStatuses, animationsEnabled = true, sites = [], selectedSiteId, onSelectSite, environment = {}, completionNotice, isActive = true, showFacilities = true }: MarsMapProps) {
  const instructionsId = useId();
  const motionActive = useAmbientMotion(animationsEnabled && isActive);
  return <section className={`map-section${motionActive ? '' : ' motion-paused'}`} aria-label="Mars outpost" aria-describedby={instructionsId}>
    <div className="map-heading"><span><span className="live-dot" /> SURFACE VIEW</span><span>MARS / OUTPOST</span></div>
    <div className="mars-terrain">
      <MarsTerrain/>
      <span className="map-north" aria-hidden="true">N<br/>↑</span>
      <AmbientActors crewSheltering={environment.crewSheltering} selectedFacilityId={selectedFacilityId} motionActive={motionActive} mapActive={isActive}/>
      <MarsEffects {...environment}/>
      {showFacilities && marsLocations.map(location => <Facility key={location.id} location={location} status={facilityStatuses[location.id]} sheltering={location.id === 'habitat' && environment.crewSheltering} selected={selectedFacilityId === location.id} onSelect={() => onSelectFacility(location.id)} />)}
      {sites.map(site => <ExplorationSite key={site.id} site={site} selected={selectedSiteId === site.id} onSelect={() => onSelectSite?.(site.id)}/>)}
      {completionNotice && <div key={completionNotice.id} className="completion-notice" role="status"><span aria-hidden="true">✓</span> {completionNotice.message}</div>}
      <span className="terrain-caption" aria-hidden="true">A SMALL HOME. A BIG ADVENTURE.</span>
    </div>
    <MarsEnvironmentNotice {...environment}/>
    <p className="map-instructions" id={instructionsId}><span aria-hidden="true">↖</span> Tap a building to explore. Keyboard: Tab, then Enter or Space.</p>
  </section>;
}

