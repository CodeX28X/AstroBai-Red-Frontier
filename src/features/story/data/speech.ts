/** Voice names are preferences, not gender metadata or a guarantee about a platform voice. */
export function preferredEnglishVoice(voices: SpeechSynthesisVoice[], speaker = 'bai') {
  const english = voices.filter(voice => /^en(?:-|$)/i.test(voice.lang))
  const preferences = [/jenny.*natural|aria.*natural|sonia.*natural/i, /samantha.*enhanced|ava.*premium/i, /google.*english.*female/i, /\b(jenny|aria|sonia|samantha|zira|karen|moira|tessa|serena|ava)\b/i]
  if (speaker === 'bai') for (const name of preferences) { const voice = english.find(voice => name.test(voice.name)); if (voice) return voice }
  return english[speaker === 'kofi' && english.length > 1 ? 1 : 0]
}

/** Small injectable adapter so speech lifecycle can be verified without a real audio device. */
export function createDialogueSpeech(synthesis: Pick<SpeechSynthesis, 'cancel' | 'speak' | 'getVoices'>, makeUtterance: (text: string) => SpeechSynthesisUtterance) {
  let owner: string | null = null, generation = 0
  function cancel(id?: string) { if (id && owner !== id) return; generation++; owner = null; synthesis.cancel() }
  function play(id: string, text: string, speaker: string, rate: number, status: (message: string) => void) {
    cancel()
    owner = id
    const token = generation
    try {
      const utterance = makeUtterance(text.replace(/\bBAI\b/g, 'Bay').replace(/\bDr\./g, 'Doctor'))
      utterance.lang = 'en'; utterance.rate = rate
      const voice = preferredEnglishVoice(synthesis.getVoices(), speaker)
      if (voice) utterance.voice = voice
      utterance.onstart = () => { if (generation === token) status('Speaking') }
      utterance.onend = () => { if (generation === token) { owner = null; status('Ready to replay') } }
      utterance.onerror = () => { if (generation === token) { owner = null; status('Voice could not play. You can keep reading.') } }
      status('Starting voice…')
      synthesis.speak(utterance)
    } catch { owner = null; status('Voice could not play. You can keep reading.') }
  }
  return { play, cancel }
}

export interface NarrationLine { id: string; text: string; speaker: string }
/** One pending caption, with bounded asynchronous voice loading and session deduplication. */
export function createAutoNarration(speech: ReturnType<typeof createDialogueSpeech>, voicesReady: () => boolean, status: (text: string) => void, timers = { set: (run: () => void, delay: number) => setTimeout(run, delay), clear: (id: ReturnType<typeof setTimeout>) => clearTimeout(id) }) {
  let timer: ReturnType<typeof setTimeout> | undefined, pending: (() => void) | undefined, owner: string | undefined
  let lastContent = ''
  const heard = new Set<string>()
  function cancel(id?: string) { if (id && owner !== id) { speech.cancel(id); return } if (timer !== undefined) timers.clear(timer); timer = undefined; pending = undefined; speech.cancel(id); owner = undefined }
  function request(line: NarrationLine, options: { enabled: boolean; unlocked: boolean; rate: number; visible: () => boolean }) {
    cancel(); owner = line.id
    if (!options.enabled || !options.unlocked) return
    const content = `${line.speaker}:${line.text}`, key = `${line.id}:${content}`
    if (heard.has(key) || lastContent === content) return
    const run = () => {
      pending = undefined; timer = undefined
      if (!options.visible()) return
      heard.add(key); lastContent = content
      if (heard.size > 200) heard.delete(heard.values().next().value!)
      speech.play(line.id, line.text, line.speaker, options.rate, status)
    }
    pending = run
    timer = timers.set(run, voicesReady() ? 0 : 250)
  }
  return { request, cancel, voicesChanged() { if (pending && voicesReady()) { if (timer !== undefined) timers.clear(timer); pending() } }, reset() { cancel(); heard.clear(); lastContent = '' }, retryCurrent() { heard.clear(); lastContent = '' } }
}
