import { LANDING_SITES, validateMissionTransition } from '../missions/index.ts'
import { Data, type StageProps } from './common.tsx'
import { resolveResourceEffects } from '../../shared/store/resourceEffects.ts'

export function PlaytestMenu({ send }: StageProps) {
  return <section><h2>Menu</h2><button onClick={() => send({ type: 'START_GAME' })}>Start game</button></section>
}
export function LaunchPlaytest({ state, send }: StageProps) {
  return <section><h2>Launch</h2><p>Current phase: {state.phase}. Launch has no minigame or additional cost.</p>
    <button onClick={() => send({ type: 'COMPLETE_LAUNCH' })}>Complete launch</button></section>
}
export function LandingPlaytest({ state, send }: StageProps) {
  return <section><h2>Landing</h2>{LANDING_SITES.map(site => {
    const review = validateMissionTransition(state, { type: 'SELECT_LANDING_SITE', siteId: site.id })
    const resources = resolveResourceEffects(state.resources, review.effects.map(effect => effect.resourceDeltas))
    return <article key={site.id}><h3>{site.title}</h3><p>{site.description}</p>
      <p>Operational resource modifiers (abstract units):</p><Data value={site.resourceDeltas}/>
      <p>{!review.allowed ? review.message : !resources.allowed ? resources.reason : 'Eligible; reducer rechecks resources and duplicate effects.'}</p>
      <button disabled={!review.allowed || !resources.allowed} onClick={() => send({ type: 'SELECT_LANDING_SITE', siteId: site.id })}>Land at {site.title}</button></article>
  })}</section>
}
export function DebriefPlaytest({ state }: StageProps) {
  return <section><h2>Debrief</h2><p>Final sol: {state.sol}. Mission outcome: {state.outcome ?? 'No outcome recorded'}.</p>
    <p>ICEBOUND: {state.icebound.report ? 'Completed investigation' : 'Incomplete investigation; this is not a negative scientific result.'}</p>
    <Data value={state.resources}/><h3>Completed objectives</h3><Data value={state.objectives.filter(o => o.completed)}/>
    <h3>Recorded findings</h3>{state.icebound.analyses.map(a => <article key={a.sampleId}><h4>{a.classification}</h4><p>{a.conclusion}</p><Data value={a}/></article>)}
    <h3>Scientific report</h3>{state.icebound.report ? <Data value={state.icebound.report}/> : <p>No completed report recorded.</p>}
  </section>
}

