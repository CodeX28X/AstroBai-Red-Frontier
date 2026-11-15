export const SOUND_PATTERNS = {
  tap: [420], selection: [520,660], open: [380,480], close: [480,380], review: [520,650,780], warning: [260,220], launch: [180,260,390,580], landing: [500,650,820], day: [420,560,700], recon: [700,950,700], expedition: [380,520,660], sample: [640,820], analysis: [600,760,920], discovery: [540,680,810,1080], production: [460,640],
} as const
export type SoundCue = keyof typeof SOUND_PATTERNS

/** Original low-volume synthesized tones. No downloads, music, or gameplay effects. */
export function createSoundEffects(createContext: () => AudioContext | null) {
  let context: AudioContext | null = null, unlocked = false, enabled = true, lastKey = '', lastTime = -Infinity, version = 0, cueEnds = -Infinity, cuePriority = -1
  const active = new Set<OscillatorNode>()
  const gains = new Set<GainNode>()
  function stop() { version++; cueEnds = -Infinity; cuePriority = -1; for (const node of active) { try { node.stop() } catch { /* Already stopped. */ } node.disconnect() } active.clear(); for(const gain of gains)gain.disconnect(); gains.clear() }
  async function unlock() { try { context ??= createContext(); if (!context) return; if (context.state === 'suspended') await context.resume(); unlocked = context.state === 'running' } catch { unlocked = false } }
  function play(cue: SoundCue, key: string = cue) {
    if (!enabled || !unlocked || !context || context.state !== 'running') return
    const audio = context, now = audio.currentTime
    const priority = cue === 'tap' ? 0 : cue === 'open' || cue === 'close' ? 1 : cue === 'selection' ? 2 : 3
    // A dialog closing must not cut off the launch or successful action it just confirmed.
    if (now < cueEnds && priority < cuePriority) return
    if ((key === lastKey && now - lastTime < 1) || (cue === 'tap' && now - lastTime < .09)) return
    lastKey = key; lastTime = now; stop()
    cuePriority = priority; cueEnds = now + SOUND_PATTERNS[cue].length * .065
    const token = version
    try {
      SOUND_PATTERNS[cue].forEach((frequency,index) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain(), start = now + index * .065
        oscillator.type = 'sine'; oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0,start); gain.gain.linearRampToValueAtTime(.018,start+.006); gain.gain.exponentialRampToValueAtTime(.0001,start+.055)
        oscillator.connect(gain); gain.connect(audio.destination); active.add(oscillator); gains.add(gain)
        oscillator.onended = () => { active.delete(oscillator); gains.delete(gain); oscillator.disconnect(); gain.disconnect(); if (version !== token) return }
        oscillator.start(start); oscillator.stop(start+.06)
      })
    } catch { stop() }
  }
  return { unlock, play, stop, enable(value: boolean) { enabled = value; if (!value) stop() }, dispose() { stop(); unlocked = false; const old = context; context = null; if (old && old.state !== 'closed') void old.close().catch(() => undefined) } }
}
