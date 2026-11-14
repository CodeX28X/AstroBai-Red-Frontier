import { ICEBOUND_SCIENCE_SOURCES } from '../../missions/index.ts'
import type { IceboundExplorationSite } from './iceboundExploration.ts'

export function IceboundSiteDetails({ site, onSelect }: {
  site: IceboundExplorationSite; onSelect: (id: string) => void
}) {
  return <div className="console-copy">
    <p className="eyebrow">ICEBOUND / {site.selected ? 'Chosen' : site.statusLabel ?? site.status}</p>
    <h1>{site.label}</h1>
    <p>Fictional scenario. Map positions are schematic.</p>
    {site.observation ? <>
      <p>Ground: {site.definition.terrain}. You can use: {site.possibleMethods.map(method => method.replaceAll('-', ' ')).join(', ') || 'none with current readiness'}.</p>
      <p>Watch out for: {site.definition.hazards.map(hazard => hazard.replaceAll('-', ' ')).join(', ')}.</p>
      <p>{site.definition.scientificInterest}</p>
      <p>Reconnaissance: {site.observation.explanation}</p>
      <small>Reconnaissance clues are not an analysis result.</small>
    </> : <p>Reconnaissance observations are not yet recorded for this site.</p>}
    <button className="enter-facility" type="button" disabled={!site.canSelect} onClick={() => onSelect(site.id)}>
      {site.selected ? 'Research site selected' : 'Select research site'}
    </button>
    {!site.canSelect && <p>{site.selected ? 'The research site is recorded in mission state.' : [...new Set(site.blockers)].join(' ')}</p>}
    <details><summary>Science sources</summary>{ICEBOUND_SCIENCE_SOURCES.filter(source =>
      site.definition.scienceReferenceIds.includes(source.id)).map(source =>
      <p key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> — {source.context}</p>)}</details>
  </div>
}

