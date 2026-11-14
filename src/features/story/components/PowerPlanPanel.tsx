import { useId, useState } from 'react'
import type { PowerDraft, PowerView } from '../types/experience'
import { Dialog } from './Dialog'

export function PowerPlanPanel({ view, onChange, onConfirm }: {readonly view: PowerView;readonly onChange: (draft: PowerDraft) => void;readonly onConfirm: (draft: PowerDraft) => void}) {
  const draft = view.plan
  const [confirming, setConfirming] = useState(false)
  const sliderId = useId()
  function change(plan: PowerDraft) { onChange(plan) }
  // No power/resource validation or efficiency formulas here: C supplies validation.
  return <div className="a-power-panel">
    <p className="a-budget">Total available: <strong>{view.budget}</strong> · Allocated: <strong>{view.validation.allocated ?? '—'}</strong> · Remaining: <strong>{view.validation.remaining ?? '—'}</strong></p>
    <div className="a-preset-grid">{view.presets.map(preset => <button key={preset.label} type="button" aria-pressed={view.channels.every(channel => draft[channel.id] === preset.plan[channel.id])} onClick={() => change(preset.plan)}><strong>{preset.label}</strong><span>{preset.note}</span><small>{view.channels.map(channel => `${channel.label}: ${preset.plan[channel.id]}`).join(' · ')}</small></button>)}</div>
    <details><summary>Engineer’s Panel · five sliders</summary><div className="a-sliders">{view.channels.map(channel => <label key={channel.id} htmlFor={`${sliderId}-${channel.id}`}>{channel.label} <output aria-hidden="true">{draft[channel.id]}</output><input id={`${sliderId}-${channel.id}`} type="range" min={channel.min} max={channel.max} step="1" value={draft[channel.id]} onChange={event => change({...draft,[channel.id]:Number(event.target.value)})}/></label>)}</div></details>
    {view.validation.warnings.length > 0 && <ul className="a-warning-list" role="status">{view.validation.warnings.map(warning => <li key={warning}>! {warning}</li>)}</ul>}
    {view.swapProposal && <div><p>{view.swapProposal.explanation}</p><button type="button" onClick={() => change(view.swapProposal!.plan)}>Swap power from Greenhouse</button></div>}
    <div className="a-button-row"><button type="button" onClick={() => change(view.presets[0].plan)}>Reset</button><button type="button" onClick={() => setConfirming(true)} disabled={!view.validation.valid}>Confirm plan</button></div>
    <details><summary>Compare plans</summary>{view.comparison && <p>{view.comparison}</p>}<table><thead><tr><th>Equipment</th><th>Your plan</th><th>Recommended</th><th>Change</th></tr></thead><tbody>{view.channels.map(channel => <tr key={channel.id}><td>{channel.label}</td><td>{draft[channel.id]}</td><td>{view.presets[0].plan[channel.id]}</td><td>{draft[channel.id] > view.presets[0].plan[channel.id] ? '↑ More' : draft[channel.id] < view.presets[0].plan[channel.id] ? '↓ Less' : '= Same'}</td></tr>)}</tbody></table></details>
    {confirming && <Dialog title="Confirm power plan" onClose={() => setConfirming(false)}><p>{view.validation.warnings.length ? 'Some machines are below recommended. Confirm anyway?' : 'Confirm this plan? Effects start when the sol advances.'}</p><div className="a-button-row"><button type="button" onClick={() => {onConfirm(draft);setConfirming(false)}}>Confirm plan</button><button type="button" onClick={() => setConfirming(false)}>Go back</button></div></Dialog>}
  </div>
}
