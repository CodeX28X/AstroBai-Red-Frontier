import { EQUIPMENT_CATALOG, calculateManifestSummary } from '../missions/index.ts'
import { Data, Issues, type StageProps } from './common.tsx'

export function PreparationPlaytest({ state, send }: StageProps) {
  const p = state.preparation
  const locked = p.status === 'confirmed'
  const summary = calculateManifestSummary(p.manifest, p.cargoCapacityUnits)
  return <section><h2>Preparation</h2>
    <p>Status: {p.status}; revision {p.revision}. Cargo {summary.totalCargoMassUnits}/{p.cargoCapacityUnits} abstract units; remaining {summary.remainingCapacityUnits}.</p>
    <div className="equipment">{EQUIPMENT_CATALOG.map(item => {
      const quantity = p.manifest.optionalCargo.find(entry => entry.equipmentId === item.id)?.quantity ?? 0
      return <article key={item.id}><h3>{item.name}</h3><p>{item.description}</p>
        <p>Mass: {item.cargoMassUnits}; maximum: {item.maxQuantity}. Dependencies: {item.dependencies.join(', ') || 'none'}.</p>
        <label>Quantity for {item.name}<input type="number" min="0" max={item.maxQuantity} step="1" value={quantity} disabled={locked}
          onChange={e => send({ type: 'SET_EQUIPMENT_QUANTITY', equipmentId: item.id, quantity: Number(e.target.value) })}/></label>
      </article>
    })}</div>
    <button disabled={locked} onClick={() => send({ type: 'REVIEW_MANIFEST' })}>Review manifest</button>
    <button disabled={locked || p.reviewedRevision !== p.revision || !p.latestReview?.allowed} onClick={() => send({ type: 'CONFIRM_MANIFEST' })}>Confirm manifest</button>
    <button disabled={!locked} onClick={() => send({ type: 'BEGIN_LAUNCH' })}>Begin launch</button>
    {p.latestReview && <><Issues title="Blockers" items={p.latestReview.blockers}/><Issues title="Warnings" items={p.latestReview.warnings}/>
      <Issues title="Recommendations" items={p.latestReview.recommendations}/><details><summary>Baseline assumptions and positive feedback</summary><Data value={p.latestReview}/></details></>}
  </section>
}

