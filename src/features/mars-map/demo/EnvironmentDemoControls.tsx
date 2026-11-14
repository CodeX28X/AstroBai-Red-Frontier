import type { MarsEnvironment } from '../types/marsMap';

export function EnvironmentDemoControls({ environment, onChange }: { environment: MarsEnvironment; onChange: (next: MarsEnvironment) => void }) {
  return <fieldset className="environment-demo"><legend>Phase 5 · environment preview</legend>
    {([
      ['dustStorm', 'Dust storm'], ['solarStormWarning', 'Solar storm warning'], ['crewSheltering', 'Crew sheltering'],
    ] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={!!environment[key]} onChange={event => onChange({ ...environment, [key]: event.target.checked })}/>{label}</label>)}
  </fieldset>;
}
