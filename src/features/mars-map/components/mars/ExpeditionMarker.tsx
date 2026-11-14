import './ExpeditionMarker.css';
import type { ExpeditionKind } from '../../types/marsMap';
export function ExpeditionMarker({ kind }: { kind: ExpeditionKind }) {
  return <span className={`expedition-sprite expedition-${kind}`} aria-label={`${kind} expedition`} role="img"><svg viewBox={kind === 'astronaut' ? '37 0 27 42' : kind === 'rover' ? '0 0 43 42' : '0 0 64 42'} shapeRendering="crispEdges" aria-hidden="true">
    <path d={kind === 'astronaut' ? 'M40 38H61V41H40Z' : 'M3 37H40V41H3Z'} fill="#633f3b" opacity=".4"/>
    {kind !== 'astronaut' && <g><path d="M5 23H38V32H5Z" fill="#d8b98d"/><path d="M13 17H31V25H13Z" fill="#dce7e4"/><path d="M17 18H27V22H17Z" fill="#60cadb"/><path className="rover-beacon" d="M27 9H30V18H27ZM30 9H37V12H30Z" fill="#f8d47d"/><path d="M8 30H16V38H8ZM29 30H37V38H29Z" fill="#25364d"/><path className="rover-hub" d="M10 33H14V35H10Z" fill="#839e9d"/><path className="rover-hub" d="M31 33H35V35H31Z" fill="#839e9d"/><path d="M7 25H11V28H7ZM34 25H38V28H34Z" fill="#ffe0a0"/></g>}
    {kind !== 'rover' && <g><path d="M44 3H56V7H60V18H56V21H44V18H40V7H44Z" fill="#fff0d8"/><path d="M44 8H56V15H44Z" fill="#24384b"/><path d="M46 8H55V11H46Z" fill="#7fe4eb"/><path d="M44 21H56V32H44ZM40 23H44V30H40Z" fill="#e6d4b9"/><path className="astronaut-arm" d="M56 23H60V30H56Z" fill="#e6d4b9"/><path d="M46 23H54V27H46Z" fill="#f9b25d"/><path d="M48 28H52V30H48Z" fill="#62989d"/><path className="actor-feet" d="M44 32H49V38H42V35H44ZM51 32H56V35H58V38H51Z" fill="#24384b"/></g>}
  </svg></span>;
}
