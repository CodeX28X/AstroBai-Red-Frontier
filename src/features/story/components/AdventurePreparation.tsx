import { useRef } from 'react'
import { CharacterDialogue } from './CharacterDialogue'
import type { GameAction, GameState } from '../../../shared/types/game'
import { calculateManifestSummary } from '../../missions/engine/preparation/calculateManifestSummary'
import { SCIENCE_KIT_IDS, SCIENCE_KIT_SPACE, SUPPLY_BALANCE, SUPPLY_ITEMS, supplyReserves, supplySpace } from '../../missions/data/supplyBalance'
import { ResourceIcon } from '../../../shared/components/ResourceIcon'
import { EquipmentIllustration } from '../../../shared/components/EquipmentIllustration'
import { EQUIPMENT_CATALOG } from '../../missions/data/equipmentCatalog'
import { LegacyPreparation } from './LegacyPreparation'

export function AdventurePreparation({ state, dispatch }: { state: GameState; dispatch: (a: GameAction) => void }) {
  const actionRef = useRef<HTMLButtonElement>(null)
  const p = state.preparation
  if (!p.supplies) return <LegacyPreparation state={state} dispatch={dispatch}/>
  const selected = p.supplies, locked = p.status === 'confirmed'
  const mass = calculateManifestSummary(p.manifest, p.cargoCapacityUnits).totalCargoMassUnits + supplySpace(selected)
  const kitPacked = SCIENCE_KIT_IDS.every(id => p.manifest.optionalCargo.some(entry => entry.equipmentId === id))
  const issue = p.latestReview?.blockers[0]
  const dialogueId = `preparation.${locked ? 'confirmed' : p.status}`
  const missing = SUPPLY_ITEMS.find(item => issue?.code === `supply-${item.id}-low`)
  function adjust(supplyId: typeof SUPPLY_ITEMS[number]['id'], quantity: number) {
    dispatch({ type: 'SET_SUPPLY_QUANTITY', supplyId, quantity })
    if (p.latestReview) dispatch({ type: 'REVIEW_MANIFEST' })
  }
  function freeSpace() {
    const item = [...SUPPLY_ITEMS].sort((a,b) => selected[b.id] - selected[a.id])[0]
    document.querySelector<HTMLButtonElement>(`[data-supply="${item.id}"] button`)?.focus()
  }
  function suggested() {
    for (const item of SUPPLY_ITEMS) dispatch({ type: 'SET_SUPPLY_QUANTITY', supplyId: item.id, quantity: 0 })
    for (const item of SUPPLY_ITEMS) dispatch({ type: 'SET_SUPPLY_QUANTITY', supplyId: item.id, quantity: SUPPLY_BALANCE.suggested[item.id] })
  }
  return <section className="adventure-preparation supply-preparation">
    <header><div><span className="overline">EARTH / PREPARATION</span><h1>Pack for a big adventure</h1><p>Choose your supplies. Each unit becomes one mission resource.</p></div><div className="cargo-meter"><strong>{mass} / {p.cargoCapacityUnits}</strong><span>cargo spaces used</span><progress max={p.cargoCapacityUnits} value={mass} aria-label="Cargo space used"/></div></header>
    <div className="prep-content supply-content">
      <div className="supply-cards">{SUPPLY_ITEMS.map(item => <article key={item.id} className={`supply-card${missing?.id === item.id ? ' supply-needs-help' : ''}`} data-supply={item.id}>
        <ResourceIcon resource={item.id} size={120} className="supply-art"/>
        <h2>{item.name}</h2><p>{item.benefit}</p><small>1 cargo space each</small>
        <div className="quantity-control"><button type="button" aria-label={`Remove ${item.name}`} disabled={locked || selected[item.id] === 0} onClick={() => adjust(item.id, selected[item.id] - 1)}>−</button><output aria-label={`${item.name} quantity`}>{selected[item.id]}/{SUPPLY_BALANCE.maxQuantity}</output><button type="button" aria-label={`Pack ${item.name}`} disabled={locked || selected[item.id] === SUPPLY_BALANCE.maxQuantity || mass >= p.cargoCapacityUnits} onClick={() => adjust(item.id, selected[item.id] + 1)}>+</button></div>
      </article>)}</div>
      <aside className="supply-planning">
        {p.latestReview?.warnings[0] && <p role="status"><strong>Helpful Tip:</strong> {p.latestReview.warnings[0].explanation}</p>}
        <section className="science-kit-choice"><label><input type="checkbox" checked={kitPacked} disabled={locked || !kitPacked && p.cargoCapacityUnits - mass < SCIENCE_KIT_SPACE} onChange={e => dispatch({ type: 'SET_SCIENCE_KIT', packed: e.target.checked })}/><span><strong>ICEBOUND science kit</strong><small>{SCIENCE_KIT_SPACE} cargo spaces · optional</small></span></label><p>Optional tools improve sample handling and evidence quality.</p>{!kitPacked && p.cargoCapacityUnits - mass < SCIENCE_KIT_SPACE && <p>Need room? Use suggested supplies to leave space for this kit.</p>}<details><summary>What is in the kit?</summary><div className="equipment-kit-art">{SCIENCE_KIT_IDS.map(id=><span key={id} title={EQUIPMENT_CATALOG.find(item=>item.id===id)?.name}><EquipmentIllustration equipmentId={id}/></span>)}</div><p>Field Rover, Repair Toolkit, Soil Analysis Kit, Sample Container Set and Portable Oxygen Kit. Standard outpost equipment already supports the full investigation.</p><p>Only this selected kit uses extra cargo space.</p></details></section>
        <section className="preparation-review"><h2>{issue ? '△ Needs Fixing' : p.latestReview ? '✓ Ready' : 'Mission Control'}</h2><p role="status">{missing && mass >= p.cargoCapacityUnits ? `Cargo is full. Remove an extra pack, then add ${missing.name}.` : issue?.explanation ?? (p.latestReview ? 'Our supplies are checked. Ready to confirm!' : 'Adjust your supplies. Then check your plan.')}</p>{p.latestReview?.recommendations[0] && <p><strong>Helpful Tip:</strong> {p.latestReview.recommendations[0].explanation}</p>}<button type="button" disabled={locked} onClick={suggested}>Use suggested supplies</button><p>Suggestion: {SUPPLY_BALANCE.suggested.power} energy, {SUPPLY_BALANCE.suggested.oxygen} oxygen, {SUPPLY_BALANCE.suggested.water} water, {SUPPLY_BALANCE.suggested.food} food.</p></section>
        <details className="reserve-details"><summary>Supplies and starting reserves</summary><p>Preparation starts with {SUPPLY_BALANCE.suggested.power} of each supply selected. Each selected unit becomes exactly one resource unit, with no extra starter reserves.</p><p>After confirmation: {SUPPLY_ITEMS.map(item => `${item.name.replace(' Pack','').replace(' Tank','').replace(' Container','')}: ${supplyReserves(selected)[item.id]}/10`).join(' · ')}.</p><p>These are fictional balancing values. Mission operations use the real resource rules.</p></details>
      </aside>
    </div>
    <footer><CharacterDialogue key={dialogueId} guide={{ id: dialogueId, speakerId: 'bai', speakerName: 'BAI', objectiveId: 'preparation', title: '', actionLabel: 'Continue', text: locked ? 'Supplies secured. Next stop: Mars!' : missing ? `Let’s add one ${missing.name.toLowerCase()}.` : 'Choose your supplies. We will check the plan together.' }} completed={state.guidance.completedDialogueIds.includes(dialogueId)} onComplete={dialogueId => dispatch({ type: 'ACKNOWLEDGE_DIALOGUE', dialogueId })} actionRef={actionRef}/>{locked ? <button ref={actionRef} className="primary" type="button" onClick={() => dispatch({ type: 'BEGIN_LAUNCH' })}>Go to launch →</button> : missing && mass >= p.cargoCapacityUnits ? <button ref={actionRef} className="primary" type="button" onClick={freeSpace}>Free a cargo space</button> : missing ? <button ref={actionRef} className="primary" type="button" onClick={() => adjust(missing.id, selected[missing.id] + 1)}>Add {missing.name}</button> : p.status === 'reviewed' && p.latestReview?.allowed ? <button ref={actionRef} className="primary" type="button" onClick={() => dispatch({ type: 'CONFIRM_MANIFEST' })}>Confirm cargo</button> : <button ref={actionRef} className="primary" type="button" onClick={() => dispatch({ type: 'REVIEW_MANIFEST' })}>Check with Mission Control</button>}</footer>
  </section>
}

