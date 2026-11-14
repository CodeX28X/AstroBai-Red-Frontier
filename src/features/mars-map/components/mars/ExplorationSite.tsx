import './ExplorationSite.css';
import type { ScienceSite } from '../../types/marsMap';
import type { CSSProperties } from 'react';
import { ExpeditionMarker } from './ExpeditionMarker';
export function ExplorationSite({ site, selected, onSelect }: { site: ScienceSite; selected: boolean; onSelect: () => void }) {
  return <button type="button" className={`science-site site-${site.status}${selected ? ' site-selected' : ''}`} style={{ left: `${site.position.x}%`, top: `${site.position.y}%`, '--site-y': `${site.position.y}%` } as CSSProperties} aria-pressed={selected} aria-label={`${site.label}, ${site.statusLabel ?? site.status}${site.assignment ? `, ${site.assignment} assigned` : ''}`} onClick={onSelect}>
    <span className="site-crystal" aria-hidden="true"><svg viewBox="0 0 28 28" width="28" height="28" shapeRendering="crispEdges" focusable="false">
      <path d="M4 23H25V27H4Z" fill="#644c47" opacity=".5"/>
      {site.status === 'locked' ? <><path d="M8 11V5H20V11H23V23H5V11Z" fill="#e2d1a1"/><path d="M11 11H17V8H11Z" fill="#6c7774"/><path d="M12 15H16V20H12Z" fill="#586869"/></> : site.status === 'completed' ? <path d="M4 13H9V18H13V13H17V8H21V4H26V12H22V17H18V22H13V26H8V22H4Z" fill="#c8eaa0"/> : <><path d="M14 1L25 12L14 25L3 12Z" fill="#b4f4f3"/><path d="M14 1V25L3 12Z" fill="#6abac7"/><path d="M14 1L25 12H14Z" fill="#e7fff0"/></>}
    </svg></span><span className="site-name">{site.label}</span><small>{site.statusLabel ?? site.status}</small>{site.assignment && <ExpeditionMarker kind={site.assignment}/>}
  </button>;
}
