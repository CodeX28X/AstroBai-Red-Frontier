import { useEffect } from 'react'

export function ReadAloud({ text, enabled = true }: {readonly text: string;readonly enabled?: boolean}) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  useEffect(() => () => { if (supported) window.speechSynthesis.cancel() }, [supported])
  return <button className="a-read-aloud" type="button" disabled={!supported || !enabled} title={supported ? 'Read this aloud' : 'Read aloud is unavailable on this device'} onClick={() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en'; utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }}>♫ Read aloud</button>
}

export function Dialogue({ speaker, text, readAloud = true }: {readonly speaker: string;readonly text: string;readonly readAloud?: boolean}) {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const bubble = sentences.slice(0,2).join(' ')
  return <div className="a-chat"><div><strong>{speaker}</strong><ReadAloud text={bubble} enabled={readAloud}/></div><p>{bubble}</p>{sentences.length > 2 && <details><summary>Read more</summary><p>{text}</p></details>}</div>
}
