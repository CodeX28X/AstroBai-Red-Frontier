import { CHARACTERS, type SpeakerId } from '../data/characters'
import { PixelImage } from '../../../shared/components/PixelImage'

export function CharacterPortrait({speakerId,size=120}:{speakerId:SpeakerId;size?:number}) {
  const speaker=CHARACTERS[speakerId]
  return <PixelImage src={speaker.portrait} fallbackSrc={speaker.fallbackPortrait} alt={`${speaker.name} portrait`} fallbackAlt={`${speaker.name} portrait placeholder`} fallbackText={speaker.symbol} width={size} height={size} className="character-portrait"/>
}
