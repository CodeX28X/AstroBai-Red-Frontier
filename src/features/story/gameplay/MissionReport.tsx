import { missionEnding } from './ending.ts'
import { methodNames, findingNames, resourceNames } from './labels.ts'
import { EQUIPMENT_CATALOG, ICEBOUND_SCIENCE_SOURCES, ICEBOUND_SITES, ICEBOUND_OBJECTIVES, LANDING_SITES } from '../../missions/index.ts'
import { StoryBackdrop } from '../components/StoryBackdrop.tsx'
import type { GameState } from '../../../shared/types/game.ts'
import { ResourceCards } from './ui.tsx'

const milestoneLabels: Record<string, string> = {
  'mission-transition:menu:preparation': 'Mission started',
  'mission-transition:preparation:launch': 'Cargo confirmed and launch begun',
  'mission-transition:launch:landing': 'Arrival at Mars',
  'mission-transition:landing:outpost': 'Outpost reached',
  'icebound.expedition.executed': 'Expedition reached the research site',
  'mission-transition:outpost:debrief': 'Mission debrief reached',
}

export function MissionReport({ state }: { state: GameState }) {
  const mission = state.icebound
  const report = mission.report
  return <section className="mvp-panel"><h2>Your science report</h2>
    <p>{report ? 'Recorded investigation' : 'Incomplete investigation. This is not evidence that ice is absent.'}</p>
    <dl><dt>Research location</dt><dd>{ICEBOUND_SITES.find(s => s.id === mission.selectedSiteId)?.name ?? 'No site selected'}</dd>
      <dt>Travel method</dt><dd>{mission.approvedPlan ? methodNames[mission.approvedPlan.method] : 'No expedition confirmed'}</dd>
      <dt>Samples collected</dt><dd>{mission.samples.length}</dd></dl>
    {mission.samples.map(sample => <article key={sample.id}><h3>Sample from Sol {sample.collectedSol}</h3><p>{sample.observation}</p></article>)}
    {mission.analyses.map(analysis => <article key={analysis.sampleId}><h3>{findingNames[analysis.classification]}</h3>
      <p>{analysis.examined}</p><p>{analysis.observed}</p><p>{analysis.conclusion}</p><h4>What we still do not know</h4>
      <ul>{analysis.limitations.map(text => <li key={text}>{text}</li>)}</ul></article>)}
    {report && <><h3>Investigation limits</h3><ul>{report.limitations.map(text => <li key={text}>{text}</li>)}</ul></>}
    <p>These are fictional game locations and samples. We are not receiving live NASA data.</p>
    <details><summary>Science references</summary>{ICEBOUND_SCIENCE_SOURCES.filter(source =>
      (report?.scienceReferenceIds ?? ['nasa-swim', 'nasa-perseverance-objectives']).includes(source.id)).map(source =>
      <p key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> — {source.context}</p>)}</details>
  </section>
}
export function DebriefScreen({ state, onAgain, onMenu }: { state: GameState; onAgain: () => void; onMenu: () => void }) {
  const [ending, mission] = [missionEnding(state), state.icebound]
  return <section>
    <StoryBackdrop artwork="outpost-sunrise" className="mvp-ending-art"><header><p>Mission debrief</p><h1>{ending.heading}</h1>
      <p>{ending.science}</p></header></StoryBackdrop>
    <div className="mvp-panel"><h2>Your mission at a glance</h2>
      <p>{state.completedSol} sols completed · Outpost result: {state.outcome === 'success' ? 'Success' : state.outcome === 'failure' ? 'Mission unsuccessful' : 'Not evaluated'}.</p>
      <ResourceCards resources={state.resources}/>
      {state.survival?.endedBecause.length ? <p>The crew is in shelter. {state.survival.endedBecause.map(key => resourceNames[key]).join(', ')} ran out overnight. Next time, refill these supplies before ending the day.</p> : null}
      <p>Crew available: {state.iceboundReadiness.crewAvailable ? 'yes' : 'no'} · Ready for outside work: {state.iceboundReadiness.crewSafeForEva ? 'yes' : 'no'}.</p>
      <h3>Your choices</h3><ul><li>Cargo: {state.preparation.manifest.optionalCargo.map(e => (EQUIPMENT_CATALOG.find(i => i.id === e.equipmentId)?.name ?? e.equipmentId) + ' × ' + e.quantity).join(', ') || 'No optional cargo'}.</li>
        <li>Landing: {LANDING_SITES.find(s => s.id === state.selectedLandingSite)?.title ?? 'No landing recorded'}.</li>
        <li>Research site: {ICEBOUND_SITES.find(s => s.id === mission.selectedSiteId)?.name ?? 'Not selected'}.</li>
        <li>Research steps completed: {mission.completedObjectives.length} of 6.</li></ul>
      <h3>What your mission showed</h3><p>{state.outcome === 'failure' ? 'Exploring and caring for the base share the same two daily jobs. A new plan can leave time for both.' : ending.complete ? 'A careful plan helped you collect, study and report a sample. A no or a maybe is also useful science.' :
        'Your crew reached the end of this mission with science still to do. Next time, check the tools and plan time for each research step.'}</p>
      <p>Where you went, which tools you packed, and how you used your limited actions shaped the investigation.</p>
      <details><summary>Facilities and completed objectives</summary><ul>{Object.entries(state.facilities).map(([id,status]) => <li key={id}>{id}: {status}</li>)}</ul>
        <ul>{state.objectives.filter(o => o.completed).map(o => {
          const label = ICEBOUND_OBJECTIVES.find(definition => definition.id === o.id)?.title ?? milestoneLabels[o.id]
          return label ? <li key={o.id}>{label}</li> : null
        })}</ul></details>
      <div className="a-button-row"><button type="button" className="a-primary" onClick={onAgain}>Play again</button><button type="button" onClick={onMenu}>Main menu</button>
        <a href="#recorded-report">Review mission report</a></div>
    </div><div id="recorded-report"><MissionReport state={state}/></div>
  </section>
}

