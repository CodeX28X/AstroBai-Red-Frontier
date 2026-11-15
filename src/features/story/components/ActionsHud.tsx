import type { GameState } from '../../../shared/types/game'
export function ActionsHud({ state, highlighted }: { state: GameState; highlighted?: boolean }) {
  return <section className={`actions-hud${highlighted ? ' is-guided' : ''}`} aria-label="Daily Actions"><strong>Actions Left: {state.actionsRemaining} / {state.actionLimits.maxActionsPerSol}</strong><span className="action-symbols">{Array.from({ length: state.actionLimits.maxActionsPerSol }, (_, i) => <span key={i} role="img" aria-label={`Action ${i + 1}: ${i < state.actionsRemaining ? 'available' : 'used'}`} className={i < state.actionsRemaining ? 'action-filled' : 'action-used'}>{i < state.actionsRemaining ? '◆' : '◇'}</span>)}</span></section>
}
