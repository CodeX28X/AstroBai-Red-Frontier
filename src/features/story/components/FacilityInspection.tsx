import type { Ref } from 'react'
import type { FacilityId, ScienceSite } from '../../mars-map'
import { facilityLabels, facilityPurpose } from '../data/facilityCopy'

/** Free inspection/navigation. This component never dispatches a gameplay action. */
export function FacilityInspection({ facilityId, statusLine, site, onClose, onEnter, enterButtonRef }: {
  readonly facilityId: FacilityId | null
  readonly statusLine?: string
  readonly site?: ScienceSite
  readonly onClose: () => void
  readonly onEnter: (id: FacilityId) => void
  readonly enterButtonRef?: Ref<HTMLButtonElement>
}) {
  if (!facilityId && !site) return null
  const label=facilityId ? facilityLabels[facilityId] : site!.label
  return <aside className="a-inspection">
    <button type="button" className="a-close" aria-label="Close inspection" onClick={onClose}>×</button>
    <h2>{label}</h2>
    <p>{facilityId ? facilityPurpose[facilityId] : `${site!.status} · Looking is free.`}</p>
    <p>{facilityId ? statusLine : site?.assignment}</p>
    <small>Looking is always free.</small>
    {facilityId && <button ref={enterButtonRef} type="button" className="a-primary a-enter-facility" onClick={() => onEnter(facilityId)}>Enter {label} →</button>}
  </aside>
}
