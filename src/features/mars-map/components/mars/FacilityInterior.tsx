import { useEffect, useMemo, useRef, useState } from 'react';
import type { FacilityId, FacilityStatus } from '../../types/marsMap';
import { marsLocations } from '../../data/marsLocations';
import { facilityInteriors } from '../../data/facilityInteriors';
import { InteriorArt } from './InteriorArt';
import { NavigatingActor } from './NavigatingActor';
import { ROOM_MESH, scenePoint, nextNavigationId, type NavigationRequest } from '../../navigation/navigation';
import './FacilityInterior.css';
import { useAmbientMotion } from '../../hooks/useAmbientMotion';

interface FacilityInteriorProps {
  facilityId: FacilityId;
  status: FacilityStatus;
  animationsEnabled: boolean;
  crewSheltering?: boolean;
  onExit: () => void;
  workEventId?: string;
}

export function FacilityInterior({ facilityId, status, animationsEnabled, crewSheltering, onExit, workEventId }: FacilityInteriorProps) {
  const [spotId, setSpotId] = useState<string | null>(null);
  const [request, setRequest] = useState<NavigationRequest>();
  const workRequest = useMemo<NavigationRequest | undefined>(() => workEventId ? { id: nextNavigationId(), point: { x: 54, y: 72 }, activity: 'working' } : undefined, [workEventId]);
  const arrival = useRef<{ id: number; run: () => void } | null>(null);
  function move(point: { x: number; y: number }, run: () => void = () => {}) {
    const id = nextNavigationId(); arrival.current = { id, run }; setRequest({ id, point, activity: 'inspecting' });
  }
  const titleRef = useRef<HTMLHeadingElement>(null);
  const location = marsLocations.find(item => item.id === facilityId)!;
  const room = facilityInteriors[facilityId];
  const spot = room.spots.find(item => item.id === spotId);
  const motionActive = useAmbientMotion(animationsEnabled);
  useEffect(() => { titleRef.current?.focus(); }, []);
  return <section className={`facility-interior interior-${status}${motionActive ? '' : ' interior-paused'}${workEventId ? ' interior-working' : ''}`} aria-label={`${location.label} interior`} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onExit(); } }}>
    <header className="interior-header"><div><p className="eyebrow">INSIDE THE OUTPOST / {status}</p><h1 ref={titleRef} tabIndex={-1}>{location.label}{facilityId === 'solar-array' ? ' · Equipment Bay' : ''}</h1><p>{room.subtitle}</p></div><button type="button" onClick={onExit}>← Back to outpost</button></header>
    <div className="interior-scene" onClick={event => { if (!(event.target as Element).closest('button')) move(scenePoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect())); }}>
      <InteriorArt id={facilityId}/>
      <NavigatingActor indoor initial={{ x: 50, y: 82 }} mesh={ROOM_MESH} request={request ?? workRequest} reducedMotion={!animationsEnabled} onArrive={id => { if (arrival.current?.id === id) { arrival.current.run(); arrival.current = null; } }}/>
      {room.spots.map(item=><button key={item.id} type="button" className="interior-hotspot" style={{left:`${item.x}%`,top:`${item.y+12}%`}} aria-pressed={spotId===item.id} onClick={()=>move(item.y > 60 ? { x: 54, y: 72 } : { x: item.x, y: 56 }, () => setSpotId(item.id))}><span aria-hidden="true">·</span>{item.label}</button>)}
      <button type="button" className="room-exit" onClick={() => move({ x: 50, y: 86 }, onExit)}>EXIT ↓</button>
    </div>
    <div key={spotId ?? 'welcome'} className="interior-description" aria-live="polite" aria-atomic="true"><h2>{spot?.label ?? 'Take a look around.'}</h2><p>{spot?.description ?? 'Tap the floor to walk. Pick a label to look closer.'}</p><small>{facilityId === 'habitat' && crewSheltering ? 'Crew sheltering · ' : ''}{status} · Mars gravity stays the same indoors · Esc to leave</small></div>
  </section>;
}
