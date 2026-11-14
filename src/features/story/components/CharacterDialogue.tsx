import { useRef, useState, type RefObject } from 'react'
import type { AdventureGuide } from '../data/adventureDirector'
import { CHARACTERS } from '../data/characters'
import { guideDialogue, mayAdvanceDialogue } from '../data/guideDialogue'

export function CharacterDialogue({ guide, completed, onComplete, actionRef }: {
  guide: AdventureGuide; completed: boolean; onComplete: (id: string) => void; actionRef: RefObject<HTMLButtonElement | null>;
}) {
  const beats = guideDialogue(guide)
  const [index, setIndex] = useState(completed ? beats.length - 1 : 0)
  const lastAdvance = useRef(-Infinity)
  const beat = beats[index] ?? beats[0], speaker = CHARACTERS[beat.speakerId]
  function advance() {
    const now = performance.now()
    if (!mayAdvanceDialogue(lastAdvance.current, now)) return
    lastAdvance.current = now
    if (completed) { actionRef.current?.focus(); return }
    if (index < beats.length - 1) setIndex(previous => previous + 1)
    else { onComplete(guide.id); requestAnimationFrame(() => actionRef.current?.focus()) }
  }
  return <button type="button" className={`character-dialogue speaker-${beat.speakerId}`} aria-label={`Continue dialogue with ${speaker.name}`} onClick={advance} onKeyDown={event => { if (event.repeat) event.preventDefault() }}>
    <span className="portrait-frame"><img src={speaker.portrait} alt={`${speaker.name} portrait placeholder`} width="120" height="120"/></span>
    <span className="spoken-copy"><strong>{speaker.name}</strong><span className="spoken-line" aria-live="polite">“{completed ? guide.text : beat.text}”</span><small className="continue-indicator">{completed ? 'Ready · choose your next action' : `Tap to continue · ${index + 1}/${beats.length}`} <span aria-hidden="true">▸</span></small></span>
  </button>
}
