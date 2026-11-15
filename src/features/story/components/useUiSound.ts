import { useEffect, useMemo } from 'react'
import { createSoundEffects } from '../data/sound'

/** Adapter for the independent legacy preview; gameplay uses the shared audio provider. */
export function useUiSound(enabled: boolean) {
  const effects=useMemo(()=>createSoundEffects(()=>typeof window!=='undefined'&&typeof window.AudioContext==='function'?new AudioContext():null),[])
  useEffect(()=>{effects.enable(enabled)},[effects,enabled])
  useEffect(()=>()=>effects.dispose(),[effects])
  return ()=>{if(enabled)void effects.unlock().then(()=>effects.play('tap'))}
}
