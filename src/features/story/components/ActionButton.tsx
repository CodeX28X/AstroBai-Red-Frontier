import { useId, type ComponentPropsWithRef } from 'react'
import { useActionFeedback } from './ActionFeedback'

/** aria-disabled keeps blocked actions discoverable to pointer, touch and keyboard users. */
export function ActionButton({ blockedReason, onClick, children, ...props }: ComponentPropsWithRef<'button'> & { blockedReason?: string }) {
  const id = useId(), feedback = useActionFeedback()
  return <span className="action-control"><button {...props} type="button" aria-disabled={!!blockedReason} aria-describedby={blockedReason ? id : undefined} title={blockedReason} onClick={event => { if (blockedReason) feedback(String(props['aria-label'] ?? event.currentTarget.textContent ?? 'Try this action'), blockedReason); else onClick?.(event) }}>{children}</button>{blockedReason && <small id={id} className="action-reason">{blockedReason}</small>}</span>
}
