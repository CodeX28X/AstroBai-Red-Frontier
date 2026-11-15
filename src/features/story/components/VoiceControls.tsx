/* oxlint-disable react/only-export-components -- Provider and consumer hooks share one optional audio session. */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createAutoNarration, createDialogueSpeech } from '../data/speech'
import { createSoundEffects, type SoundCue } from '../data/sound'

interface AudioValue {
  muted: boolean; rate: number; effects: boolean; unlocked: boolean; supported: boolean; effectsSupported: boolean; status: string; scope: string;
  cancel: (id?: string) => void; play: (id: string,text: string,speaker: string) => void;
  automatic: (id: string,text: string,speaker: string,options: {enabled:boolean;unlocked:boolean;rate:number;visible:()=>boolean}) => void;
  mute: () => void; speed: (value: number) => void; toggleEffects: () => void; unlock: () => void; scene: (scope: string) => void; reset: () => void; effect: (cue: SoundCue,key?: string) => void;
}
const empty = () => {}
const AudioContextValue = createContext<AudioValue>({ muted:false,rate:.9,effects:true,unlocked:false,supported:false,effectsSupported:false,status:'Voice is unavailable on this device. Captions are always here.',scope:'',cancel:empty,play:empty,automatic:empty,mute:empty,speed:empty,toggleEffects:empty,unlock:empty,scene:empty,reset:empty,effect:empty })
function preferences() {
  try { const saved=JSON.parse(localStorage.getItem('astrobai.voice.v1')??'null'), old=JSON.parse(localStorage.getItem('astrobai.developerA.ui-settings.v1')??'null'); return {muted:saved?.muted===true,rate:[.75,.9,1.1].includes(saved?.rate)?Number(saved.rate):.9,effects:typeof saved?.effects==='boolean'?saved.effects:typeof old?.sound==='boolean'?old.sound:true} }
  catch { return {muted:false,rate:.9,effects:true} }
}
export function VoiceProvider({ children }: { children: ReactNode }) {
  const [prefs,setPrefs]=useState(preferences),[unlocked,setUnlocked]=useState(false),[scope,setScope]=useState(''),[status,setStatus]=useState('Voice starts after your first interaction.')
  const speech=useMemo(()=>typeof window!=='undefined'&&typeof window.speechSynthesis?.speak==='function'&&typeof window.SpeechSynthesisUtterance==='function'?createDialogueSpeech(window.speechSynthesis,text=>new SpeechSynthesisUtterance(text)):null,[])
  const narration=useMemo(()=>speech?createAutoNarration(speech,()=>window.speechSynthesis.getVoices().some(voice=>/^en(?:-|$)/i.test(voice.lang)),setStatus):null,[speech])
  const fx=useMemo(()=>createSoundEffects(()=>typeof window!=='undefined'&&typeof window.AudioContext==='function'?new AudioContext():null),[])
  const methods=useMemo(()=>({
    cancel:(id?:string)=>narration?.cancel(id),
    automatic:(id:string,text:string,speaker:string,options:{enabled:boolean;unlocked:boolean;rate:number;visible:()=>boolean})=>narration?.request({id,text,speaker},options),
    scene:(value:string)=>{narration?.cancel();setScope(value)},
    unlock:()=>{setUnlocked(true);void fx.unlock()},
    reset:()=>{narration?.reset();fx.stop()},
    effect:(cue:SoundCue,key?:string)=>fx.play(cue,key),
  }),[narration,fx])
  useEffect(()=>{fx.enable(prefs.effects);try{localStorage.setItem('astrobai.voice.v1',JSON.stringify(prefs))}catch{/* In-memory controls still work. */}},[prefs,fx])
  useEffect(()=>{
    const loaded=()=>narration?.voicesChanged()
    window.speechSynthesis?.addEventListener?.('voiceschanged',loaded)
    return()=>{window.speechSynthesis?.removeEventListener?.('voiceschanged',loaded);narration?.cancel();fx.dispose()}
  },[narration,fx])
  const value=useMemo<AudioValue>(()=>({...prefs,unlocked,scope,...methods,supported:!!speech,effectsSupported:typeof window!=='undefined'&&typeof window.AudioContext==='function',status:speech?status:'Voice is unavailable on this device. Captions are always here.',
    play:(id,text,speaker)=>{methods.unlock();if(!prefs.muted){narration?.cancel();speech?.play(id,text,speaker,prefs.rate,setStatus)}},
    mute:()=>{narration?.cancel();narration?.retryCurrent();setPrefs(previous=>({...previous,muted:!previous.muted}));setStatus(prefs.muted?'Voice enabled.':'Voice muted. Captions stay visible.')},
    speed:rate=>{narration?.cancel();setPrefs(previous=>({...previous,rate}));setStatus('Speed changed. Replay if you want to hear this line again.')},
    toggleEffects:()=>setPrefs(previous=>({...previous,effects:!previous.effects})),
  }),[prefs,unlocked,scope,methods,speech,narration,status])
  return <AudioContextValue.Provider value={value}><div className="audio-session" onPointerDownCapture={methods.unlock} onKeyDownCapture={event=>{if(['Enter',' '].includes(event.key))methods.unlock()}}>{children}</div></AudioContextValue.Provider>
}
export function useVoice(){return useContext(AudioContextValue)}
export function VoiceScene({scope}:{scope:string}){
  const {scene}=useVoice()
  useLayoutEffect(()=>{scene(scope)},[scope,scene])
  return null
}
function visibleCaption(node:HTMLElement|null){
  if(!node?.isConnected||!node.getClientRects().length||node.closest('[hidden]'))return false
  const modal=[...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1)
  if(modal&&!modal.contains(node))return false
  const overlays=[...document.querySelectorAll<HTMLElement>('.bai-feedback,.hud-guide')].filter(item=>item.getClientRects().length&&(!modal||modal.contains(item)))
  const overlay=overlays.at(-1)
  return !overlay||overlay.contains(node)
}
export function VoiceControls({id,text,speaker='bai'}:{id:string;text:string;speaker?:string}){
  const voice=useVoice(),element=useRef<HTMLDivElement>(null)
  const {automatic,cancel,muted,unlocked,rate,scope,supported}=voice
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>
    const activate=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(visibleCaption(element.current))automatic(id,text,speaker,{enabled:!muted,unlocked,rate,visible:()=>visibleCaption(element.current)});else cancel(id)},0)}
    const containers:HTMLDetailsElement[]=[]
    for(let details=element.current?.closest('details');details;details=details.parentElement?.closest('details'))containers.push(details)
    activate();containers.forEach(details=>details.addEventListener('toggle',activate))
    return()=>{clearTimeout(timer);containers.forEach(details=>details.removeEventListener('toggle',activate));cancel(id)}
  },[id,text,speaker,automatic,cancel,muted,unlocked,rate,scope])
  return <div ref={element} className="voice-controls" aria-label="Dialogue voice controls"><button type="button" disabled={!supported||muted} onClick={()=>voice.play(id,text,speaker)} aria-label="Replay current line">🔊 <span>{/could not|blocked/i.test(voice.status)?'Enable voice':'Replay'}</span></button><button type="button" disabled={!supported} aria-pressed={muted} onClick={voice.mute}>{muted?'Unmute voice':'Mute voice'}</button><label>Speed <select aria-label="Speech speed" disabled={!supported} value={rate} onChange={event=>voice.speed(Number(event.target.value))}><option value={.75}>Slow</option><option value={.9}>Steady</option><option value={1.1}>Quick</option></select></label><small role="status" className={/unavailable|could not|blocked/.test(voice.status)?'voice-status-error':'voice-status-quiet'}>{voice.status}</small></div>
}
export function AudioSettings(){
  const audio=useVoice()
  return <fieldset className="audio-settings"><legend>Audio</legend><button type="button" aria-pressed={!audio.muted} onClick={audio.mute}>Voice: {audio.muted?'Off':'On'}</button><button type="button" disabled={!audio.effectsSupported} aria-pressed={audio.effects} onClick={audio.toggleEffects}>Sound effects: {audio.effects?'On':'Off'}</button><p>Voice reads the subtitles. Sound effects are short game cues. Both are optional.</p>{!audio.supported&&<p>Voice is unavailable here; you can keep reading.</p>}</fieldset>
}
