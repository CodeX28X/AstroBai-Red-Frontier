import type { MarsEnvironment } from '../../types/marsMap';
import './MarsEffects.css';

/** Decorative layers never receive input or dispatch gameplay actions. */
export function MarsEffects({ dustStorm = false }: MarsEnvironment) {
  return dustStorm ? <div className="mars-effects dust-storm" aria-hidden="true">
    <div className="storm-haze" />
    {Array.from({ length: 12 }, (_, index) => <span className="storm-grain" key={index} style={{ top: `${6 + index * 8}%`, animationDelay: `${-index * .7}s`, animationDuration: `${5 + index % 3}s` }} />)}
  </div> : null;
}

export function MarsEnvironmentNotice({ dustStorm, solarStormWarning, crewSheltering }: MarsEnvironment) {
  return <div className={`environment-notice${!dustStorm && !solarStormWarning && !crewSheltering ? ' is-clear' : ''}`} role="status" aria-live="polite" aria-atomic="true">
    {dustStorm && <span>≋ Dust storm</span>}
    {solarStormWarning && <span>⚠ Solar storm warning</span>}
    {crewSheltering && <span>⌂ Crew sheltering in Habitat</span>}
    {!dustStorm && !solarStormWarning && !crewSheltering && <span>◇ Clear surface view</span>}
  </div>;
}
