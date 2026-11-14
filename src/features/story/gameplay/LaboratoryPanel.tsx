import { ICEBOUND_BALANCE, validateObjective } from '../../missions/index.ts'
import { selectIceboundContext } from '../../../shared/store/iceboundSelectors.ts'
import { Costs, type ScreenProps } from './ui.tsx'
import { findingNames } from './labels.ts'
import { friendlyFeedback } from './friendlyFeedback.ts'
export function LaboratoryPanel({ state, send }: ScreenProps) {
  const context = selectIceboundContext(state)
  const analysis = validateObjective(context, 'icebound.lab-analysis')
  const report = validateObjective(context, 'icebound.science-report')
  const run = (intent: import('../../../shared/types/iceboundIntegration.ts').IceboundRuntimeIntent) =>
    send({ type: 'ICEBOUND_COMMAND', intent, expectedMissionRevision: state.icebound.revision })
  return <section className="mvp-room-jobs" aria-label="Laboratory jobs"><h2>Study your sample</h2>
    {!state.icebound.samples.length && <p>Bring back a sample from your expedition first. You can still look around the lab.</p>}
    {state.icebound.samples.map(sample => <article key={sample.id}><h3>Sample from day {sample.collectedSol}</h3><p>{sample.observation}</p>
      <p><Costs resources={ICEBOUND_BALANCE.analysis} slots={1}/></p>
      <button type="button" className="a-primary" disabled={!analysis.eligible} onClick={() => run({ type: 'ANALYZE_SAMPLE', sampleId: sample.id })}>{state.icebound.analyses.some(item => item.sampleId === sample.id) ? 'Sample studied' : 'Study this sample'}</button>
      {!analysis.eligible && !state.icebound.analyses.length && <p className="mvp-help">{analysis.issues.map(item => friendlyFeedback({ kind: 'error', message: item.explanation, code: item.code, feedbackId: item.feedbackId }, state)).join(' ')}</p>}
    </article>)}
    {state.icebound.analyses.map(finding => <article key={finding.sampleId}><h3>{findingNames[finding.classification]}</h3><p>{finding.conclusion}</p>
      <details><summary>What did we learn?</summary><p>{finding.observed}</p><ul>{finding.limitations.map(text => <li key={text}>{text}</li>)}</ul></details></article>)}
    {state.feedback?.analysis && <p role="status">{state.feedback.analysis.conclusion} The investigation is still unfinished.</p>}
    {!!state.icebound.analyses.length && <><p>A no or a maybe is useful science too. Sharing your report is free.</p>
      <button type="button" disabled={!report.eligible} onClick={() => run({ type: 'GENERATE_REPORT' })}>Share my science report</button></>}
    {state.icebound.report && <p className="mvp-success">Report shared! Keep caring for your base until the mission ends.</p>}
  </section>
}

