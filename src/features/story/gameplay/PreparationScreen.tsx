import { EQUIPMENT_CATALOG, calculateManifestSummary, PLAYER_MISSION_BASELINE, ICEBOUND_EQUIPMENT_CAPABILITIES } from '../../missions/index.ts'
import { StoryBackdrop } from '../components/StoryBackdrop.tsx'
import { ConfirmButton, ReviewNotes, type ScreenProps } from './ui.tsx'

export function PreparationScreen({ state, send }: ScreenProps) {
  const prep = state.preparation
  const summary = calculateManifestSummary(prep.manifest, prep.cargoCapacityUnits)
  const locked = prep.status === 'confirmed'
  const fieldTools = new Set(Object.keys(ICEBOUND_EQUIPMENT_CAPABILITIES))
  const cargoName = (id: string) => EQUIPMENT_CATALOG.find(item => item.id === id)?.name ?? id
  const itemCard = (item: typeof EQUIPMENT_CATALOG[number]) => {
    const quantity = prep.manifest.optionalCargo.find(entry => entry.equipmentId === item.id)?.quantity ?? 0
    const set = (amount: number) => send({ type: 'SET_EQUIPMENT_QUANTITY', equipmentId: item.id, quantity: amount })
    return <article key={item.id}><h2>{item.name}</h2><p>{item.description}</p>
      <small>{item.cargoMassUnits} spaces each · pack up to {item.maxQuantity}</small>
      {!!item.dependencies.length && <p>Also pack: {item.dependencies.map(cargoName).join(', ')}.</p>}
      <label>Pack {item.name.toLowerCase()}<span className="mvp-quantity">
        <button type="button" aria-label={'Remove one ' + item.name} disabled={locked || quantity === 0} onClick={() => set(quantity - 1)}>−</button>
        <input aria-label={'Quantity of ' + item.name} type="number" min="0" max={item.maxQuantity} step="1" value={quantity} disabled={locked} onChange={e => set(Number(e.target.value))}/>
        <button type="button" aria-label={'Add one ' + item.name} disabled={locked || quantity === item.maxQuantity} onClick={() => set(quantity + 1)}>+</button>
      </span></label>
    </article>
  }
  return <section aria-labelledby="packing-title">
    <StoryBackdrop artwork="launch-pad-simple" className="mvp-stage-art"><header><p>1 · Get ready</p><h1 id="packing-title">Pack for Mars</h1></header></StoryBackdrop>
    <div className="mvp-panel"><p>{PLAYER_MISSION_BASELINE}</p>
      <p>Choose your field tools below. Ask for a packing check, then lock your bag when you are ready.</p>
      <p className="mvp-cargo" role="status"><strong>{summary.totalCargoMassUnits} / {prep.cargoCapacityUnits} spaces filled</strong> · {summary.remainingCapacityUnits} spaces left</p>
      <progress aria-label="Cargo space used" max={prep.cargoCapacityUnits} value={Math.min(summary.totalCargoMassUnits, prep.cargoCapacityUnits)}/>
      <h2>Tools for exploring</h2><div className="mvp-catalog">{EQUIPMENT_CATALOG.filter(item => fieldTools.has(item.id)).map(itemCard)}</div>
      <details><summary>Other cargo</summary><p>These optional items do not add extra powers in this mission. Base-care jobs use the equipment already at your Mars base.</p>
        <div className="mvp-catalog">{EQUIPMENT_CATALOG.filter(item => !fieldTools.has(item.id)).map(itemCard)}</div>
      </details>
      <div className="a-button-row"><button type="button" disabled={locked} onClick={() => send({ type: 'REVIEW_MANIFEST' })}>Check my packing</button>
        <ConfirmButton disabled={locked || prep.reviewedRevision !== prep.revision || !prep.latestReview?.allowed}
          question="Lock this bag? You will not be able to swap tools during this mission." onConfirm={() => send({ type: 'CONFIRM_MANIFEST' })}>Lock my cargo</ConfirmButton>
        <button type="button" className="a-primary" disabled={!locked} onClick={() => send({ type: 'BEGIN_LAUNCH' })}>Go to launch</button></div>
      {!locked && <p>Fix anything on the check’s “Things to fix” list before locking your bag. Other tips will not stop launch.</p>}
      {locked && <p>Your cargo is confirmed and locked. You are ready for launch.</p>}
      {prep.latestReview && <><ReviewNotes title="Things to fix" items={prep.latestReview.blockers}/>
        <ReviewNotes title="Things to watch" items={prep.latestReview.warnings}/><ReviewNotes title="Helpful ideas" items={prep.latestReview.recommendations}/></>}
      <details><summary>What do these tools do?</summary><p>The rover looks for clues and carries tools. The repair toolkit helps collect surface samples.
        Containers keep samples safe. The soil kit helps you understand a sample. The oxygen kit helps astronauts work outside.</p>
        <p>Cargo spaces and supply numbers are game units, not real measurements.</p></details>
    </div>
  </section>
}

