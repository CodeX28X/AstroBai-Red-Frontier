import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import './experience.css'

export function Dialog({ title, onClose, children, hero = false }: {readonly title: string;readonly onClose: () => void;readonly children: ReactNode;readonly hero?: boolean}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close() }, [])
  return <dialog ref={dialog} className={`a-dialog${hero ? ' a-hero-dialog' : ''}`} aria-label={title} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose() } }} onCancel={event => { event.preventDefault(); onClose() }}>
    <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label={`Close ${title}`}>×</button></header>{children}
  </dialog>
}
