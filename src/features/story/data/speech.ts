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
      const voices = synthesis.getVoices().filter(voice => voice.lang.startsWith('en'))
      if (voices.length) utterance.voice = voices[(speaker === 'bai' ? 0 : speaker === 'kofi' ? 1 : 2) % voices.length]
      utterance.onstart = () => { if (generation === token) status('Speaking') }
      utterance.onend = () => { if (generation === token) { owner = null; status('Ready to replay') } }
      utterance.onerror = () => { if (generation === token) { owner = null; status('Voice could not play. You can keep reading.') } }
      status('Starting voice…')
      synthesis.speak(utterance)
    } catch { owner = null; status('Voice could not play. You can keep reading.') }
  }
  return { play, cancel }
}
