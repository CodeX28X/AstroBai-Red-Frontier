import { useState } from 'react'
import { Dialog } from './Dialog'
import { PixelImage } from '../../../shared/components/PixelImage'
import { ADVENTURE_ASSETS } from '../../../shared/assets/gameAssets'
import { VoiceControls } from './VoiceControls'

export function MissionIntroduction({ onClose }: { onClose: () => void }) {
  const text = 'Your Mars mission! Keep your crew safe for 10 Mars Days! Use your supplies wisely. Explore Mars and complete your missions!'
  return <Dialog title="YOUR MARS MISSION!" onClose={onClose} hero><section className="mission-introduction"><PixelImage src={ADVENTURE_ASSETS.missionIntro} alt="Our astronaut, BAI and Scout beside a Mars outpost" fallbackText="★ ▣ ⌂"/><h3>Keep your crew safe for 10 Mars Days!</h3><div className="intro-goals"><p>⌂<strong>Care for your crew</strong></p><p>◈<strong>Use supplies wisely</strong></p><p>⌖<strong>Explore and learn</strong></p></div><VoiceControls id="mission-intro" text={text}/><p className="fine-print">A Mars Day is a little longer than an Earth day.</p><button type="button" className="primary" onClick={onClose}>Start Adventure</button></section></Dialog>
}
const HUD_GUIDE = [
  { target: 'resources', title: 'Our resources', text: 'These show our energy, air, water, and food!' },
  { target: 'actions', title: 'Our Actions', text: 'We can do three Actions each Mars Day!' },
  { target: 'buildings', title: 'Our buildings', text: 'Tap buildings to see what they can do!' },
  { target: 'missions', title: 'Our missions', text: 'Our mission list shows what to do next!' },
] as const
export function HudGuide({ onDone, onStep }: { onDone: () => void; onStep: (step: number) => void }) {
  const [step, setStep] = useState(0), guide = HUD_GUIDE[step]
  return <aside role="dialog" aria-label="BAI’s quick HUD guide" className="hud-guide"><strong>BAI · {step + 1} / {HUD_GUIDE.length}</strong><h2>{guide.title}</h2><p>{guide.text}</p><VoiceControls id={`hud-guide.${step}`} text={guide.text}/><div className="choice-row"><button type="button" onClick={onDone}>Skip guide</button><button type="button" className="primary" onClick={() => { if (step === HUD_GUIDE.length - 1) onDone(); else { setStep(step + 1); onStep(step + 1) } }}>{step === HUD_GUIDE.length - 1 ? 'Let’s explore!' : 'Next'}</button></div></aside>
}
