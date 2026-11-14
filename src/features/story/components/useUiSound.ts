import { useEffect, useRef } from 'react'

// A soft, synthesized UI tap; no downloads, music files, gameplay effects or timers.
export function useUiSound(enabled: boolean) {
  const context = useRef<AudioContext | null>(null)
  useEffect(() => () => {void context.current?.close().catch(() => undefined)},[])
  return () => {
    if (!enabled || typeof window === 'undefined' || !('AudioContext' in window)) return
    try {
      context.current ??= new AudioContext()
      const audio=context.current
      if (audio.state === 'suspended') void audio.resume().catch(() => undefined)
      const oscillator=audio.createOscillator(), gain=audio.createGain(), now=audio.currentTime
      oscillator.type='sine';oscillator.frequency.value=440
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(0.025,now+0.005);gain.gain.exponentialRampToValueAtTime(0.0001,now+0.06)
      oscillator.connect(gain);gain.connect(audio.destination)
      oscillator.start(now);oscillator.stop(now+0.065)
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()}
    } catch {/* Audio is optional; blocked audio never blocks an interaction. */}
  }
}
