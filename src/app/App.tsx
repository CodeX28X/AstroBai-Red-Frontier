import './app.css'
import { useGame } from '../shared/store/useGame.ts'

export default function App() {
  const { state, dispatch } = useGame()
  const isTerminal = state.outcome !== null || state.phase === 'debrief'

  return (
    <main className="setup-screen">
      <p className="eyebrow">AstroBai · Red Frontier · Phase 2</p>
      <h1>Shared state test screen</h1>
      <p className="intro">
        A temporary development screen for checking the shared game state. Sol
        advancement does not consume resources yet.
      </p>
      <section aria-labelledby="state-heading" className="team-card">
        <h2 id="state-heading">Current game state</h2>
        <dl className="state-grid">
          <div><dt>Phase</dt><dd>{state.phase}</dd></div>
          <div><dt>Sol</dt><dd>{state.sol} / {state.actionLimits.maxSol}</dd></div>
        </dl>
        <h3>Resources</h3>
        <dl className="resource-grid">
          {Object.entries(state.resources).map(([name, value]) => (
            <div key={name}><dt>{name}</dt><dd>{value}</dd></div>
          ))}
        </dl>
        <div className="actions">
          <button type="button" onClick={() => dispatch({ type: 'START_GAME' })} disabled={state.phase !== 'menu'}>
            Start Game
          </button>
          <button type="button" onClick={() => dispatch({ type: 'ADVANCE_SOL' })} disabled={state.phase === 'menu' || isTerminal || state.sol >= state.actionLimits.maxSol}>
            Advance Sol
          </button>
          <button type="button" onClick={() => dispatch({ type: 'RESET_GAME' })}>
            Reset Game
          </button>
        </div>
      </section>
      <p className="status">Development check · No mission or resource rules implemented</p>
    </main>
  )
}
