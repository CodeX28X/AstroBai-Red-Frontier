import { ExpeditionMarker } from './ExpeditionMarker';
import './AmbientActors.css';
import type { FacilityId } from '../../types/marsMap';
import { FacilityWalker } from './FacilityWalker';

/** Routes stay on the central connector and the clear middle of the southern path. */
export function AmbientActors({ crewSheltering = false, selectedFacilityId, motionActive, mapActive = true }: { crewSheltering?: boolean; selectedFacilityId: FacilityId | null; motionActive: boolean; mapActive?: boolean }) {
  return <div className="ambient-actors" aria-hidden="true">
    <div className="patrol-rover"><ExpeditionMarker kind="rover"/><span className="rover-trail"/></div>
    {!crewSheltering && <FacilityWalker selectedFacilityId={selectedFacilityId} motionActive={motionActive} mapActive={mapActive}/>}
    <div className="ambient-drift drift-a"/><div className="ambient-drift drift-b"/>
    <span className="ambient-mote mote-a"/><span className="ambient-mote mote-b"/><span className="ambient-mote mote-c"/>
  </div>;
}
