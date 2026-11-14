import { useState } from 'react'
import type { GameAction, GameState } from '../../../shared/types/game'
import type { ExpeditionMethod, ExpeditionPlan, SamplingMethod } from '../../missions/types/icebound'
import { ICEBOUND_SITES } from '../../missions/data/iceboundSites'
import { EQUIPMENT_CATALOG } from '../../missions/data/equipmentCatalog'
import { reviewExpeditionPlan } from '../../missions/engine/icebound/planning'
import { expeditionCost, samplingCost, availableEquipment } from '../../missions/engine/icebound/readiness'
import { selectIceboundContext, selectIceboundView } from '../../../shared/store/iceboundSelectors'
import { RESULT_LABELS } from '../data/adventureDirector'
import { LANDING_SITES } from '../../missions/data/landingSites'
export function AdventureChoices({ state }: { state: GameState }) {
  return <details><summary>Your mission choices</summary><p>Landing: {LANDING_SITES.find(s => s.id === state.selectedLandingSite)?.title ?? 'Not chosen'}</p><p>Expedition: {state.icebound.approvedPlan?.method.replaceAll('-', ' ') ?? 'Not planned'}</p><h3>Cargo you chose</h3><ul>{state.preparation.manifest.optionalCargo.map(entry => <li key={entry.equipmentId}>{entry.quantity} × {EQUIPMENT_CATALOG.find(item => item.id === entry.equipmentId)?.name}</li>)}</ul>{!state.preparation.manifest.optionalCargo.length && <p>No optional cargo.</p>}</details>
}
export function AdventureSites({ state, dispatch, onChosen }: { state: GameState; dispatch: (a: GameAction) => void; onChosen: () => void }) {
  const view = selectIceboundView(state)
  return <><p>Scout found clues, not proof of ice. Choose carefully!</p><div className="site-cards">{view.sites.map((assessment, index) => {
    const site = assessment.site!, observation = state.icebound.observations.find(o => o.siteId === site.id)
    return <article key={site.id}><span className="site-number">0{index+1}</span><h3>{site.name.replace(' (fictional)','')}</h3><p>{site.scientificInterest}</p><p><strong>Clue:</strong> {observation?.indicator.replaceAll('-',' ') ?? 'Survey needed'}</p><p><strong>Route:</strong> {site.terrain} · {assessment.possibleMethods.map(m => m === 'rover-only' ? 'Scout' : m === 'astronaut-team' ? 'crew' : 'both').join(', ') || 'unavailable'}</p><details><summary>Route safety</summary>{site.hazards.map(h => <p key={h}>{h.replaceAll('-',' ')}</p>)}</details><button type="button" disabled={!assessment.allowed || !!state.icebound.selectedSiteId} onClick={() => { dispatch({ type: 'ICEBOUND_COMMAND', intent: { type: 'SELECT_SITE', siteId: site.id } }); onChosen() }}>Explore {site.name.replace(' (fictional)','')}</button>{assessment.issues[0] && <p>{assessment.issues[0].explanation}</p>}</article>
  })}</div><p className="fine-print">All three locations and survey clues are fictional.</p></>
}
export function AdventurePlan({ state, dispatch }: { state: GameState; dispatch: (a: GameAction) => void }) {
  const ctx = selectIceboundContext(state), planning = state.iceboundPlanning
  const site = ICEBOUND_SITES.find(s => s.id === state.icebound.selectedSiteId)!
  const draft = state.icebound.approvedPlan ?? planning.draft
  const locked = !!state.icebound.approvedPlan
  const [step, setStep] = useState(locked ? 3 : 0)
  function update(method: ExpeditionMethod, activity: SamplingMethod, equipmentIds = draft?.equipmentIds ?? availableEquipment(ctx)) {
    const plan: ExpeditionPlan = { siteId: site.id, method, activity, equipmentIds, supplies: {} }
    const costs = expeditionCost(ctx, plan, site.travelRequirement), sample = samplingCost(ctx, activity)
    for (const key of ['power','oxygen','water','food'] as const) plan.supplies[key] = (costs[key] ?? 0) + (sample[key] ?? 0)
    dispatch({ type: 'SET_ICEBOUND_EXPEDITION_PLAN', plan })
  }
  const review = draft ? reviewExpeditionPlan(ctx, draft) : null
  const titles = ['Who goes?', 'What will we collect?', 'Check our tools', 'Mission Control review']
  return <section className="expedition-wizard"><p className="overline">STEP {step + 1} / 4 · {site.name.replace(' (fictional)', '')}</p><h3>{titles[step]}</h3>
    {step === 0 && <div className="choice-row">{(['rover-only','astronaut-team','combined'] as const).map(method => <button type="button" key={method} aria-pressed={draft?.method === method} disabled={locked || !site.methods.includes(method)} onClick={() => update(method, draft?.activity ?? 'surface-sampling')}><strong>{method === 'rover-only' ? '▣ Scout' : method === 'astronaut-team' ? '★ Crew' : '★ + ▣ Together'}</strong><span>{method === 'rover-only' ? 'Crew stays at base. Scout uses our tools.' : method === 'astronaut-team' ? 'Crew needs EVA gear, oxygen and supplies.' : 'Crew and Scout share the work. Uses more energy.'}</span></button>)}</div>}
    {step === 1 && draft && <div className="choice-row">{(['surface-sampling','subsurface-drilling'] as const).map(activity => <button type="button" key={activity} aria-pressed={draft.activity === activity} onClick={() => update(draft.method, activity)}>{activity === 'surface-sampling' ? 'Surface material' : 'Drill below the surface'}</button>)}</div>}
    {step === 2 && draft && <><p>Only our confirmed, working equipment can come along.</p>{availableEquipment(ctx).map(id => <label className="tool-check" key={id}><input type="checkbox" checked={draft.equipmentIds.includes(id)} onChange={event => update(draft.method, draft.activity, event.target.checked ? [...draft.equipmentIds,id] : draft.equipmentIds.filter(tool => tool !== id))}/>{EQUIPMENT_CATALOG.find(e => e.id === id)?.name}</label>)}<p>Supplies for the trip and sample are reserved in the plan. Costs are paid when we do the work.</p></>}
    {step === 3 && draft && review && <><div className="review-result"><h3>{locked ? '✓ Confirmed' : review.allowed ? '✓ Ready' : '△ Needs Fixing'}</h3><p>{draft.method.replaceAll('-',' ')} · {draft.activity.replaceAll('-',' ')}</p><p>Trip: {Object.entries(review.requiredResources).filter(([,v]) => v).map(([k,v]) => `${v} ${k}`).join(' · ')}. One big job.</p><p>Collection: {Object.entries(review.samplingResources).map(([k,v]) => `${v} ${k}`).join(' · ')}. One big job.</p>{review.blockers[0] && <p role="status">{review.blockers[0].explanation}</p>}<details><summary>Helpful tips and route cautions</summary>{[...review.warnings,...review.recommendations].map(i => <p key={i.code}>{i.explanation}</p>)}</details></div>{locked ? <p role="status">Plan confirmed. Close this panel to start our expedition.</p> : <div className="choice-row"><button type="button" onClick={() => dispatch({ type: 'REVIEW_ICEBOUND_EXPEDITION_PLAN' })}>Check with Mission Control</button><button type="button" className="primary" disabled={planning.reviewedRevision !== planning.revision || !planning.review?.allowed || !review.allowed} onClick={() => dispatch({ type: 'CONFIRM_ICEBOUND_EXPEDITION_PLAN', revision: planning.revision })}>Confirm expedition plan</button></div>}</>}
    {!locked && <div className="choice-row wizard-navigation">{step > 0 && <button type="button" onClick={() => setStep(step - 1)}>Back</button>}{step < 3 && <button type="button" className="primary" disabled={!draft} onClick={() => setStep(step + 1)}>{step === 0 ? 'Next: sampling' : step === 1 ? 'Next: tools' : 'Next: review'}</button>}</div>}
  </section>
}
export function AdventureReport({ state }: { state: GameState }) {
  const report = selectIceboundView(state).report
  return <><h3>{report.completionStatus === 'complete' ? RESULT_LABELS[report.conclusion!] : 'Investigation still in progress'}</h3><p>{report.findings[0]?.conclusion ?? 'Collect and analyze a sample to reach a conclusion.'}</p><ul>{report.limitations.map(item => <li key={item}>{item}</li>)}</ul><details><summary>Our science notebook</summary><p>Site: {ICEBOUND_SITES.find(s => s.id === report.siteId)?.name ?? 'Not selected'}</p><p>Sample method: {report.samples[0]?.method.replaceAll('-',' ') ?? 'Not collected'}</p><p>Sample handling: {report.samples[0]?.quality.handling ?? 'Not recorded'}</p><p>Field instrument: {report.samples[0]?.quality.instrument ?? 'Not recorded'}</p><ul>{report.operationalCosts.map(cost => <li key={cost.operationId}>Sol {cost.sol} · {cost.operationId.replaceAll('-',' ')} · {Object.entries(cost.resources).map(([k,v]) => `${v} ${k}`).join(', ')}</li>)}</ul></details><p className="fine-print">Game findings are fictional. A negative or uncertain result is useful science.</p></>
}
