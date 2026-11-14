import { useId, useRef, useState } from 'react';
import { NavigatingActor } from './NavigatingActor';
import { scenePoint, SURFACE_MESH, nextNavigationId, facilityApproachPoint, type NavigationRequest } from '../../navigation/navigation';
import { MarsTerrain } from './MarsTerrain';
import { marsLocations } from '../../data/marsLocations';
import type { MarsMapProps } from '../../types/marsMap';
import { Facility } from './Facility';
import './MarsMap.css';
import { ExplorationSite } from './ExplorationSite';
import { AmbientActors } from './AmbientActors';
import { useAmbientMotion } from '../../hooks/useAmbientMotion';
import { MarsEffects, MarsEnvironmentNotice } from './MarsEffects';

export function MarsMap({ selectedFacilityId, onSelectFacility, facilityStatuses, animationsEnabled = true, sites = [], selectedSiteId, onSelectSite, environment = {}, completionNotice, isActive = true, navigation, fullViewport = false }: MarsMapProps) {
  const instructionsId = useId();
  const [localRequest, setLocalRequest] = useState<NavigationRequest>();
  const interaction = useRef<{ id: number; run: () => void } | null>(null);
  const currentRequest = navigation?.request && navigation.request.id > (localRequest?.id ?? 0) ? navigation.request : localRequest;
  function inspect(point: { x: number; y: number }, run: () => void) {
    if (!navigation || !navigation.evaAllowed) { run(); return; }
    const id = nextNavigationId(); interaction.current = { id, run }; setLocalRequest({ id, point, activity: 'inspecting' });
  }
  const motionActive = useAmbientMotion(animationsEnabled && isActive);
  return <section className={`map-section${motionActive ? '' : ' motion-paused'}${fullViewport ? ' map-viewport' : ''}`} aria-label="Mars outpost" aria-describedby={instructionsId}>
    <div className="map-heading"><span><span className="live-dot" /> SURFACE VIEW</span><span>MARS / OUTPOST</span></div>
    <div className={`mars-terrain${navigation ? ' navigable-terrain' : ''}`} onClick={event => { if (event.target === event.currentTarget) navigation?.onBlocked?.('That area is beyond our walking path. Tap the outpost ground.'); }}><div className="map-playfield" onClick={event => {
      if (!navigation || (event.target as Element).closest('button')) return;
      if (!navigation.evaAllowed) { navigation.onBlocked?.(navigation.blockedReason ?? 'Check EVA equipment before going outside.'); return; }
      interaction.current = null;
      setLocalRequest({ id: nextNavigationId(), point: scenePoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect()) });
    }}>
      <MarsTerrain/>
      <span className="map-north" aria-hidden="true">N<br/>↑</span>
      {!navigation && <AmbientActors crewSheltering={environment.crewSheltering} selectedFacilityId={selectedFacilityId} motionActive={motionActive} mapActive={isActive}/>}
      {navigation && <NavigatingActor request={currentRequest} initial={{ x: 50, y: 58 }} mesh={SURFACE_MESH} active={isActive} reducedMotion={!animationsEnabled} visible={currentRequest?.kind === 'rover' ? navigation.roverAvailable : navigation.evaAllowed} onBlocked={() => navigation.onBlocked?.('That path is blocked. Try a clear place.')} onArrive={id => {
        if (interaction.current?.id === id) { interaction.current.run(); interaction.current = null; }
        navigation.onArrive?.(id);
      }}/>}
      <MarsEffects {...environment}/>
      {navigation?.highlightScout && navigation.roverAvailable && <button type="button" className="scout-objective" style={{ left: '15%', top: '22%' }} onClick={navigation.onScoutSelect} aria-label="Scout survey target">▣ Scout<span>Survey here</span></button>}
      {marsLocations.map(location => <div key={location.id} className={navigation?.objectiveFacility === location.id ? 'objective-facility' : undefined}><Facility location={location} status={facilityStatuses[location.id]} sheltering={location.id === 'habitat' && environment.crewSheltering} selected={selectedFacilityId === location.id} onSelect={() => inspect(facilityApproachPoint(location.id), () => onSelectFacility(location.id))} /></div>)}
      {sites.map(site => <ExplorationSite key={site.id} site={site} selected={selectedSiteId === site.id} onSelect={() => onSelectSite?.(site.id)}/>)}
      {completionNotice && <div key={completionNotice.id} className="completion-notice" role="status"><span aria-hidden="true">✓</span> {completionNotice.message}</div>}
      <span className="terrain-caption" aria-hidden="true">A SMALL HOME. A BIG ADVENTURE.</span>
    </div>
    </div>
    <MarsEnvironmentNotice {...environment}/>
    <p className="map-instructions" id={instructionsId}><span aria-hidden="true">↖</span> {navigation ? 'Tap clear ground to walk. Tap a building to explore. Tab + Enter works too.' : 'Tap a building to explore. Keyboard: Tab, then Enter or Space.'}</p>
  </section>;
}

