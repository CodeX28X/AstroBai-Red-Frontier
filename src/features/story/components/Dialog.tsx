import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import './experience.css'
import { useVoice } from './VoiceControls'

export function Dialog({ title, onClose, children, hero = false }: {readonly title: string;readonly onClose: () => void;readonly children: ReactNode;readonly hero?: boolean}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const { effect, cancel } = useVoice()
  useEffect(() => {
    const node = dialog.current, previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    node?.showModal(); cancel(); effect('open', `open:${title}`)
    return () => {
      node?.close(); cancel(); effect('close', `close:${title}`)
      queueMicrotask(() => {
        if(previous?.isConnected){previous.focus({preventScroll:true});return}
        const modal=[...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1)
        const target=modal?.querySelector<HTMLElement>('button.primary,button,input,select')??document.querySelector<HTMLElement>('.adventure-preparation footer .primary,.guided-action button')
        target?.focus({preventScroll:true})
      })
    }
  }, [title, effect, cancel])
  return <dialog ref={dialog} className={`a-dialog${hero ? ' a-hero-dialog' : ''}`} aria-label={title} onKeyDown={event=>{
    if(event.key!=='Tab'||(event.target as Element).closest('dialog')!==event.currentTarget)return
    event.stopPropagation()
    const targets=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')].filter(node=>node.getClientRects().length)
    const first=targets[0],last=targets.at(-1)
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose() } }} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose() }}>
    <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label={`Close ${title}`}>×</button></header>{children}
  </dialog>
}
