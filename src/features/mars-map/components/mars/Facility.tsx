import type { CSSProperties } from 'react';
import type { FacilityLocation, FacilityStatus } from '../../types/marsMap';
import { FacilityArt } from './FacilityArt';

interface FacilityProps {
  location: FacilityLocation;
  selected: boolean;
  status: FacilityStatus;
  sheltering?: boolean;
  onSelect: () => void;
}

export function Facility({ location, selected, status, sheltering = false, onSelect }: FacilityProps) {
  const statusLabel = { operational: 'Ready', offline: 'Not ready', damaged: 'Needs repair', unbuilt: 'Not built' }[status];
  const style = { '--x': `${location.position.x}%`, '--y': `${location.position.y}%`, '--facility-color': location.color } as CSSProperties;
  return <button type="button" className={`mars-facility facility-${location.id} status-${status}${selected ? ' is-selected' : ''}${sheltering ? ' habitat-sheltering' : ''}`} style={style} onClick={onSelect} aria-pressed={selected} aria-label={`Inspect ${location.label}, ${statusLabel}${sheltering ? ', crew sheltering' : ''}`}>
    <span className="facility-selection" aria-hidden="true">{selected ? 'SELECTED' : 'INSPECT'}</span>
    <span className="facility-art"><FacilityArt id={location.id} /><span className="equipment-light" aria-hidden="true" />{status === 'damaged' && <span className="malfunction-plume" aria-hidden="true" />}</span>
    <span className="facility-label">{location.id === 'research-lab' ? <><span className="full-facility-name">{location.label}</span><span className="compact-facility-name">Research Lab</span></> : location.label}</span>
    <span className={`status-badge status-${status}`}><span className="status-symbol" aria-hidden="true">{status === 'damaged' ? '!' : status === 'offline' ? '−' : status === 'unbuilt' ? '?' : '●'}</span> {statusLabel}</span>
    {sheltering && <span className="shelter-badge">Crew inside</span>}
  </button>;
}
