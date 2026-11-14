import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../../shared/store/useGame.ts'
import { MainMenu } from '../components/MainMenu.tsx'
import { Dialog } from '../components/Dialog.tsx'
import { useUiSettings } from '../components/useUiSettings.ts'
import { PreparationScreen } from './PreparationScreen.tsx'
import { LaunchScreen, LandingScreen } from './ArrivalScreens.tsx'
import { OutpostScreen } from './OutpostScreen.tsx'
import { DebriefScreen } from './MissionReport.tsx'
import { ICEBOUND_SCIENCE_SOURCES } from '../../missions/index.ts'
import { missionEndingReady } from './ending.ts'
import { friendlyFeedback, feedbackTone } from './friendlyFeedback.ts'
import '../components/experience.css'
import './gameplay.css'

export default function PlayerApp() {
  const { state, dispatch, save } = useGame()
  const [menu, setMenu] = useState(true)
  const [panel, setPanel] = useState<'science'|'settings'|'new'|null>(null)
  const { settings, change } = useUiSettings()
  const endingRequested = useRef(false)
  const screen = useRef<HTMLElement>(null)
  const endingReady = missionEndingReady(state)
  useEffect(() => {
    const heading = screen.current?.querySelector('h1')
    heading?.setAttribute('tabindex', '-1')
    heading?.focus({ preventScroll: true })
  }, [state.phase, menu])
  useEffect(() => {
    if (state.phase !== 'outpost') { endingRequested.current = false; return }
    if (endingReady && !endingRequested.current) {
      endingRequested.current = true
      dispatch({ type: 'ENTER_DEBRIEF' })
    }
  }, [state.phase, endingReady, dispatch])
  const newMission = () => {
    dispatch({ type: 'RESET_GAME' }); dispatch({ type: 'START_GAME' })
    setMenu(false); setPanel(null)
  }
  const hasSave = state.phase !== 'menu'
  const props = { state, send: dispatch }
  return <main ref={screen} className={`mvp-game a-experience${settings.largeText ? ' mvp-large' : ''}${settings.reducedMotion ? ' mvp-still' : ''}`}>
    {menu || state.phase === 'menu' ? <>
      <MainMenu hasSave={hasSave} onCommand={command => {
        if (command === 'start') { if (hasSave || save?.notice) setPanel('new'); else newMission() }
        if (command === 'continue') setMenu(false)
        if (command === 'science' || command === 'settings') setPanel(command)
      }}/>
      <section className="mvp-panel"><h2>Your mission</h2><p>Pack your tools, build a research plan, and care for your supplies through 10 Mars days, called sols.
        Each day has two big jobs. Refill food, energy, air and water while you explore. Looking around is always free.</p>
        <p>Science can find evidence of ice, no ice in a sample, or an answer that is still uncertain. All three can be useful.</p>
        {hasSave && <p>Continue your mission at Sol {state.sol}, or start fresh.</p>}
      </section>
    </> : <>
      <header className="a-hud"><strong>✦ ASTROBAI <small>RED FRONTIER</small></strong>
        <span>{state.phase === 'outpost' ? 'Your Mars base' : state.phase === 'debrief' ? 'Mission results' : 'Getting ready for Mars'}</span>
        <nav aria-label="Game menu"><button type="button" onClick={() => setMenu(true)}>Main menu</button><button type="button" onClick={() => setPanel('settings')}>Settings</button></nav>
      </header>
      {state.feedback && <p className={`mvp-feedback mvp-${feedbackTone(state)}`} role={feedbackTone(state) === 'error' ? 'alert' : 'status'}><span aria-hidden="true">{feedbackTone(state) === 'error' ? '!' : '✓'} </span>{friendlyFeedback(state.feedback, state)}</p>}
      {state.phase === 'preparation' && <PreparationScreen {...props}/>}
      {state.phase === 'launch' && <LaunchScreen {...props}/>}
      {state.phase === 'landing' && <LandingScreen {...props}/>}
      {state.phase === 'outpost' && <OutpostScreen {...props} reducedMotion={settings.reducedMotion}/>}
      {state.phase === 'debrief' && <DebriefScreen state={state} onAgain={newMission} onMenu={() => setMenu(true)}/>}
    </>}
    {save?.notice && <p className="mvp-save" role="status">{save.notice}</p>}
    <p className="mvp-save">Progress is stored only in this browser when storage is available. New Mission replaces your saved run.</p>
    {panel === 'science' && <Dialog title="Science behind the game" onClose={() => setPanel(null)}>
      <p>Our sites, samples and hazards are fictional. The game works offline and does not fetch NASA data.</p>
      {ICEBOUND_SCIENCE_SOURCES.filter(source => source.verification === 'page-reviewed').map(source => <p key={source.id}>
        <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> — {source.context}</p>)}
    </Dialog>}
    {panel === 'settings' && <Dialog title="Settings" onClose={() => setPanel(null)}><div className="a-settings">
      <label><input type="checkbox" checked={settings.largeText} onChange={e => change('largeText', e.target.checked)}/>Larger text</label>
      <label><input type="checkbox" checked={settings.reducedMotion} onChange={e => change('reducedMotion', e.target.checked)}/>Reduce movement</label>
      <button type="button" onClick={() => setPanel('new')}>Start a new mission</button>
    </div></Dialog>}
    {panel === 'new' && <Dialog title="Start fresh?" onClose={() => setPanel(null)}><p>This replaces your saved mission and clears its choices and research.</p>
      <div className="a-button-row"><button type="button" onClick={newMission}>Yes, start a new mission</button><button type="button" onClick={() => setPanel(null)}>Keep my mission</button></div>
    </Dialog>}
  </main>
}

