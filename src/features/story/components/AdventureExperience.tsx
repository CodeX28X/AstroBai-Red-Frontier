import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../../shared/store/useGame'
import { selectIceboundContext, selectIceboundView } from '../../../shared/store/iceboundSelectors'
import { iceboundEngine } from '../../missions/engine/icebound/iceboundEngine'
import { availableEquipment } from '../../missions/engine/icebound/readiness'
import { LANDING_SITES } from '../../missions/data/landingSites'
import { ICEBOUND_SITES } from '../../missions/data/iceboundSites'
import { EQUIPMENT_CATALOG } from '../../missions/data/equipmentCatalog'
import { MarsMap, FacilityInterior, nextNavigationId, type FacilityId, type NavigationRequest, type ScienceSite } from '../../mars-map'
import { MainMenu } from './MainMenu'
import { StoryBackdrop } from './StoryBackdrop'
import { Dialog } from './Dialog'
import { useUiSettings } from './useUiSettings'
import { useUiSound } from './useUiSound'
import { AdventurePreparation } from './AdventurePreparation'
import { AdventureChoices, AdventurePlan, AdventureReport, AdventureSites } from './AdventureMission'
import { SITE_POINTS } from '../data/adventureLocations'
import { adventureDirector, CHARACTERS, evaReadiness, statusGroups } from '../data/adventureDirector'
import { SCIENCE_FACTS, FICTION_NOTE } from '../../../data/nasa/scienceFacts'
import type { IceboundRuntimeIntent } from '../../../shared/types/iceboundIntegration'
import './adventure.css'
import { CharacterDialogue } from './CharacterDialogue'
import { ResourceHud } from './ResourceHud'
import './exploration.css'

type Panel = 'settings' | 'science' | 'mission' | 'sites' | 'plan' | 'report' | 'crew' | 'energy' | 'supplies' | 'safety' | 'restart' | 'end-sol' | null
export function AdventureExperience() {
  const { state, dispatch, saveStatus } = useGame()
  const [menu, setMenu] = useState(true), [travel, setTravel] = useState(false)
  const [panel, setPanel] = useState<Panel>(null), [facility, setFacility] = useState<FacilityId | null>(null), [interior, setInterior] = useState<FacilityId | null>(null)
  const [notice, setNotice] = useState(''), [request, setRequest] = useState<NavigationRequest>()
  const [airlock, setAirlock] = useState(false)
  const [labWork, setLabWork] = useState<string>()
  const previousMissionRevision = useRef(state.icebound.revision)
  const [systemMotion, setSystemMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const pending = useRef<{ id: number; command?: IceboundRuntimeIntent; facility?: FacilityId } | null>(null)
  const [lastRun, setLastRun] = useState(0)
  const enterRef = useRef<HTMLButtonElement>(null)
  const primaryActionRef = useRef<HTMLButtonElement>(null)
  const { settings, change } = useUiSettings(), sound = useUiSound(settings.sound)
  const reducedMotion = settings.reducedMotion || systemMotion
  // Observe committed mission events; rejected operations never activate the lab.
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    if (previousMissionRevision.current !== state.icebound.revision && state.iceboundEvents.at(-1)?.event.objectiveId === 'icebound.lab-analysis' && state.feedback?.code === 'ICEBOUND_ACCEPTED') {
      setInterior('research-lab')
      setLabWork(state.iceboundEvents.at(-1)?.resolutionId)
    }
    previousMissionRevision.current = state.icebound.revision
  }, [state.icebound.revision, state.iceboundEvents, state.feedback])
  /* oxlint-enable react/set-state-in-effect */
  useEffect(() => {
    if (!airlock) return
    const timer = setTimeout(() => { setInterior(null); setAirlock(false); setNotice('Suit check complete. Ready to explore.'); requestAnimationFrame(() => enterRef.current?.focus()) }, reducedMotion ? 100 : 550)
    return () => clearTimeout(timer)
  }, [airlock, reducedMotion])
  useEffect(() => { const media = matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setSystemMotion(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update) }, [])
  const guide = adventureDirector(state), view = selectIceboundView(state), eva = evaReadiness(state), groups = statusGroups(state)
  const confirmedEquipment = availableEquipment(selectIceboundContext(state))
  const rover = state.iceboundReadiness.roverOperational
  const sites: ScienceSite[] = state.icebound.observations.map((observation, index) => ({
    id: observation.siteId, label: ICEBOUND_SITES.find(s => s.id === observation.siteId)!.name.replace(' (fictional)',''), position: SITE_POINTS[index],
    status: state.icebound.selectedSiteId === observation.siteId ? state.icebound.report ? 'completed' : 'active' : 'available',
  }))
  const effectiveRequest = useMemo(() => request ? { ...request, activity: lastRun === request.id && state.feedback?.code === 'ICEBOUND_ACCEPTED' ? request.activity : 'waiting' as const } : undefined, [request, state.feedback, lastRun])
  function openPanel(next: Panel) {
    setPanel(next)
    if (state.phase === 'outpost' && (next === 'energy' || next === 'supplies' || next === 'safety')) dispatch({ type: 'INSPECT_LOCATION', locationId: next })
  }
  function spoken(speakerId: keyof typeof CHARACTERS, text: string, id: string) {
    const message = { id, speakerId, speakerName: CHARACTERS[speakerId].name, text, objectiveId: id, title: '', actionLabel: 'Continue' }
    return <CharacterDialogue key={id} guide={message} completed={state.guidance.completedDialogueIds.includes(id)} onComplete={dialogueId => dispatch({ type: 'ACKNOWLEDGE_DIALOGUE', dialogueId })} actionRef={primaryActionRef}/>
  }
  function reset() { pending.current = null; setLabWork(undefined); setAirlock(false); setRequest(undefined); dispatch({ type: 'RESET_GAME' }); dispatch({ type: 'START_GAME' }); setMenu(false); openPanel(null); setFacility(null); setInterior(null); setTravel(false); setNotice('') }
  function endSol() { pending.current = null; setRequest(undefined); openPanel(null); setNotice(''); if (state.completedSol === 10 || state.outcome) dispatch({ type: 'ENTER_DEBRIEF' }); else dispatch({ type: 'ADVANCE_SOL' }) }
  function command(intent: IceboundRuntimeIntent) {
    const proposal = iceboundEngine(selectIceboundContext(state), intent)
    if (!proposal.allowed) { setNotice(proposal.reason); return }
    const isField = ['RECON','EXECUTE_EXPEDITION','COLLECT_SAMPLE'].includes(intent.type)
    const method = intent.type === 'RECON' ? 'rover-only' : state.icebound.approvedPlan?.method
    if (isField && method !== 'rover-only' && !eva.allowed) { setNotice(eva.reason!); return }
    const index = Math.max(0, ICEBOUND_SITES.findIndex(s => s.id === state.icebound.selectedSiteId))
    const id = nextNavigationId()
    pending.current = { id, command: intent }
    setLabWork(undefined); setInterior(null); openPanel(null); setNotice(isField ? method === 'rover-only' ? 'Scout is on the way.' : 'Airlock check. Suits on, team!' : 'Heading to our science station.')
    setRequest({ id, point: isField ? SITE_POINTS[index] : { x: 62, y: 86 }, kind: method === 'rover-only' || !eva.allowed ? 'rover' : 'astronaut', companion: isField && method !== 'rover-only', companionKind: method === 'combined' ? 'rover' : 'astronaut', activity: intent.type === 'RECON' ? 'scanning' : intent.type === 'COLLECT_SAMPLE' ? 'sampling' : 'working' })
  }
  function inspect(id: FacilityId) { dispatch({ type: 'INSPECT_LOCATION', locationId: id }); setFacility(id); setNotice(''); pending.current = null }
  function primary() {
    setNotice('')
    if (guide.endSol) { endSol(); return }
    if (guide.command) { command(guide.command); return }
    if (guide.panel) { openPanel(guide.panel); return }
    if (guide.target) {
      setInterior(null)
      if (!eva.allowed) { inspect(guide.target); return }
      const id = nextNavigationId(); pending.current = { id, facility: guide.target }
      setRequest({ id, point: { x: guide.target === 'solar-array' ? 62 : 38, y: 56 }, activity: 'inspecting' })
    }
  }
  function onArrival(id: number) {
    if (pending.current?.id !== id) return
    const task = pending.current; pending.current = null
    if (task.facility) inspect(task.facility)
    if (task.command) { setLastRun(id); dispatch({ type: 'ICEBOUND_COMMAND', intent: task.command, expectedMissionRevision: state.icebound.revision }); setNotice('') }
  }
  const fact = SCIENCE_FACTS[state.sol < 3 ? state.sol === 1 ? 1 : 0 : state.sol === 6 ? 5 : state.icebound.samples.length ? 4 : 3]
  const facilityTitle = facility === 'research-lab' ? 'Research Laboratory' : facility === 'solar-array' ? 'Solar Array' : facility === 'greenhouse' ? 'Greenhouse' : 'Habitat'
  const statuses = { habitat: state.facilities.habitat === 'operational' ? 'operational' as const : 'offline' as const, 'solar-array': state.facilities['solar-array'] === 'damaged' ? 'damaged' as const : confirmedEquipment.includes('folding-solar-array') ? 'operational' as const : 'offline' as const, greenhouse: 'offline' as const, 'research-lab': state.iceboundReadiness.laboratoryOperational ? 'operational' as const : 'offline' as const }
  const titles: Record<Exclude<Panel,null>, string> = { settings: 'Make yourself comfortable', science: 'Real NASA science', mission: 'Our mission', sites: 'Where shall we explore?', plan: 'Plan the expedition', report: 'Our findings', crew: 'Meet your crew', energy: 'Energy', supplies: 'Supplies', safety: 'Safety', restart: 'Start a fresh adventure?', 'end-sol': `Finish Sol ${state.sol}?` }
  return <main className={`adventure${!menu && state.phase === 'outpost' ? ' adventure-exploring' : ''}${interior ? ' is-indoors' : ''}${settings.largeText ? ' adventure-large' : ''}${reducedMotion ? ' adventure-still' : ''}`} onClickCapture={event => { if ((event.target as Element).closest('button')) sound() }}>
    {menu ? <MainMenu hasSave={state.phase !== 'menu'} onCommand={c => { if (c === 'start') { if (state.phase !== 'menu') openPanel('restart'); else reset() } else if (c === 'continue') setMenu(false); else openPanel(c) }}/> : <>
      <header className="adventure-hud"><button className="wordmark" type="button" onClick={() => { pending.current = null; setMenu(true) }} aria-label="Main menu"><span>✦ ASTROBAI</span><small>RED FRONTIER</small></button><span className="sol-chip">{state.phase === 'outpost' || state.phase === 'debrief' ? `SOL ${state.sol} / 10` : state.phase.toUpperCase()}</span><ResourceHud resources={state.resources} hidden={state.phase === 'preparation'} highlight={guide.highlight} onInspect={openPanel}/><button type="button" className="help-button" onClick={() => openPanel('settings')}>Settings</button></header>
      {state.phase === 'preparation' && <AdventurePreparation state={state} dispatch={dispatch}/>}
      {state.phase === 'launch' && <StoryBackdrop artwork={travel ? 'cruise-window' : 'launch-pad'} className={`adventure-cinematic${travel ? ' travel-scene' : ' launch-scene'}`}><div className="cinematic-caption"><span className="overline">{travel ? 'THE JOURNEY / PRESENTATION' : 'EARTH / LAUNCH DAY'}</span><h1>{travel ? 'A little blue dot behind us' : 'Next stop, the red planet'}</h1>{spoken('kiki', travel ? 'Our crew travels together. Mars is getting closer!' : 'Tools packed. Team ready. Let’s go!', travel ? 'story.travel' : 'story.launch')}<button ref={primaryActionRef} type="button" className="primary" onClick={() => { if (travel) { dispatch({ type: 'COMPLETE_LAUNCH' }); setTravel(false) } else setTravel(true) }}>{travel ? 'Approach Mars →' : 'Launch our rocket →'}</button></div></StoryBackdrop>}
      {state.phase === 'landing' && <StoryBackdrop artwork="landing-descent" className="adventure-cinematic"><div className="cinematic-caption"><span className="overline">MARS / ARRIVAL</span><h1>Choose our landing place</h1>{spoken('kiki', 'A new home awaits. Where shall we land?', 'story.landing')}<div className="choice-row">{LANDING_SITES.map((s,index) => <button ref={index === 0 ? primaryActionRef : undefined} key={s.id} type="button" onClick={() => { dispatch({ type: 'SELECT_LANDING_SITE', siteId: s.id }); setNotice('Welcome to Mars!') }}><strong>{s.title}</strong><span>{s.description}</span><small>{Object.entries(s.resourceDeltas).map(([k,v]) => `${v > 0 ? '+' : ''}${v} ${k}`).join(' · ')} game units</small></button>)}</div></div></StoryBackdrop>}
      {state.phase === 'outpost' && <>
        <section className="adventure-objective"><div><span className="overline">{state.sol < 3 ? 'YOUR NEXT ADVENTURE' : 'PROJECT ICEBOUND'} <span aria-hidden="true">/</span> {state.actionsRemaining} big jobs left</span><h1>{guide.title}</h1></div><button type="button" onClick={() => openPanel('mission')}>Mission log <span aria-hidden="true">↗</span></button></section>
        <div className="adventure-world">
          <div hidden={!!interior} className="surface-container"><MarsMap fullViewport facilityStatuses={statuses} selectedFacilityId={facility} onSelectFacility={inspect} sites={sites} selectedSiteId={state.icebound.selectedSiteId} onSelectSite={() => openPanel(state.icebound.selectedSiteId ? 'plan' : 'sites')} isActive={!menu && !interior && !panel} animationsEnabled={!reducedMotion} navigation={{ evaAllowed: eva.allowed, blockedReason: eva.reason, roverAvailable: rover, request: effectiveRequest, onArrive: onArrival, onBlocked: reason => { pending.current = null; setNotice(reason) }, objectiveFacility: guide.target, highlightScout: guide.highlight === 'scout', onScoutSelect: primary }} environment={{ crewSheltering: !eva.allowed }} completionNotice={state.icebound.report ? { id: state.icebound.report.outcomeId, message: '✓ Findings recorded' } : undefined}/></div>
          {interior && <FacilityInterior key={interior} facilityId={interior} status={statuses[interior]} animationsEnabled={!reducedMotion} workEventId={interior === 'research-lab' ? labWork : undefined} onExit={() => { setLabWork(undefined); if (eva.allowed) setAirlock(true); else { setInterior(null); setNotice('The crew stays inside. Base console ready.'); requestAnimationFrame(() => enterRef.current?.focus()) } }}/>} 
          {airlock && <div className="airlock-transition" role="status"><span aria-hidden="true">⬡</span>Airlock · suit and oxygen check</div>}
          {notice && <div className="scene-narration" role="status">{notice}</div>}
          {!interior && <button type="button" className="nasa-fact-chip" onClick={() => openPanel('science')}>✧ NASA Fact <span>{fact.title}</span></button>}
          {facility && !interior && <aside className="world-context" aria-label={`${facilityTitle} actions`}><button className="context-close" type="button" onClick={() => setFacility(null)} aria-label="Close building actions">×</button><span className="overline">{eva.allowed ? 'YOU HAVE ARRIVED' : 'BASE CONSOLE / CREW INSIDE'}</span><h2>{facilityTitle}</h2><p>{facility === 'habitat' ? 'Our pressurized home and safe airlock. Dr. Olef checks our air and supplies.' : facility === 'solar-array' ? statuses['solar-array'] === 'damaged' ? 'Menemo: The array needs attention. Check our available energy.' : `Menemo: Our starter power grid is ready.${statuses['solar-array'] === 'offline' ? ' Extra solar panels were not packed.' : ' Our extra panels are deployed.'}` : facility === 'research-lab' ? 'Dr. Kofi: Our lab and drilling station are ready for science.' : 'Seeds need a protected growing experiment. This module is not producing food.'}</p><div className="context-actions"><button ref={enterRef} type="button" onClick={() => { setInterior(facility); pending.current = null }}>Enter {facilityTitle}</button><button type="button" onClick={() => openPanel(facility === 'solar-array' ? 'energy' : facility === 'habitat' ? 'supplies' : facility === 'research-lab' ? state.icebound.samples.length ? 'report' : 'mission' : 'science')}>{facility === 'solar-array' ? 'Check energy' : facility === 'habitat' ? 'Check supplies' : facility === 'research-lab' ? 'Science notebook' : 'Learn about Mars'}</button></div></aside>}
        </div>
        <section className="adventure-dialogue" aria-label="Current guidance"><CharacterDialogue key={guide.id} guide={guide} completed={state.guidance.completedDialogueIds.includes(guide.id)} onComplete={dialogueId => dispatch({ type: 'ACKNOWLEDGE_DIALOGUE', dialogueId })} actionRef={primaryActionRef}/><div className="guided-action"><button ref={primaryActionRef} type="button" className="primary" disabled={!!guide.blockedReason} onClick={primary}>{guide.actionLabel} <span aria-hidden="true">→</span></button>{!state.guidance.completedDialogueIds.includes(guide.id) && <button className="skip-chat" type="button" onClick={() => { dispatch({ type: 'ACKNOWLEDGE_DIALOGUE', dialogueId: guide.id }); primaryActionRef.current?.focus() }}>Skip chat</button>}{guide.blockedReason && <small className="blocked-guidance">{guide.blockedReason} {guide.recovery}</small>}</div></section>
        <nav className="adventure-toolbar" aria-label="Adventure tools"><button type="button" onClick={() => openPanel('crew')}>Crew</button><button type="button" onClick={() => openPanel('science')}>NASA science</button><button type="button" onClick={() => { setNotice(guide.blockedReason ?? guide.text); if (guide.panel) openPanel(guide.panel) }}>Ask BAI</button><span className="save-status" role="status">{saveStatus === 'saved' ? '✓ Saved on this device' : 'Progress in memory'}</span><button type="button" onClick={() => state.completedSol === 10 ? endSol() : openPanel('end-sol')}>{state.completedSol === 10 ? 'Mission debrief →' : state.sol === 10 ? 'Finish Sol 10 →' : 'End sol →'}</button></nav>
      </>}
      {state.phase === 'debrief' && <section className="adventure-debrief"><span className="overline">CAPTAIN’S LOG / SOL {state.sol}</span><h1>{state.outcome === 'success' ? 'A small crew. A big adventure.' : 'Every adventure teaches us.'}</h1><p>{state.outcome === 'success' ? 'Our ten-sol outpost mission is complete. Thank you, Commander!' : 'The mission paused. Let’s use what we learned next time.'}</p><div className="debrief-grid"><article><h2>✦ Our investigation</h2><AdventureReport state={state}/><AdventureChoices state={state}/></article><article><h2>What we learned</h2><p>Check tools before exploring. Protect the crew. Record honest results.</p><p>Finding no ice here does not rule out ice elsewhere.</p><p>Scientific clues and route safety answer different questions.</p><p>{FICTION_NOTE}</p><button type="button" onClick={() => openPanel('science')}>Explore the real science</button></article></div><div className="choice-row"><button className="primary" type="button" onClick={() => openPanel('restart')}>Play again</button><button type="button" onClick={() => setMenu(true)}>Main menu</button></div></section>}
    </>}
    {state.feedback?.kind === 'error' && !menu && <div className="adventure-error" role="alert">△ {state.feedback.message}</div>}
    {saveStatus === 'corrupt' && <p className="save-warning" role="status">We could not read the saved mission. Start a new adventure.</p>}
    {saveStatus === 'unavailable' && <p className="save-warning" role="status">Saving is unavailable. Keep this page open to continue.</p>}
    {panel && <Dialog title={titles[panel]} onClose={() => openPanel(null)}>
      {panel === 'settings' && <div className="adventure-settings"><label><input type="checkbox" checked={settings.largeText} onChange={e => change('largeText', e.target.checked)}/> Larger text</label><label><input type="checkbox" checked={settings.reducedMotion} onChange={e => change('reducedMotion', e.target.checked)}/> Less animation</label><label><input type="checkbox" checked={settings.sound} onChange={e => change('sound',e.target.checked)}/> Gentle button sounds</label><p>Your device’s reduced-motion setting is always respected.</p><p>Walk by tapping clear ground. Use Tab and Enter for buildings. Escape closes a panel.</p><button type="button" onClick={() => openPanel('restart')}>Restart mission</button></div>}
      {panel === 'science' && <><p>{FICTION_NOTE}</p><div className="science-facts">{SCIENCE_FACTS.map(f => <article key={f.id}><span className="overline">NASA FACT / CACHED SCIENCE</span><h3>{f.title}</h3><p>{f.description}</p><a href={f.sourceUrl} target="_blank" rel="noreferrer">{f.sourceOrganization} source ↗</a><small>{f.sourceDate ? `Published ${f.sourceDate} · ` : ''}Checked {f.verifiedDate}</small></article>)}</div><p>Space-weather examples are general science. No live warning or DONKI radiation measurement is used. Our fictional sites are not real SWIM map locations.</p></>}
      {panel === 'crew' && <><div className="crew-grid">{Object.entries(CHARACTERS).map(([id,c]) => <article key={id}><img src={c.portrait} width="120" height="120" alt={`${c.name} portrait placeholder`}/><h3>{c.name}</h3><p>{c.role}</p><p>{id === 'menemo' ? 'Tap the solar array to check our energy.' : id === 'olef' ? 'Check Safety to see our EVA readiness.' : id === 'kofi' ? 'Visit the laboratory for our next science step.' : id === 'scout' ? rover ? 'Standard mission rover ready for field work.' : 'Scout needs an operational readiness check.' : 'We’re exploring Mars together.'}</p></article>)}</div><details><summary>Our deployed equipment</summary>{confirmedEquipment.map(id => <p key={id}>{EQUIPMENT_CATALOG.find(e => e.id === id)?.name} · operational</p>)}</details></>}
      {groups.some(g => g.id === panel) && <><p>{groups.find(g => g.id === panel)!.details}</p><p>Walking and looking around use no big jobs.</p></>}
      {panel === 'mission' && <><p>Current goal: <strong>{guide.title}</strong></p><p>{guide.text}</p><ol className="objective-list">{view.objectives.map(o => <li key={o.id}><span>{o.status === 'completed' ? '✓' : '○'}</span><div><strong>{o.title}</strong><small>{o.status === 'completed' ? 'Completed' : o.issues[0]?.explanation ?? 'Ready'}</small></div></li>)}</ol><button className="primary" type="button" onClick={() => { openPanel(null); primary() }}>{guide.actionLabel}</button>{state.iceboundEvents.length > 0 && <details><summary>Recorded discoveries</summary>{state.iceboundEvents.map(e => <p key={e.resolutionId}>{e.event.objectiveId.replace('icebound.','').replaceAll('-',' ')} ✓</p>)}</details>}</>}
      {panel === 'sites' && <AdventureSites state={state} dispatch={dispatch} onChosen={() => openPanel('plan')}/>}
      {panel === 'plan' && (state.icebound.selectedSiteId ? <AdventurePlan state={state} dispatch={dispatch}/> : <p>Let Scout survey, then choose a research site first.</p>)}
      {panel === 'report' && <AdventureReport state={state}/>}
      {panel === 'restart' && <><p>Your current mission save will be replaced.</p><div className="choice-row"><button className="primary" type="button" onClick={reset}>Start new adventure</button><button type="button" onClick={() => openPanel(null)}>Keep this mission</button></div></>}
      {panel === 'end-sol' && <><p>{state.actionsRemaining ? `You have ${state.actionsRemaining} big jobs left. It is okay to rest or explore first.` : 'Today’s big jobs are done. Ready for a fresh sol?'}</p>{state.sol === 10 && !state.icebound.report && <p>Our investigation is unfinished. You can keep working before debrief.</p>}<div className="choice-row"><button className="primary" type="button" onClick={endSol}>{state.sol === 10 ? 'Finish the outpost mission' : 'Rest until next sol'}</button><button type="button" onClick={() => openPanel(null)}>Keep exploring</button></div></>}
    </Dialog>}
  </main>
}


