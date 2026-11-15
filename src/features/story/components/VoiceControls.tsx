/* oxlint-disable react/only-export-components -- Provider and consumer hook share one context. */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createDialogueSpeech } from '../data/speech'

interface VoiceContextValue { muted: boolean; rate: number; supported: boolean; status: string; cancel: (id?: string) => void; play: (id: string, text: string, speaker: string) => void; mute: () => void; speed: (value: number) => void }
const VoiceContext = createContext<VoiceContextValue>({ muted: false, rate: .9, supported: false, status: 'Voice is unavailable on this device.', cancel() {}, play() {}, mute() {}, speed() {} })
export function VoiceProvider({ scope, children }: { scope: string; children: ReactNode }) {
  const [preferences, setPreferences] = useState(() => { try { const saved = JSON.parse(localStorage.getItem('astrobai.voice.v1') ?? 'null'); return { muted: saved?.muted === true, rate: [.75,.9,1.1].includes(saved?.rate) ? Number(saved.rate) : .9 } } catch { return { muted: false, rate: .9 } } })
  const [status, setStatus] = useState('Press the speaker to hear this line.')
  const controller = useMemo(() => typeof window !== 'undefined' && typeof window.speechSynthesis?.speak === 'function' && typeof window.SpeechSynthesisUtterance === 'function' ? createDialogueSpeech(window.speechSynthesis, text => new SpeechSynthesisUtterance(text)) : null, [])
  const cancel = useMemo(() => controller?.cancel ?? (() => {}), [controller])
  useEffect(() => { controller?.cancel(); return () => controller?.cancel() }, [scope, controller])
  useEffect(() => { try { localStorage.setItem('astrobai.voice.v1', JSON.stringify(preferences)) } catch { /* Session preferences still work. */ } }, [preferences])
  const value = useMemo<VoiceContextValue>(() => ({ ...preferences, supported: !!controller, status: controller ? status : 'Voice is unavailable on this device. Captions are always here.', cancel,
    play: (id,text,speaker) => { if (!preferences.muted) controller?.play(id,text,speaker,preferences.rate,setStatus) },
    mute: () => { controller?.cancel(); setPreferences(previous => ({ ...previous, muted: !previous.muted })); setStatus('Voice stopped.') },
    speed: rate => { controller?.cancel(); setPreferences(previous => ({ ...previous, rate })); setStatus('Speed changed. Press the speaker to replay.') },
  }), [preferences, controller, status, cancel])
  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
}
export function useVoice() { return useContext(VoiceContext) }
export function VoiceControls({ id, text, speaker = 'bai' }: { id: string; text: string; speaker?: string }) {
  const voice = useVoice(), cancel = voice.cancel
  // Both line replacement and unmount cancel only this panel's current utterance.
  useEffect(() => () => cancel(id), [id, text, cancel])
  return <div className="voice-controls" aria-label="Dialogue voice controls"><button type="button" disabled={!voice.supported || voice.muted} onClick={() => voice.play(id,text,speaker)} aria-label="Replay current line">🔊 <span>Listen</span></button><button type="button" disabled={!voice.supported} aria-pressed={voice.muted} onClick={voice.mute}>{voice.muted ? 'Unmute voice' : 'Mute voice'}</button><label>Speed <select aria-label="Speech speed" disabled={!voice.supported} value={voice.rate} onChange={event => voice.speed(Number(event.target.value))}><option value={.75}>Slow</option><option value={.9}>Steady</option><option value={1.1}>Quick</option></select></label><small role="status" className={/unavailable|could not/.test(voice.status) ? "voice-status-error" : "voice-status-quiet"}>{voice.status}</small></div>
}
