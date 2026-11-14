import './app.css'
import { STORY_DECISIONS } from '../features/missions/storyDecisions.ts'
import { useGame } from '../shared/store/useGame.ts'

export function LegacyOpeningApp() {
  const { state, dispatch } = useGame()
  const choices = STORY_DECISIONS.filter((decision) => decision.phase === state.phase)

  return (
    <main className="setup-screen">
      <p className="eyebrow">AstroBai · Red Frontier · Opening story</p>
      <h1>Mission control</h1>
      <p className="intro">
        Make a few choices to prepare the crew for its journey to Mars. These are
        development values; no resource simulation is active yet.
      </p>

      <section aria-labelledby="state-heading" className="team-card">
        <h2 id="state-heading">Current mission state</h2>
        <dl className="state-grid">
          <div><dt>Phase</dt><dd>{state.phase}</dd></div>
          <div><dt>Sol</dt><dd>{state.sol}</dd></div>
        </dl>
        <h3>Resources</h3>
        <dl className="resource-grid">
          {Object.entries(state.resources).map(([name, value]) => (
            <div key={name}><dt>{name}</dt><dd>{value}</dd></div>
          ))}
        </dl>

        {state.phase === 'menu' && (
          <button className="primary-action" type="button" onClick={() => dispatch({ type: 'START_GAME' })}>
            Start Game
          </button>
        )}

        {choices.length > 0 && (
          <div className="choice-list" aria-labelledby="choices-heading">
            <h3 id="choices-heading">Choose for this chapter</h3>
            {choices.map((decision) => (
              <button
                className="choice-card"
                key={decision.id}
                type="button"
                onClick={() => dispatch({ type: 'CHOOSE_STORY_OPTION', optionId: decision.id })}
              >
                <span className="choice-title">{decision.title}</span>
                <span>{decision.description}</span>
              </button>
            ))}
          </div>
        )}

        {state.phase === 'outpost' && (
          <p className="completion-message">The crew has landed. The opening story is complete.</p>
        )}
      </section>

      <p
        className={`feedback ${state.feedback?.kind ?? ''}`}
        role={state.feedback?.kind === 'error' ? 'alert' : 'status'}
        aria-live="polite"
      >
        {state.feedback?.message ?? 'Choose a path to begin the mission.'}
      </p>
      <button className="reset-action" type="button" onClick={() => dispatch({ type: 'RESET_GAME' })}>
        Reset Game
      </button>
    </main>
  )
}
