import type { AdventureGuide } from './adventureDirector.ts'
import type { SpeakerId } from './characters.ts'
export interface DialogueBeat { speakerId: SpeakerId; text: string }
export function guideDialogue(guide: AdventureGuide): readonly DialogueBeat[] {
  if (guide.id === 'outpost.sol1.habitat') return [
    { speakerId: 'bai', text: 'Welcome to Mars! Let’s check our new home.' },
    { speakerId: 'kiki', text: 'Our crew is ready, Commander. Tap the habitat to explore.' },
  ]
  if (guide.objectiveId === 'icebound.recon') return [
    { speakerId: 'bai', text: 'Dr. Kofi found a clue about hidden ice!' },
    { speakerId: 'kofi', text: 'Let’s send Scout to look more closely.' },
  ]
  if (guide.objectiveId === 'icebound.site-selection') return [
    { speakerId: 'bai', text: 'Scout’s survey worked! Now we can choose where to explore.' },
    { speakerId: 'kofi', text: 'These clues need testing. Compare our three research sites.' },
  ]
  return [{ speakerId: guide.speakerId, text: guide.text }]
}
/** Prevents double-clicks and held-key repetition from skipping several beats. */
export function mayAdvanceDialogue(lastAdvance: number, now: number): boolean { return now - lastAdvance >= 350 }
