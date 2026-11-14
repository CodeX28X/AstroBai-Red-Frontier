import type { ReactNode } from 'react'
import './story.css'

// A owns the surrounding screen. B provides the map as children, avoiding a copy.
export function OutpostSlot({ children, heading, toolbar, details }: { readonly children: ReactNode; readonly heading: string; readonly toolbar?: ReactNode; readonly details?: ReactNode }) {
  return <section className="a-story-outpost" aria-label={heading}>
    <header><h1>{heading}</h1>{toolbar}</header>
    <div className="a-story-outpost-map">{children}</div>
    {details && <aside aria-label="Selected location details">{details}</aside>}
  </section>
}
