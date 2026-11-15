import { useId, useRef, useState, useEffect } from 'react';
import { NavigatingActor } from './NavigatingActor';
import { scenePoint, SURFACE_MESH, nextNavigationId, facilityApproachPoint, type NavigationRequest } from '../../navigation/navigation';
import { MarsTerrain } from './MarsTerrain';
import { marsLocations } from '../../data/marsLocations';
import type { FacilityId, MarsMapProps } from '../../types/marsMap';
import { Facility } from './Facility';
import './MarsMap.css';
import { ExplorationSite } from './ExplorationSite';
import { AmbientActors } from './AmbientActors';
import { useAmbientMotion } from '../../hooks/useAmbientMotion';
import { MarsEffects, MarsEnvironmentNotice } from './MarsEffects';

export function MarsMap({ selectedFacilityId, onSelectFacility, facilityStatuses, animationsEnabled = true, sites = [], selectedSiteId, onSelectSite, environment = {}, completionNotice, isActive = true, navigation, fullViewport = false, renderFacilityCard, highlightedSiteId }: MarsMapProps) {
  const instructionsId = useId();
  const [localRequest, setLocalRequest] = useState<NavigationRequest>();
  const [hovered, setHovered] = useState<FacilityId | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(leaveTimer.current), []);
  function showCard(id: FacilityId) { clearTimeout(leaveTimer.current); setHovered(id); }
  const interaction = useRef<{ id: number; run: () => void } | null>(null);
  const currentRequest = navigation?.request && navigation.request.id > (localRequest?.id ?? 0) ? navigation.request : localRequest;
  function inspect(point: { x: number; y: number }, run: () => void) {
    setHovered(null); run();
    if (!navigation || !navigation.evaAllowed) return;
    const id = nextNavigationId(); interaction.current = null; setLocalRequest({ id, point, activity: 'inspecting' });
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
      {marsLocations.map(location => <div key={location.id} className={`facility-interaction ${navigation?.objectiveFacility === location.id ? 'objective-facility' : ''}`} onPointerEnter={event => { if (event.pointerType !== 'touch') showCard(location.id); }} onPointerLeave={() => { leaveTimer.current = setTimeout(() => setHovered(null), 180); }} onFocus={() => showCard(location.id)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(null); }} onKeyDown={event => { if (event.key === 'Escape' && !selectedFacilityId) { setHovered(null); event.stopPropagation(); } }}><Facility location={location} status={facilityStatuses[location.id]} sheltering={location.id === 'habitat' && environment.crewSheltering} selected={selectedFacilityId === location.id} onSelect={() => inspect(facilityApproachPoint(location.id), () => onSelectFacility(location.id))} />{renderFacilityCard && hovered === location.id && !selectedFacilityId && isActive && <aside className={`facility-hover-card hover-${location.id}`} style={{ left: location.position.x < 50 ? "2%" : "98%", top: "37%" }} aria-label={`${location.label} quick actions`} onPointerEnter={() => clearTimeout(leaveTimer.current)}>{renderFacilityCard(location.id)}</aside>}</div>)}
      {sites.map(site => <div key={site.id} className={highlightedSiteId === site.id ? 'guided-science-site' : undefined}><ExplorationSite site={site} selected={selectedSiteId === site.id} onSelect={() => onSelectSite?.(site.id)}/></div>)}
      {completionNotice && <div key={completionNotice.id} className="completion-notice" role="status"><span aria-hidden="true">✓</span> {completionNotice.message}</div>}
      <span className="terrain-caption" aria-hidden="true">A SMALL HOME. A BIG ADVENTURE.</span>
    </div>
    </div>
    <MarsEnvironmentNotice {...environment}/>
    <p className="map-instructions" id={instructionsId}><span aria-hidden="true">↖</span> {navigation ? 'Tap clear ground to walk. Tap a building to explore. Tab + Enter works too.' : 'Tap a building to explore. Keyboard: Tab, then Enter or Space.'}</p>
  </section>;
}

