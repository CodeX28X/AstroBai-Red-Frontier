import { useEffect, useRef, useState } from 'react';
import type { FacilityId } from '../../types/marsMap';
import { marsLocations } from '../../data/marsLocations';
import { facilityApproach, planFacilityWalk, walkerHome } from '../../data/facilityWalkRoutes';
import type { WalkPoint } from '../../data/facilityWalkRoutes';
import { ExpeditionMarker } from './ExpeditionMarker';

interface FacilityWalkerProps {
  selectedFacilityId: FacilityId | null;
  motionActive: boolean;
  mapActive?: boolean;
}

/** One decorative actor. Arrival never dispatches an action or enters a building. */
export function FacilityWalker({ selectedFacilityId, motionActive, mapActive = true }: FacilityWalkerProps) {
  const actor = useRef<HTMLDivElement>(null);
  const position = useRef<WalkPoint>(walkerHome);
  const [walking, setWalking] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 900px)').matches);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smallMap = window.matchMedia('(max-width: 900px)');
    const update = () => setReducedMotion(preference.matches);
    const resize = () => setCompact(smallMap.matches);
    preference.addEventListener('change', update);
    smallMap.addEventListener('change', resize);
    return () => { preference.removeEventListener('change', update); smallMap.removeEventListener('change', resize); };
  }, []);

  // This effect synchronizes walking state with an imperative DOM animation.
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    const element = actor.current;
    if (!element) return;
    const facility = marsLocations.find(location => location.id === selectedFacilityId);
    const destination = facility ? facilityApproach(facility.position, compact) : walkerHome;
    function place(point: WalkPoint) {
      position.current = point;
      element!.style.left = `${point.x}%`;
      element!.style.top = `${point.y}%`;
    }
    // Entering an interior finishes visual travel offscreen. Returning must not
    // restart it, even if Enter was pressed before the walk had finished.
    if (reducedMotion || !mapActive) {
      place(destination);
      setWalking(false);
      return;
    }
    if (!motionActive) { setWalking(false); return; }

    const route = planFacilityWalk(position.current, destination);
    if (route.length < 2) { setWalking(false); return; }
    let segment = 1;
    let started = performance.now();
    let frame = 0;
    setWalking(true);

    function step(now: number) {
      // Carry elapsed time across corners so low frame rates do not add pauses.
      while (segment < route.length) {
        const from = route[segment - 1];
        const to = route[segment];
        const duration = Math.hypot(to.x - from.x, to.y - from.y) * 75;
        const fraction = Math.min(1, (now - started) / duration);
        place({ x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction });
        if (fraction < 1) break;
        segment += 1;
        started += duration;
        if (segment === route.length) { setWalking(false); return; }
      }
      frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    // New selection, pause, hidden tab and unmount cancel the old route in place.
    return () => cancelAnimationFrame(frame);
  }, [selectedFacilityId, motionActive, reducedMotion, compact, mapActive]);
  /* oxlint-enable react/set-state-in-effect */

  return <div ref={actor} className={`facility-walker${walking ? ' is-walking' : ''}`} data-destination={selectedFacilityId ?? 'center'} data-walking={walking} style={{ left: '50%', top: '50%' }}>
    <span className="walker-shadow"/>
    <ExpeditionMarker kind="astronaut"/>
  </div>;
}
