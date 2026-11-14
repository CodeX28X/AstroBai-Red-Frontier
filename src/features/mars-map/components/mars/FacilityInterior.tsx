import { useEffect, useRef, useState } from 'react';
import type { FacilityId, FacilityStatus } from '../../types/marsMap';
import { marsLocations } from '../../data/marsLocations';
import { facilityInteriors } from '../../data/facilityInteriors';
import { InteriorArt } from './InteriorArt';
import { ExpeditionMarker } from './ExpeditionMarker';
import './FacilityInterior.css';
import { useAmbientMotion } from '../../hooks/useAmbientMotion';

interface FacilityInteriorProps {
  facilityId: FacilityId;
  status: FacilityStatus;
  animationsEnabled: boolean;
  crewSheltering?: boolean;
  onExit: () => void;
}

export function FacilityInterior({ facilityId, status, animationsEnabled, crewSheltering, onExit }: FacilityInteriorProps) {
  const [spotId, setSpotId] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const location = marsLocations.find(item => item.id === facilityId)!;
  const room = facilityInteriors[facilityId];
  const spot = room.spots.find(item => item.id === spotId);
  const motionActive = useAmbientMotion(animationsEnabled);
  useEffect(() => { titleRef.current?.focus(); }, []);
  return <section className={`facility-interior interior-${status}${motionActive ? '' : ' interior-paused'}`} aria-label={`${location.label} interior`} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onExit(); } }}>
    <header className="interior-header"><div><p className="eyebrow">INSIDE THE OUTPOST / {status}</p><h1 ref={titleRef} tabIndex={-1}>{location.label}{facilityId === 'solar-array' ? ' · Equipment Bay' : ''}</h1><p>{room.subtitle}</p></div><button type="button" onClick={onExit}>← Back to outpost</button></header>
    <div className="interior-scene">
      <InteriorArt id={facilityId}/>
      <div className="room-astronaut" aria-hidden="true"><ExpeditionMarker kind="astronaut"/></div>
      {room.spots.map(item=><button key={item.id} type="button" className="interior-hotspot" style={{left:`${item.x}%`,top:`${item.y+12}%`}} aria-pressed={spotId===item.id} onClick={()=>setSpotId(item.id)}><span aria-hidden="true">·</span>{item.label}</button>)}
      <button type="button" className="room-exit" onClick={onExit}>EXIT ↓</button>
    </div>
    <div key={spotId ?? 'welcome'} className="interior-description" aria-live="polite" aria-atomic="true"><h2>{spot?.label ?? 'Take a look around.'}</h2><p>{spot?.description ?? 'There’s a story in the little things. Pick a label to look closer.'}</p><small>{facilityId === 'habitat' && crewSheltering ? 'Crew sheltering · ' : ''}{status} · Looking is free · Esc to leave</small></div>
  </section>;
}
