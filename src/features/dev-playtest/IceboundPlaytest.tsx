import { MarsMap, IceboundSiteDetails, useIceboundExploration } from '../mars-map/index.ts'
import { iceboundMapCommand } from '../mars-map/integration/iceboundExploration.ts'
import { selectIceboundView } from '../../shared/store/iceboundSelectors.ts'
import type { ExpeditionMethod, SamplingMethod, ExpeditionPlan } from '../missions/index.ts'
import type { IceboundRuntimeIntent } from '../../shared/types/iceboundIntegration.ts'
import { useState } from 'react'
import { Data, Issues, type StageProps } from './common.tsx'
import { ICEBOUND_BALANCE } from '../missions/index.ts'

export function IceboundPlaytest({ state, send }: StageProps) {
  const exploration = useIceboundExploration()
  const view = selectIceboundView(state)
  const [inspected, setInspected] = useState<string | null>(null)
  const inspectedSite = exploration.sites.find(site => site.id === inspected)
  const site = exploration.sites.find(site => site.id === state.icebound.selectedSiteId)
  const planning = state.iceboundPlanning
  const plan = state.icebound.approvedPlan ?? planning.draft
  const locked = !!state.icebound.approvedPlan
  const ended = state.outcome !== null
  const eligible = (id: string) => !ended && !!view.objectives.find(o => o.id === id)?.eligible
  const runtime = (intent: IceboundRuntimeIntent) =>
    send({ type: 'ICEBOUND_COMMAND', intent, expectedMissionRevision: state.icebound.revision })
  const update = (patch: Partial<ExpeditionPlan>) => plan && send({ type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan: { ...plan, ...patch } })
  return <section><h2>Project ICEBOUND — fictional investigation</h2>
    <details><summary>Engine cost configuration (abstract units)</summary><Data value={ICEBOUND_BALANCE}/></details>
    <ol>{view.objectives.map(o => <li key={o.id}><strong>{o.title}: {o.status}</strong>
      <p>Prerequisites: {o.prerequisites.join(', ') || 'none'}. {o.issues.map(i => i.explanation).join(' ')}</p></li>)}</ol>
    <button disabled={!exploration.recon.eligible} onClick={() => send(iceboundMapCommand(state))}>Record reconnaissance</button>
    <p>{exploration.recon.issues.map(i => i.explanation).join(' ')}</p>
    <MarsMap sites={exploration.sites} selectedSiteId={exploration.selectedSiteId} onSelectSite={setInspected}
      selectedFacilityId={null} onSelectFacility={() => {}} showFacilities={false} animationsEnabled={false}
      facilityStatuses={{ habitat: 'offline', 'solar-array': 'offline', greenhouse: 'offline', 'research-lab': 'offline' }}
      completionNotice={exploration.completionNotice}/>
    {inspectedSite && <IceboundSiteDetails site={inspectedSite} onSelect={id => send(iceboundMapCommand(state, id))}/>}
    <h3>Expedition planning</h3>
    {!plan && <button disabled={!site || !eligible('icebound.expedition-plan')} onClick={() => site && send({
      type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan: { siteId: site.id as ExpeditionPlan['siteId'],
        method: site.definition.methods[0], activity: 'surface-sampling', equipmentIds: [], supplies: {} },
    })}>Create expedition draft</button>}
    {plan && <><fieldset disabled={locked || ended}><legend>Draft for {plan.siteId}</legend>
      <label>Method<select value={plan.method} onChange={e => update({ method: e.target.value as ExpeditionMethod })}>
        {site?.definition.methods.map(method => <option key={method}>{method}</option>)}</select></label>
      <label>Sampling method<select value={plan.activity} onChange={e => update({ activity: e.target.value as SamplingMethod })}>
        <option value="surface-sampling">Surface sampling</option><option value="subsurface-drilling">Subsurface drilling (requires installed capability)</option></select></label>
      <p>Tools must be both confirmed and deployed. Choose each tool explicitly.</p>
      {state.iceboundReadiness.deployedEquipment.map(item => <label key={item.equipmentId}><input type="checkbox"
        checked={plan.equipmentIds.includes(item.equipmentId)} disabled={item.status !== 'operational'}
        onChange={e => update({ equipmentIds: e.target.checked ? [...plan.equipmentIds, item.equipmentId] : plan.equipmentIds.filter(id => id !== item.equipmentId) })}/>
        {item.equipmentId} ({item.status})</label>)}
      {Object.keys(state.resources).map(resource => <label key={resource}>Declared {resource}<input type="number" min="0" step="1"
        value={plan.supplies[resource as keyof typeof state.resources] ?? 0}
        onChange={e => update({ supplies: { ...plan.supplies, [resource]: Number(e.target.value) } })}/></label>)}
    </fieldset>
    <p>Plan status: {view.planningStatus}; revision {planning.revision}. Declared supplies are not reservations or resource grants.</p>
    <button disabled={locked || ended} onClick={() => send({ type: 'REVIEW_ICEBOUND_EXPEDITION_PLAN' })}>Review expedition</button>
    <button disabled={locked || ended || planning.reviewedRevision !== planning.revision || !planning.review?.allowed}
      onClick={() => send({ type: 'CONFIRM_ICEBOUND_EXPEDITION_PLAN', revision: planning.revision })}>Confirm expedition</button>
    {view.currentReadiness && <><Issues title="Current blockers" items={view.currentReadiness.blockers}/><Issues title="Warnings" items={view.currentReadiness.warnings}/>
      <Issues title="Recommendations" items={view.currentReadiness.recommendations}/><h4>Trip and collection costs / major slots</h4>
      <Data value={{ trip: view.currentReadiness.requiredResources, tripSlots: view.currentReadiness.actionSlotCost,
        collection: view.currentReadiness.samplingResources, collectionSlots: view.currentReadiness.samplingActionSlotCost }}/></>}
    <button disabled={ended || !locked || !!state.icebound.expedition || !view.currentReadiness?.allowed} onClick={() => runtime({ type: 'EXECUTE_EXPEDITION' })}>Execute expedition</button>
    <button disabled={!eligible('icebound.sample-collection')} onClick={() => runtime({ type: 'COLLECT_SAMPLE', method: plan.activity })}>Collect sample</button></>}
    <h3>Samples and laboratory</h3>
    {!state.iceboundReadiness.baselineCapabilities.includes('lab-analysis') && <p>Laboratory unavailable: no installed lab capability and no installation action exists in the default game.</p>}
    <Data value={state.icebound.samples}/>
    {state.icebound.samples.map(sample => <button key={sample.id} disabled={!eligible('icebound.lab-analysis')}
      onClick={() => runtime({ type: 'ANALYZE_SAMPLE', sampleId: sample.id })}>Analyze {sample.id}</button>)}
    <h3>Scientific findings</h3>{state.icebound.analyses.map(a => <article key={a.sampleId}><h4>{a.classification}</h4><p>{a.conclusion}</p><Data value={a}/></article>)}
    <button disabled={!eligible('icebound.science-report')} onClick={() => runtime({ type: 'GENERATE_REPORT' })}>Record scientific report</button>
    <p>Mission status: {view.status}. Report: {state.icebound.report ? 'recorded' : 'incomplete'}.</p>
    <details><summary>Readiness, accepted costs and report</summary><Data value={{ readiness: state.iceboundReadiness, costs: state.icebound.costs, report: state.icebound.report }}/></details>
  </section>
}

