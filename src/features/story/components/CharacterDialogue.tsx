import { useRef, useState, type RefObject } from 'react'
import type { AdventureGuide } from '../data/adventureDirector'
import { CHARACTERS } from '../data/characters'
import { guideDialogue, mayAdvanceDialogue } from '../data/guideDialogue'
import { CharacterPortrait } from './CharacterPortrait'
import { VoiceControls, useVoice } from './VoiceControls'

export function CharacterDialogue({ guide, completed, onComplete, actionRef }: {
  guide: AdventureGuide; completed: boolean; onComplete: (id: string) => void; actionRef: RefObject<HTMLButtonElement | null>;
}) {
  const beats = guideDialogue(guide)
  const voice = useVoice()
  const [index, setIndex] = useState(completed ? beats.length - 1 : 0)
  const lastAdvance = useRef(-Infinity)
  const currentIndex = completed ? beats.length - 1 : index
  const beat = beats[currentIndex] ?? beats[0], speaker = CHARACTERS[beat.speakerId]
  function advance() {
    const now = performance.now()
    if (!mayAdvanceDialogue(lastAdvance.current, now)) return
    lastAdvance.current = now
    voice.cancel()
    if (completed) { actionRef.current?.focus(); return }
    if (index < beats.length - 1) setIndex(previous => previous + 1)
    else { onComplete(guide.id); requestAnimationFrame(() => actionRef.current?.focus()) }
  }
  return <div className="dialogue-with-voice"><button type="button" className={`character-dialogue speaker-${beat.speakerId}`} aria-label={`Continue dialogue with ${speaker.name}`} onClick={advance} onKeyDown={event => { if (event.repeat) event.preventDefault() }}>
    <span className="portrait-frame"><CharacterPortrait speakerId={beat.speakerId}/></span>
    <span className="spoken-copy"><strong>{speaker.name}</strong><span className="spoken-line" aria-live="polite">“{beat.text}”</span><small className="continue-indicator">{completed ? 'Ready · choose your next action' : `Tap to continue · ${index + 1}/${beats.length}`} <span aria-hidden="true">▸</span></small></span>
  </button><VoiceControls id={`${guide.id}.${currentIndex}`} text={beat.text} speaker={beat.speakerId}/></div>
}
