import { useState } from 'react'
import { useGame } from '../../shared/store/useGame.ts'
import type { GameAction } from '../../shared/types/game.ts'
import { selectIceboundView } from '../../shared/store/iceboundSelectors.ts'
import { PreparationPlaytest } from './PreparationPlaytest.tsx'
import { PlaytestMenu, LaunchPlaytest, LandingPlaytest, DebriefPlaytest } from './ProgressionPlaytest.tsx'
import { OutpostPlaytest } from './OutpostPlaytest.tsx'
import { Data } from './common.tsx'

export function PlaytestShell({ labPreset = false }: { labPreset?: boolean }) {
  const { state, dispatch } = useGame()
  const [actions, setActions] = useState<GameAction[]>([])
  const send = (action: GameAction) => { setActions(previous => [...previous.slice(-49), action]); dispatch(action) }
  const props = { state, send }
  return <main className="playtest"><h1>AstroBai development playtest</h1>
    <p>Temporary developer interface. Phase: {state.phase}. Sol: {state.sol}. Major slots: {state.actionsRemaining}.</p>
    <p>{labPreset ? 'TEST PRESET: installed laboratory and drilling capabilities. Not the default mission baseline.' : 'Default mission baseline — no laboratory or drill installed.'}</p>
    <nav><a href="./index.html">New default run</a> | <a href="./index.html?preset=installed-lab">New LAB/DRILL TEST PRESET</a></nav>
    <button onClick={() => send({ type: 'RESET_GAME' })}>Reset game</button>
    <section aria-label="Action feedback" role={state.feedback?.kind === 'error' ? 'alert' : 'status'}>
      {state.feedback?.message ?? 'Ready.'}{state.feedback?.analysis && <Data value={state.feedback.analysis}/>}
    </section>
    {state.phase === 'menu' && <PlaytestMenu {...props}/>}
    {state.phase === 'preparation' && <PreparationPlaytest {...props}/>}
    {state.phase === 'launch' && <LaunchPlaytest {...props}/>}
    {state.phase === 'landing' && <LandingPlaytest {...props}/>}
    {state.phase === 'outpost' && <OutpostPlaytest {...props}/>}
    {state.phase === 'debrief' && <DebriefPlaytest {...props}/>}
    <details><summary>Development diagnostics (read only)</summary>
      <h2>Recent dispatched intents (latest 50)</h2><Data value={actions}/>
      <p>Feedback above describes the latest result. The intent log includes accepted and rejected requests.</p>
      <h2>Objective status</h2><Data value={selectIceboundView(state).objectives}/>
      <h2>Completed action identifiers and slots</h2><Data value={{ spent: state.spentActionIds, applied: state.appliedResolutionIds, slots: state.actionsRemaining }}/>
      <h2>GameState inspector</h2><Data value={state}/>
    </details>
  </main>
}

