import { useState, type ReactNode } from 'react'
import { resourceNames } from './labels.ts'
import { Dialog } from '../components/Dialog.tsx'
import type { GameAction, GameState, Resources } from '../../../shared/types/game.ts'
export interface ScreenProps { state: GameState; send: (action: GameAction) => void }
export function ResourceCards({ resources }: { resources: Resources }) {
  return <dl className="mvp-resources">{Object.entries(resources).map(([key, value]) => <div key={key}><dt>{resourceNames[key as keyof Resources]}</dt><dd>{value}</dd></div>)}</dl>
}
export function Costs({ resources, slots = 0 }: { resources: Partial<Resources>; slots?: number }) {
  return <span>{Object.entries(resources).map(([key, value]) => resourceNames[key as keyof Resources] + ' ' + value).join(' · ') || 'No supplies spent'} · {slots === 0 ? 'No big job needed' : slots + (slots === 1 ? ' big job' : ' big jobs')}</span>
}
export function ReviewNotes({ title, items }: { title: string; items: readonly { explanation: string }[] }) {
  if (!items.length) return null
  return <section className="mvp-notes"><h3>{title}</h3><ul>{items.map((item, i) => <li key={i}>{item.explanation}</li>)}</ul></section>
}
export function ConfirmButton({ children, question, onConfirm, disabled = false }: {
  children: ReactNode; question: string; onConfirm: () => void; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  return <><button type="button" disabled={disabled} onClick={() => setOpen(true)}>{children}</button>
    {open && <Dialog title="Check your choice" onClose={() => setOpen(false)}><p>{question}</p><div className="a-button-row">
      <button type="button" onClick={() => { setOpen(false); onConfirm() }}>Confirm</button>
      <button type="button" onClick={() => setOpen(false)}>Keep planning</button></div></Dialog>}</>
}

