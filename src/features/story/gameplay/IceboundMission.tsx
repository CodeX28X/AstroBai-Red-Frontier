import { methodNames, samplingNames, findingNames } from './labels.ts'
import { EQUIPMENT_CATALOG, ICEBOUND_BALANCE, validateObjective } from '../../missions/index.ts'
import type { ExpeditionPlan, ExpeditionMethod, SamplingMethod } from '../../missions/index.ts'
import type { IceboundRuntimeIntent } from '../../../shared/types/iceboundIntegration.ts'
import { selectIceboundContext, selectIceboundView } from '../../../shared/store/iceboundSelectors.ts'
import { ConfirmButton, Costs, ReviewNotes, type ScreenProps } from './ui.tsx'

export function IceboundMission({ state, send, onOpenLab }: ScreenProps & { onOpenLab?: () => void }) {
  const view = selectIceboundView(state)
  const context = selectIceboundContext(state)
  const mission = state.icebound
  const plan = mission.approvedPlan ?? state.iceboundPlanning.draft
  const planning = state.iceboundPlanning
  const site = view.sites.find(item => item.site?.id === mission.selectedSiteId)?.site
  const ended = state.phase !== 'outpost' || state.outcome !== null
  const eligible = (id: string) => !ended && validateObjective(context, id).eligible
  const run = (intent: IceboundRuntimeIntent) => send({ type: 'ICEBOUND_COMMAND', intent, expectedMissionRevision: mission.revision })
  const update = (patch: Partial<ExpeditionPlan>) => plan && send({ type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan: { ...plan, ...patch } })
  return <section className="mvp-panel"><h2>Project ICEBOUND</h2>
    <p>Explore a fictional site, collect a sample, and tell us what the evidence shows. There are six research steps. Research and base care share your two big jobs each day.</p>
    <details><summary>Your research steps · {view.completedCount}/6</summary>
      <ol className="mvp-objectives">{view.objectives.map(o => <li key={o.id}><strong>{o.title}</strong> · {{ completed: 'Done', available: 'Next', active: 'In progress', locked: 'Later', blocked: 'Needs help' }[o.status]}
        <p>{o.description}</p><small>{o.status === 'completed' ? '' : o.prerequisites.length ? 'Finish the earlier steps first. ' : ''}{o.status === 'completed' ? '' : o.issues.map(i => i.explanation).join(' ')}</small></li>)}</ol>
    </details>
    {!mission.completedObjectives.includes('icebound.recon') && <><h3>1 · Look for clues</h3>
      <p>Look around before choosing where to study. <Costs resources={ICEBOUND_BALANCE.recon} slots={1}/></p>
      <button type="button" className="a-primary" disabled={!eligible('icebound.recon')} onClick={() => run({ type: 'RECON' })}>Look for clues</button>
      <p>{view.objectives[0].issues.map(i => i.explanation).join(' ')}</p></>}
    {mission.completedObjectives.includes('icebound.recon') && !site && <p>2 · Inspect a site on the map above, then choose it for your investigation.</p>}
    {site && <><h3>3 · Plan your expedition to {site.name}</h3>
      <p>Choose who will go and which tools they will take. Different trips need different supplies.</p>
      {!plan && <button type="button" disabled={!eligible('icebound.expedition-plan')} onClick={() => send({
        type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan: { siteId: site.id, method: site.methods[0], activity: 'surface-sampling', equipmentIds: [], supplies: {} },
      })}>Plan the trip</button>}
      {plan && <><details open={!mission.approvedPlan}><summary>Your trip plan</summary><fieldset disabled={!!mission.approvedPlan || ended}><legend>Expedition choices</legend>
        <label>Who will go?<select value={plan.method} onChange={e => update({ method: e.target.value as ExpeditionMethod })}>
          {site.methods.map(method => <option key={method} value={method}>{methodNames[method]}</option>)}</select></label>
        <label>How will you collect?<select value={plan.activity} onChange={e => update({ activity: e.target.value as SamplingMethod })}>
          {Object.entries(samplingNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <h4>Choose packed tools</h4><div className="mvp-checks">{state.iceboundReadiness.deployedEquipment.map(item =>
          <label key={item.equipmentId}><input type="checkbox" disabled={item.status !== 'operational'} checked={plan.equipmentIds.includes(item.equipmentId)}
            onChange={e => update({ equipmentIds: e.target.checked ? [...plan.equipmentIds, item.equipmentId] : plan.equipmentIds.filter(id => id !== item.equipmentId) })}/>
            {EQUIPMENT_CATALOG.find(tool => tool.id === item.equipmentId)?.name ?? item.equipmentId} · {item.status === 'operational' ? 'working' : 'not ready'}</label>)}</div>
        <h4>Plan supplies</h4><p>These amounts cover the trip and collection. Planning does not spend them.</p>
        {view.currentReadiness && <button type="button" onClick={() => update({ supplies: Object.fromEntries(Object.keys(state.resources).map(key => {
          const resource = key as keyof typeof state.resources
          return [key, (view.currentReadiness!.requiredResources[resource] ?? 0) + (view.currentReadiness!.samplingResources[resource] ?? 0)]
        })) })}>Pack enough for this trip</button>}
        <details><summary>Change planned amounts</summary><div className="mvp-supply-inputs">{Object.keys(state.resources).map(key => <label key={key}>{key}<input type="number" min="0" max={state.resources[key as keyof typeof state.resources]} step="1"
          value={plan.supplies[key as keyof typeof state.resources] ?? 0} onChange={e => update({ supplies: { ...plan.supplies, [key]: Number(e.target.value) } })}/></label>)}</div></details>
      </fieldset>
      <p>{mission.approvedPlan ? 'Your trip plan is locked and ready.' : planning.reviewedRevision !== planning.revision ?
        'Check this version of your plan before locking it.' : 'Mission Control has checked this version of your plan.'}</p>
      <div className="a-button-row"><button type="button" disabled={!!mission.approvedPlan || ended} onClick={() => send({ type: 'REVIEW_ICEBOUND_EXPEDITION_PLAN' })}>Check my trip plan</button>
        <ConfirmButton disabled={!!mission.approvedPlan || ended || planning.reviewedRevision !== planning.revision || !planning.review?.allowed}
          question="Confirm this expedition plan? Its method and tools cannot be changed after confirmation."
          onConfirm={() => send({ type: 'CONFIRM_ICEBOUND_EXPEDITION_PLAN', revision: planning.revision })}>Lock my trip plan</ConfirmButton></div></details>
      {view.currentReadiness && !mission.expedition && <><h4>Trip</h4><Costs resources={view.currentReadiness.requiredResources} slots={view.currentReadiness.actionSlotCost}/>
        <h4>Collection</h4><Costs resources={view.currentReadiness.samplingResources} slots={view.currentReadiness.samplingActionSlotCost}/>
        <ReviewNotes title="Fix before you go" items={view.currentReadiness.blockers}/><details><summary>Tips for this trip</summary><ReviewNotes title="Things to watch" items={view.currentReadiness.warnings}/><ReviewNotes title="Helpful ideas" items={view.currentReadiness.recommendations}/></details></>}
      {!mission.expedition && <button type="button" className="a-primary" disabled={ended || !mission.approvedPlan || !view.currentReadiness?.allowed}
        onClick={() => run({ type: 'EXECUTE_EXPEDITION' })}>Start the trip</button>}
      {mission.expedition && <p>The expedition reached the site on Sol {mission.expedition.sol}. Reaching a site does not prove ice is there.</p>}
      {mission.expedition && !mission.samples.length && <><h3>4 · Collect a sample</h3><p>{samplingNames[plan.activity]}</p>
        <button type="button" disabled={!eligible('icebound.sample-collection')} onClick={() => run({ type: 'COLLECT_SAMPLE', method: plan.activity })}>Collect my sample</button>
        <p>{view.objectives.find(o => o.id === 'icebound.sample-collection')?.issues.map(i => i.explanation).join(' ')}</p></>}
      </>}
    </>}
    {!!mission.samples.length && !mission.report && <><h3>5 · Bring your sample to the lab</h3><p>Your sample is ready to study. The lab can help you find out what it shows.</p><button type="button" disabled={!onOpenLab} onClick={onOpenLab}>Go to the lab</button></>}
    {mission.analyses.map(analysis => <article key={analysis.sampleId}><h3>{findingNames[analysis.classification]}</h3>
      <p>{analysis.observed}</p><p>{analysis.conclusion}</p><ul>{analysis.limitations.map(text => <li key={text}>{text}</li>)}</ul></article>)}
    {state.feedback?.analysis && <aside className="mvp-notes" role="status"><h3>{findingNames[state.feedback.analysis.classification]}</h3>
      <p>{state.feedback.analysis.observed}</p><p>{state.feedback.analysis.conclusion}</p>
      <ul>{state.feedback.analysis.limitations.map(text => <li key={text}>{text}</li>)}</ul>
      <p>This diagnostic has not completed the investigation.</p></aside>}
    {!!mission.analyses.length && !mission.report && <p>Share your science report at the lab to finish the investigation. This step is free.</p>}
    {mission.report && <p className="mvp-success">Your investigation is recorded! Keep your base supplied until the mission ends. Your report is ready to read.</p>}
  </section>
}

