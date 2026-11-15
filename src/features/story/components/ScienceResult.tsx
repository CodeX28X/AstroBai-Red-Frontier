import type { GameState } from '../../../shared/types/game'
import { selectIceboundView } from '../../../shared/store/iceboundSelectors'
import { VoiceControls } from './VoiceControls'
import type { IceboundScienceReport } from '../../missions/types/icebound'
import { SampleIllustration } from './SampleIllustration'
import { sciencePresentation } from '../data/sciencePresentation'

const SCIENCE_RESULT_COPY = {
  'supports-accessible-ice': { title: 'Evidence of water ice!', text: 'This sample supports the presence of water ice. One sample cannot tell us about all of Mars.', next: 'Read the report, then try another site.', symbol: '✧' },
  'no-accessible-ice-detected': { title: 'No ice detected in this sample', text: 'We learned something new! Other places or depths may be different.', next: 'Read the report, then compare another site.', symbol: '⌕' },
  inconclusive: { title: 'We cannot tell yet', text: 'The evidence is uncertain. An honest “not sure” is useful science, too.', next: 'Review our tools and sampling method for next time.', symbol: '?' },
  'analysis-incomplete': { title: 'Analysis not finished', text: 'We need a collected sample and a completed lab analysis before drawing a conclusion.', next: 'Follow the mission log to the next science step.', symbol: '⚗' },
} as const
export function ScienceResult({ state, report: provided }: { state: GameState; report?: IceboundScienceReport }) {
  const report = provided ?? selectIceboundView(state).report, summary = sciencePresentation(report)
  const { sample, finding, classification } = summary, copy = SCIENCE_RESULT_COPY[classification]
  const explanation = classification==='analysis-incomplete' ? copy.text : finding?.conclusion ?? copy.text
  return <section className={`science-result result-${classification}`} aria-label="Scientific investigation result">
    <div className="science-result-art"><SampleIllustration method={sample?.method}/><span className="science-result-symbol" aria-hidden="true">{copy.symbol}</span></div>
    <div><span className="overline">FICTIONAL INVESTIGATION / RECORDED EVIDENCE</span><h3>{copy.title}</h3><p className="result-status">{!provided && report.completionStatus==='complete' && !state.icebound.report ? 'Analysis complete · report ready to record' : summary.status}</p><dl className="sample-metadata"><dt>Research site</dt><dd>{summary.site}</dd><dt>Method</dt><dd>{summary.method}</dd>{sample && <><dt>Collected</dt><dd>Mars Day {sample.collectedSol} · {sample.quality.handling==='sealed'?'sealed container':'basic handling'} · {sample.quality.instrument==='field'?'field instrument recorded':'basic instrument context'}</dd></>}</dl><p>{explanation}</p>{classification==='no-accessible-ice-detected' && <p>We learned something new! A negative result is useful science.</p>}<strong>Next: {summary.next}</strong><VoiceControls id={`science.${report.siteId}.${report.outcomeId}`} text={`${copy.title}. ${summary.site}. ${summary.method}. ${explanation} Next: ${summary.next}`} speaker="kofi"/></div>
    <div className="science-evidence"><h4>What the evidence tells us</h4><p>{finding?.observed ?? 'No completed analysis is recorded for this investigation.'}</p>{sample && <p>{sample.observation}</p>}<h4>Challenges and limits</h4><ul>{[...summary.quality,...report.limitations].map((item,index)=><li key={index}>{item}</li>)}</ul><p><strong>Lesson:</strong> {summary.lesson}</p><p>{summary.control}</p></div>
  </section>
}
