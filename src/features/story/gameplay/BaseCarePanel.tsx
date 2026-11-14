import { OUTPOST_OPERATIONS, reviewOutpostOperation } from '../../simulation/outpostSimulation.ts'
import type { OutpostOperationId } from '../../../shared/types/survival.ts'
import { resourceNames } from './labels.ts'
import type { ScreenProps } from './ui.tsx'

export function BaseCarePanel({ state, send, operation }: ScreenProps & { operation?: OutpostOperationId }) {
  const ids = operation ? [operation] : Object.keys(OUTPOST_OPERATIONS) as OutpostOperationId[]
  return <section className="mvp-room-jobs" aria-label="Base-care jobs"><h2>Care for your base</h2>
    <p>Each job uses one of your two big jobs today. Looking around is free.</p>
    <div className="mvp-care-grid">{ids.map(id => {
      const job = OUTPOST_OPERATIONS[id]
      const review = reviewOutpostOperation(state, id)
      const gains = Object.entries(job.gains).map(([key, amount]) => resourceNames[key as keyof typeof state.resources] + ' +' + amount).join(' · ')
      const cost = Object.entries(job.cost).map(([key, amount]) => resourceNames[key as keyof typeof state.resources] + ' −' + amount).join(' · ')
      return <article key={id}><h3>{job.title}</h3><p>{job.description}</p>
        <small>Up to {gains}{cost ? ' · Uses ' + cost : ''} · 1 big job</small>
        <button type="button" className="a-primary" disabled={!review.allowed}
          onClick={() => send({ type: 'OUTPOST_OPERATION', operation: id, expectedSol: state.sol })}>{job.title}</button>
        {!review.allowed && <p className="mvp-help">{review.reason}</p>}
      </article>
    })}</div>
  </section>
}

