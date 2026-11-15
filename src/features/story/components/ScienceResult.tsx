import type { GameState } from '../../../shared/types/game'
import { selectIceboundView } from '../../../shared/store/iceboundSelectors'
import { ADVENTURE_ASSETS } from '../../../shared/assets/gameAssets'
import { PixelImage } from '../../../shared/components/PixelImage'
import { VoiceControls } from './VoiceControls'

const SCIENCE_RESULT_COPY = {
  'supports-accessible-ice': { title: 'Evidence of water ice!', text: 'This sample supports the presence of water ice. One sample cannot tell us about all of Mars.', next: 'Read the report, then try another site.', symbol: '✧' },
  'no-accessible-ice-detected': { title: 'No ice detected in this sample', text: 'We learned something new! Other places or depths may be different.', next: 'Read the report, then compare another site.', symbol: '⌕' },
  inconclusive: { title: 'We cannot tell yet', text: 'The evidence is uncertain. An honest “not sure” is useful science, too.', next: 'Review our tools and sampling method for next time.', symbol: '?' },
  'analysis-incomplete': { title: 'Analysis not finished', text: 'We need a collected sample and a completed lab analysis before drawing a conclusion.', next: 'Follow the mission log to the next science step.', symbol: '⚗' },
} as const
export function ScienceResult({ state }: { state: GameState }) {
  const report = selectIceboundView(state).report, sample = report.samples[0]
  const classification = report.conclusion ?? 'analysis-incomplete', copy = SCIENCE_RESULT_COPY[classification]
  return <section className={`science-result result-${classification}`}><div className="science-result-art"><PixelImage src={sample ? ADVENTURE_ASSETS.samples[sample.method] : ADVENTURE_ASSETS.samples.placeholder} fallbackSrc={ADVENTURE_ASSETS.samples.placeholder} alt={sample ? `${sample.method === 'subsurface-drilling' ? 'Drilled' : 'Surface'} sample collected for analysis` : 'No sample collected yet'} fallbackText="◇"/><span className="science-result-symbol" aria-hidden="true">{copy.symbol}</span></div><div><span className="overline">DR. KOFI / OUR SAMPLE</span><h3>{copy.title}</h3><p>{copy.text}</p><strong>Next: {copy.next}</strong><VoiceControls id={`science.${report.outcomeId}`} text={`${copy.title}. ${copy.text} ${copy.next}`} speaker="kofi"/></div></section>
}
