import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import { gameSound } from '../data/gameSound'
import { ConfirmationDialog, ConfirmActionButton } from './Confirmation'
import { getActionBlocker } from '../../../shared/store/actionReadiness'
import { WeatherResults } from './WeatherResults'
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
import './gameplayHud.css'
import './pixelPolish.css'
import { MissionEnding } from './MissionEnding'
import { HudObjective } from './HudObjective'
import { CharacterPortrait } from './CharacterPortrait'
import { ResourceSummary } from './ResourceSummary'
import { facilityApproachPoint } from '../../mars-map/navigation/navigation'
import { ActionsHud } from './ActionsHud'
import { BuildingInformation } from './BuildingInformation'
import { ActionButton } from './ActionButton'
import { ActionFeedbackProvider } from './ActionFeedback'
import { VoiceProvider, VoiceControls, VoiceScene, AudioSettings, useVoice } from './VoiceControls'
import { MissionIntroduction, HudGuide } from './AdventureIntroductions'
import { actionHelp, lowResourceWarnings, RESOURCE_RECOVERY, type HelpDestination } from '../data/actionFeedback'
import { missionDestination } from '../data/missionNavigation'
import { ResourceIcon } from '../../../shared/components/ResourceIcon'
import { RESOURCE_ASSETS } from '../../../shared/assets/gameAssets'
import type { Resources } from '../../../shared/types/game'
import './childFriendly.css'
import './productionPolish.css'
import { FacilityProduction } from './FacilityProduction'
import { OUTPOST_BALANCE, resourceWarning, dailyConsumptionDescription } from '../../simulation/outpostSystems'

type Panel = 'settings' | 'science' | 'mission' | 'sites' | 'plan' | 'report' | 'mission-report' | 'crew' | 'energy' | 'supplies' | 'safety' | 'restart' | 'end-sol' | 'building-resource' | null
export function AdventureExperience() { return <VoiceProvider><AdventureGame/></VoiceProvider> }
function AdventureGame() {
  const { state, dispatch, saveStatus } = useGame()
  const audio = useVoice(), playEffect = audio.effect
  const [journey,setJourney] = useState(''),[expeditionPrompt,setExpeditionPrompt] = useState(false)
  const previousAudioState = useRef(state)
  const mainRef = useRef<HTMLElement>(null)
  const [introduction, setIntroduction] = useState(false), [tourReplay, setTourReplay] = useState(false), [tourStep, setTourStep] = useState(0)
  const [resourceQuery, setResourceQuery] = useState<keyof Resources>('power')
  const [help, setHelp] = useState<{ attempt: string; reason: string } | null>(null)
  const lastAttempt = useRef('Try this action')
  const [highlightedSite, setHighlightedSite] = useState<string>()
  const warningEpisodes = useRef(new Set<string>())
  const previousWarning = useRef('')
  const [menu, setMenu] = useState(true), [travel, setTravel] = useState(false)
  const [hudMinimized,setHudMinimized] = useState(false)
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
  const { settings, change } = useUiSettings()
  const reducedMotion = settings.reducedMotion || systemMotion
  useLayoutEffect(() => {
    const root = mainRef.current, header = root?.querySelector('.adventure-hud')
    if (!root || !header) return
    const update = () => root.style.setProperty('--hud-bottom', `${header.getBoundingClientRect().bottom + 8}px`)
    update(); const observer = new ResizeObserver(update); observer.observe(header)
    return () => observer.disconnect()
  }, [menu, state.phase])
  useEffect(() => { const cue=gameSound(previousAudioState.current,state); if(cue)playEffect(cue,JSON.stringify([state.sol,state.icebound.revision,state.resourceRevision,state.feedback])); previousAudioState.current=state }, [state,playEffect])
  // Observe committed mission events; rejected operations never activate the lab.
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    if (state.feedback?.kind !== 'error') return
    const message = { attempt: lastAttempt.current, reason: state.feedback.message }
    setHelp(previous => previous?.attempt === message.attempt && previous.reason === message.reason ? previous : message)
  }, [state.feedback])
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
  const showTour = !menu && state.phase === 'outpost' && !state.outcome && (tourReplay || !state.guidance.completedDialogueIds.includes('ui.hud-guide.v1'))
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    if (state.phase !== 'outpost' || state.outcome) return
    const warnings = lowResourceWarnings(state)
    for (const id of warningEpisodes.current) if (!warnings.some(warning => warning.id === id)) warningEpisodes.current.delete(id)
    const fresh = warnings.some(warning => !warningEpisodes.current.has(warning.id))
    for (const warning of warnings) warningEpisodes.current.add(warning.id)
    const warning = warnings[0], previousText = previousWarning.current
    const text = warning ? 'BAI: ' + warning.message + ' ' + warning.recovery : ''
    previousWarning.current = text
    if (fresh) { setNotice(text); playEffect('warning',text) }
    else setNotice(current => current === previousText ? text : current)
  }, [state,playEffect])
  /* oxlint-enable react/set-state-in-effect */
  useEffect(() => {
    if (!facility) return
    function outside(event: PointerEvent) { if (!(event.target as Element).closest('.world-context, .mars-facility, .facility-hover-card')) setFacility(null) }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') setFacility(null) }
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [facility])
  const guide = adventureDirector(state), view = selectIceboundView(state), eva = evaReadiness(state), groups = statusGroups(state)
  const confirmedEquipment = availableEquipment(selectIceboundContext(state))
  const rover = state.iceboundReadiness.roverOperational
  const sites: ScienceSite[] = state.icebound.observations.map((observation, index) => ({
    id: observation.siteId, label: ICEBOUND_SITES.find(s => s.id === observation.siteId)!.name.replace(' (fictional)',''), position: SITE_POINTS[index],
    status: view.sites[index]?.completed ? 'completed' : state.icebound.selectedSiteId === observation.siteId ? 'active' : view.sites[index]?.selectable ? 'available' : 'locked',
  }))
  const effectiveRequest = useMemo(() => request ? { ...request, activity: lastRun === request.id && state.feedback?.code === 'ICEBOUND_ACCEPTED' ? request.activity : 'waiting' as const } : undefined, [request, state.feedback, lastRun])
  function openPanel(next: Panel) {
    setHelp(null)
    setPanel(next)
    if (state.phase === 'outpost' && (next === 'energy' || next === 'supplies' || next === 'safety')) dispatch({ type: 'INSPECT_LOCATION', locationId: next })
  }
  function spoken(speakerId: keyof typeof CHARACTERS, text: string, id: string) {
    const message = { id, speakerId, speakerName: CHARACTERS[speakerId].name, text, objectiveId: id, title: '', actionLabel: 'Continue' }
    return <CharacterDialogue key={id} guide={message} completed={state.guidance.completedDialogueIds.includes(id)} onComplete={dialogueId => dispatch({ type: 'ACKNOWLEDGE_DIALOGUE', dialogueId })} actionRef={primaryActionRef}/>
  }
  function reset() { audio.reset(); setJourney(''); setExpeditionPrompt(false); warningEpisodes.current.clear(); setIntroduction(true); setTourReplay(false); setTourStep(0); setHighlightedSite(undefined); setHelp(null); pending.current = null; setHudMinimized(false); setLabWork(undefined); setAirlock(false); setRequest(undefined); dispatch({ type: 'RESET_GAME' }); dispatch({ type: 'START_GAME' }); setMenu(false); openPanel(null); setFacility(null); setInterior(null); setTravel(false); setNotice('') }
  function endSol() { setJourney(''); pending.current = null; setRequest(undefined); openPanel(null); setNotice(''); if (state.completedSol === 10 || state.outcome) dispatch({ type: 'ENTER_DEBRIEF' }); else dispatch({ type: 'ADVANCE_SOL',expectedSol:state.sol }) }
  function command(intent: IceboundRuntimeIntent, confirmed = false) {
    if (pending.current?.command) return
    if (intent.type === 'EXECUTE_EXPEDITION' && !confirmed) { setExpeditionPrompt(true); return }
    const proposal = iceboundEngine(selectIceboundContext(state), intent)
    if (!proposal.allowed) { showFeedback(intent.type === 'EXECUTE_EXPEDITION' ? 'Start expedition' : guide.actionLabel, proposal.reason); return }
    const isField = ['RECON','EXECUTE_EXPEDITION','COLLECT_SAMPLE'].includes(intent.type)
    const method = intent.type === 'RECON' ? 'rover-only' : state.icebound.approvedPlan?.method
    if (isField && method !== 'rover-only' && !eva.allowed) { showFeedback(guide.actionLabel, eva.reason!); return }
    const index = Math.max(0, ICEBOUND_SITES.findIndex(s => s.id === state.icebound.selectedSiteId))
    const id = nextNavigationId()
    pending.current = { id, command: intent }; setJourney(intent.type === 'RECON' ? 'Scout is travelling. The survey starts on arrival.' : isField ? 'Travelling to the research site. Work starts on arrival.' : 'Taking the sample to the lab. Analysis starts on arrival.')
    setLabWork(undefined); setInterior(null); openPanel(null); setNotice(isField ? method === 'rover-only' ? 'Scout is on the way.' : 'Airlock check. Suits on, team!' : 'Heading to our science station.')
    setRequest({ id, point: isField ? SITE_POINTS[index] : facilityApproachPoint('research-lab'), kind: method === 'rover-only' || !eva.allowed ? 'rover' : 'astronaut', companion: isField && method !== 'rover-only', companionKind: method === 'combined' ? 'rover' : 'astronaut', activity: intent.type === 'RECON' ? 'scanning' : intent.type === 'COLLECT_SAMPLE' ? 'sampling' : 'working' })
  }
  function inspect(id: FacilityId) { setJourney(''); dispatch({ type: 'INSPECT_LOCATION', locationId: id }); setFacility(id); setNotice(''); pending.current = null }
  function primary() {
    setNotice('')
    if (guide.endSol) { endSol(); return }
    if (guide.command) { command(guide.command); return }
    if (guide.panel) { openPanel(guide.panel); return }
    if (guide.target) {
      setInterior(null)
      if (!eva.allowed) { inspect(guide.target); return }
      const id = nextNavigationId(); pending.current = { id, facility: guide.target }
      setRequest({ id, point: facilityApproachPoint(guide.target), activity: 'inspecting' })
    }
  }
  function onArrival(id: number) {
    if (pending.current?.id !== id) return
    const task = pending.current; pending.current = null; setJourney(''); setHelp(null)
    if (task.facility) inspect(task.facility)
    if (task.command) { setLastRun(id); dispatch({ type: 'ICEBOUND_COMMAND', intent: task.command, expectedMissionRevision: state.icebound.revision }); setNotice('') }
  }
  function showFeedback(attempt: string, reason: string) { audio.effect('warning',attempt+reason); setHelp(previous => previous?.attempt === attempt && previous.reason === reason ? previous : { attempt, reason }) }
  function helpDestination(destination: HelpDestination) {
    if (destination === 'preparation') { setHelp(null); document.querySelector<HTMLButtonElement>('.adventure-preparation footer .primary')?.focus(); return }
    if (destination === 'landing') { setHelp(null); document.querySelector<HTMLButtonElement>('.adventure-cinematic .choice-row button')?.focus(); return }
    openPanel(destination)
  }
  function checkBuildingResource(id: keyof Resources | 'science') { if (id === 'science') openPanel(state.icebound.samples.length ? 'report' : 'mission'); else { setResourceQuery(id); openPanel('building-resource') } }
  function enterBuilding(id: FacilityId) { setJourney(''); setRequest(undefined); setInterior(id); setFacility(null); pending.current = null }
  function navigateMission(objectiveId: string) {
    const destination = missionDestination(state, objectiveId)
    openPanel(null); pending.current = null; setJourney(''); setRequest(undefined); setNotice('BAI: ' + destination.text)
    if (destination.blockedReason) { showFeedback('Follow this mission', destination.blockedReason); return }
    if (destination.panel) { openPanel(destination.panel); return }
    if (destination.point) {
      setInterior(null); setFacility(null); setHighlightedSite(destination.siteId)
      if (destination.kind === 'astronaut' && !eva.allowed) {
        if (destination.facility) { inspect(destination.facility); setNotice('BAI: The crew stays inside. Use the base console for this science step.'); return }
        showFeedback('Go to the research site', eva.reason!); return
      }
      setRequest({ id: nextNavigationId(), point: destination.point, kind: destination.kind, activity: 'inspecting' })
    }
  }
  function finishGuide() { dispatch({ type: 'ACKNOWLEDGE_DIALOGUE', dialogueId: 'ui.hud-guide.v1' }); setTourReplay(false); setTourStep(0) }
  const fact = SCIENCE_FACTS[state.sol < 3 ? state.sol === 1 ? 1 : 0 : state.sol === 6 ? 5 : state.icebound.samples.length ? 4 : 3]
  const facilityTitle = facility === 'research-lab' ? 'Research Laboratory' : facility === 'solar-array' ? 'Solar Array' : facility === 'greenhouse' ? 'Greenhouse' : 'Habitat'
  const statuses = { habitat: state.facilities.habitat === 'operational' ? 'operational' as const : 'offline' as const, 'solar-array': state.facilities['solar-array'] === 'operational' ? 'operational' as const : state.facilities['solar-array'] === 'damaged' ? 'damaged' as const : 'offline' as const, greenhouse: state.facilities.greenhouse === 'operational' ? 'operational' as const : state.facilities.greenhouse === 'damaged' ? 'damaged' as const : 'offline' as const, 'research-lab': state.iceboundReadiness.laboratoryOperational ? 'operational' as const : 'offline' as const }
  const titles: Record<Exclude<Panel,null>, string> = { settings: 'Make yourself comfortable', science: 'Real NASA science', mission: 'Our mission', sites: 'Where shall we explore?', plan: 'Plan the expedition', report: 'Our findings', 'mission-report':'Mission report', crew: 'Meet your crew', energy: 'Energy', supplies: 'Supplies', safety: 'Safety', restart: 'Start a fresh adventure?', 'building-resource': RESOURCE_ASSETS[resourceQuery].name, 'end-sol': `Finish Mars Day ${state.sol}?` }
  const helpCard = help ? <aside className="bai-feedback" role="status"><button className="context-close" type="button" aria-label="Close BAI help" onClick={() => setHelp(null)}>×</button><strong>BAI · {help.attempt}</strong><p>{help.reason}</p><VoiceControls id="blocked-action" text={help.reason + ' ' + actionHelp(help.reason,state).next}/><button type="button" onClick={() => helpDestination(actionHelp(help.reason,state).destination)}>{actionHelp(help.reason,state).next}</button></aside> : null
  return <ActionFeedbackProvider show={showFeedback}><main ref={mainRef} className={`adventure${showTour ? ` tour-step-${tourStep}` : ''}${!menu && state.phase === 'outpost' ? ' adventure-exploring' : ''}${hudMinimized ? ' hud-minimized' : ''}${interior ? ' is-indoors' : ''}${settings.largeText ? ' adventure-large' : ''}${reducedMotion ? ' adventure-still' : ''}`} onClickCapture={event => { const button = (event.target as Element).closest('button'); if (button) { lastAttempt.current = (button.getAttribute('aria-label') ?? button.querySelector('strong')?.textContent ?? button.textContent ?? 'Try this action').trim().slice(0,80); audio.effect('tap') } }}>
    <VoiceScene scope={`${menu}:${state.phase}:${panel}:${interior}:${introduction}:${showTour}:${hudMinimized}:${expeditionPrompt}:${state.guidance.completedDialogueIds.at(-1)}`}/>
    {menu ? <MainMenu hasSave={state.phase !== 'menu'} onCommand={c => { if (c === 'start') { if (state.phase !== 'menu') openPanel('restart'); else reset() } else if (c === 'continue') setMenu(false); else openPanel(c) }}/> : <>
      <header className="adventure-hud" hidden={state.phase==='debrief'}><button className="wordmark" type="button" onClick={() => { pending.current = null; setRequest(undefined); setJourney(''); setMenu(true) }} aria-label="Main menu"><span>✦ ASTROBAI</span><small>RED FRONTIER</small></button><span className="sol-chip">{state.phase === 'outpost' || state.phase === 'debrief' ? `MARS DAY ${state.sol} / 10` : state.phase.toUpperCase()}</span><ResourceHud resources={state.resources} hidden={state.phase === 'preparation'} highlight={guide.highlight} onInspect={openPanel}/>{state.phase === 'outpost' && <ActionsHud state={state}/>}<button type="button" className="help-button help-access" onClick={() => openPanel('settings')}>Help</button>{state.phase==='outpost'&&<button className="hud-toggle" type="button" aria-expanded={!hudMinimized} onClick={()=>setHudMinimized(value=>!value)}>{hudMinimized?'Expand HUD':'Minimize HUD'}</button>}<button type="button" className="help-button" onClick={() => openPanel('settings')}>Settings</button></header>
      {state.phase === 'preparation' && <AdventurePreparation state={state} dispatch={dispatch}/>}
      {state.phase === 'launch' && <StoryBackdrop artwork={travel ? 'cruise-window' : 'launch-pad'} className={`adventure-cinematic${travel ? ' travel-scene' : ' launch-scene'}`}><div className="cinematic-caption"><span className="overline">{travel ? 'THE JOURNEY / PRESENTATION' : 'EARTH / LAUNCH DAY'}</span><h1>{travel ? 'A little blue dot behind us' : 'Next stop, the red planet'}</h1>{spoken('kiki', travel ? 'Our crew travels together. Mars is getting closer!' : 'Tools packed. Team ready. Let’s go!', travel ? 'story.travel' : 'story.launch')}{travel ? <button ref={primaryActionRef} type="button" className="primary" onClick={()=>{dispatch({type:'COMPLETE_LAUNCH'});setTravel(false)}}>Approach Mars →</button> : <ConfirmActionButton label="Launch our rocket →" title="Launch our rocket?" validate={()=>state.phase==='launch'&&state.preparation.status==='confirmed'?undefined:'Confirm your cargo before launch.'} onConfirm={()=>{audio.effect('launch','launch');setTravel(true)}}><p>Your confirmed cargo travels with the crew. Launch begins the journey to Mars.</p></ConfirmActionButton>}</div></StoryBackdrop>}
      {state.phase === 'landing' && <StoryBackdrop artwork="landing-descent" className="adventure-cinematic"><div className="cinematic-caption"><span className="overline">MARS / ARRIVAL</span><h1>Choose our landing place</h1>{spoken('kiki', 'A new home awaits. Where shall we land?', 'story.landing')}<div className="choice-row">{LANDING_SITES.map((s,index) => <button ref={index === 0 ? primaryActionRef : undefined} key={s.id} type="button" onClick={() => { dispatch({ type: 'SELECT_LANDING_SITE', siteId: s.id }); setNotice('Welcome to Mars!') }}><strong>{s.title}</strong><span>{s.description}</span><small>{Object.entries(s.resourceDeltas).map(([k,v]) => `${v > 0 ? '+' : ''}${v} ${k}`).join(' · ')} game units</small></button>)}</div></div></StoryBackdrop>}
      {state.phase === 'outpost' && <>
        <HudObjective state={state} objective={guide.title} minimized={hudMinimized} onMission={()=>openPanel('mission')} onResource={openPanel}/>
        <div className="adventure-world">
          <div hidden={!!interior} className="surface-container"><MarsMap fullViewport facilityStatuses={statuses} selectedFacilityId={facility} onSelectFacility={inspect} sites={sites} selectedSiteId={state.icebound.selectedSiteId} onSelectSite={() => openPanel('sites')} isActive={!menu && !interior && !panel} animationsEnabled={!reducedMotion} renderFacilityCard={id => <BuildingInformation id={id} state={state} dispatch={dispatch} compact onEnter={() => enterBuilding(id)} onCheck={checkBuildingResource}/>} highlightedSiteId={highlightedSite} navigation={{ evaAllowed: eva.allowed, blockedReason: eva.reason, roverAvailable: rover, request: effectiveRequest, onArrive: onArrival, onBlocked: reason => { pending.current = null; setJourney(''); showFeedback('Walk there', reason) }, objectiveFacility: guide.target, highlightScout: guide.highlight === 'scout', onScoutSelect: primary }} environment={{ crewSheltering: !eva.allowed }} completionNotice={state.icebound.report ? { id: state.icebound.report.outcomeId, message: '✓ Findings recorded' } : undefined}/></div>
          {interior && <FacilityInterior key={interior} facilityId={interior} status={statuses[interior]} animationsEnabled={!reducedMotion} workEventId={interior === 'research-lab' ? labWork : undefined} onExit={() => { setLabWork(undefined); if (eva.allowed) setAirlock(true); else { setInterior(null); setNotice('The crew stays inside. Base console ready.'); requestAnimationFrame(() => enterRef.current?.focus()) } }}/>} 
          {airlock && <div className="airlock-transition" role="status"><span aria-hidden="true">⬡</span>Airlock · suit and oxygen check</div>}
          {journey && <div className="journey-progress" role="status">{journey}<button type="button" onClick={()=>{pending.current=null;setRequest(undefined);setJourney('');setNotice('Task cancelled. No Action was spent.')}}>Cancel task</button></div>}
          {notice && <div className="scene-narration" role="status">{notice}</div>}
          {!interior && <button type="button" className="nasa-fact-chip" onClick={() => openPanel('science')}>✧ NASA Fact <span>{fact.title}</span></button>}
          {facility && !interior && <aside className="world-context" role="region" aria-label={facilityTitle + ' actions'}><button className="context-close" type="button" onClick={() => setFacility(null)} aria-label="Close building actions">×</button><BuildingInformation id={facility} state={state} dispatch={dispatch} onEnter={() => enterBuilding(facility)} onCheck={checkBuildingResource}/></aside>}
        </div>
        <section className="adventure-dialogue" aria-label="Current guidance"><CharacterDialogue key={guide.id} guide={guide} completed={state.guidance.completedDialogueIds.includes(guide.id)} onComplete={dialogueId => dispatch({ type: 'ACKNOWLEDGE_DIALOGUE', dialogueId })} actionRef={primaryActionRef}/><div className="guided-action"><ActionButton ref={primaryActionRef} className="primary" blockedReason={journey || guide.blockedReason} onClick={primary}>{guide.actionLabel} <span aria-hidden="true">→</span></ActionButton>{!state.guidance.completedDialogueIds.includes(guide.id) && <button className="skip-chat" type="button" onClick={() => { dispatch({ type: 'ACKNOWLEDGE_DIALOGUE', dialogueId: guide.id }); primaryActionRef.current?.focus() }}>Skip chat</button>}{guide.blockedReason && <small className="blocked-guidance">{guide.blockedReason} {guide.recovery}</small>}</div></section>
        <nav className="adventure-toolbar" aria-label="Adventure tools"><button type="button" onClick={() => openPanel('crew')}>Crew</button><button type="button" onClick={() => openPanel('sites')}>Research sites</button><button type="button" onClick={() => openPanel('science')}>NASA science</button><button type="button" onClick={() => { setNotice(guide.blockedReason ?? guide.text); if (guide.panel) openPanel(guide.panel) }}>Ask BAI</button><span className="save-status" role="status">{saveStatus === 'saved' ? '✓ Saved on this device' : 'Progress in memory'}</span><button type="button" onClick={() => state.completedSol === 10 ? endSol() : openPanel('end-sol')}>{state.completedSol === 10 ? 'Mission debrief →' : state.sol === 10 ? 'Finish Mars Day 10 →' : 'End Mars Day →'}</button></nav>
      </>}
      {state.phase === 'debrief' && <MissionEnding state={state} onPlayAgain={()=>openPanel('restart')} onReport={()=>openPanel('mission-report')} onMenu={()=>setMenu(true)}/>}
    </>}
    {state.feedback?.kind === 'error' && !menu && <div className="adventure-error" role="alert">△ {state.feedback.message}</div>}
    {saveStatus === 'corrupt' && <p className="save-warning" role="status">We could not read the saved mission. Start a new adventure.</p>}
    {saveStatus === 'unavailable' && <p className="save-warning" role="status">Saving is unavailable. Keep this page open to continue.</p>}
    {introduction && <MissionIntroduction onClose={() => { setIntroduction(false); dispatch({ type: 'ACKNOWLEDGE_DIALOGUE', dialogueId: 'ui.mission-intro.v1' }) }}/>}
    {showTour && !introduction && <HudGuide onDone={finishGuide} onStep={setTourStep}/>}
    {!panel && helpCard}

    {panel && <Dialog title={titles[panel]} onClose={() => openPanel(null)}>
    {helpCard}
      {panel === 'building-resource' && <section className="building-resource-detail"><ResourceIcon resource={resourceQuery} size={64}/><h3>{RESOURCE_ASSETS[resourceQuery].name}: {state.resources[resourceQuery]} / 10</h3><p>{lowResourceWarnings(state).find(warning => warning.id === resourceQuery)?.message ?? 'This reserve is above the warning level.'}</p><FacilityProduction building={OUTPOST_BALANCE.operations[RESOURCE_RECOVERY[resourceQuery]].building} state={state} dispatch={dispatch} resource={resourceQuery}/></section>}
      {panel==='mission-report'&&<><ResourceSummary resources={state.resources}/><AdventureReport state={state}/><AdventureChoices state={state}/><p>{FICTION_NOTE}</p></>}
      {panel === 'settings' && <div className="adventure-settings"><label><input type="checkbox" checked={settings.largeText} onChange={e => change('largeText', e.target.checked)}/> Larger text</label><label><input type="checkbox" checked={settings.reducedMotion} onChange={e => change('reducedMotion', e.target.checked)}/> Less animation</label><AudioSettings/><p>Your device’s reduced-motion setting is always respected.</p><button type="button" onClick={() => { openPanel(null); audio.reset(); setIntroduction(true) }}>Replay mission introduction</button>{state.phase === 'outpost' && <button type="button" onClick={() => { openPanel(null); audio.reset(); setTourStep(0); setTourReplay(true) }}>Replay HUD guide</button>}<p>Walk by tapping clear ground. Use Tab and Enter for buildings. Escape closes a panel.</p><button type="button" onClick={() => openPanel('restart')}>Restart mission</button></div>}
      {panel === 'science' && <><WeatherResults readiness={state.iceboundReadiness}/><p>{FICTION_NOTE}</p><div className="science-facts">{SCIENCE_FACTS.map(f => <article key={f.id}><span className="overline">NASA FACT / CACHED SCIENCE</span><h3>{f.title}</h3><p>{f.description}</p><a href={f.sourceUrl} target="_blank" rel="noreferrer">{f.sourceOrganization} source ↗</a><small>{f.sourceDate ? `Published ${f.sourceDate} · ` : ''}Checked {f.verifiedDate}</small></article>)}</div><p>Space-weather examples are general science. No live warning or DONKI radiation measurement is used. Our fictional sites are not real SWIM map locations.</p></>}
      {panel === 'crew' && <><div className="crew-grid">{Object.entries(CHARACTERS).map(([id,c]) => <article key={id}><CharacterPortrait speakerId={id as keyof typeof CHARACTERS}/><h3>{c.name}</h3><p>{c.role}</p><p>{id === 'menemo' ? 'Tap the solar array to check our energy.' : id === 'olef' ? 'Check Safety to see our EVA readiness.' : id === 'kofi' ? 'Visit the laboratory for our next science step.' : id === 'scout' ? rover ? 'Standard mission rover ready for field work.' : 'Scout needs an operational readiness check.' : 'We’re exploring Mars together.'}</p></article>)}</div><details><summary>Our deployed equipment</summary>{confirmedEquipment.map(id => <p key={id}>{EQUIPMENT_CATALOG.find(e => e.id === id)?.name} · operational</p>)}</details></>}
      {groups.some(g => g.id === panel) && <><ResourceSummary resources={state.resources}/><p>{groups.find(g => g.id === panel)!.details}</p><p>Walking and looking around use no Actions.</p><p>Daily use: {Object.entries(OUTPOST_BALANCE.dailyConsumption).map(([id,value])=>`${value} ${id==='power'?'Energy':id}`).join(' · ')}.</p><p>{resourceWarning(state.resources)}</p>{panel==='energy'?<FacilityProduction building="solar-array" state={state} dispatch={dispatch}/>:panel==='supplies'?<><FacilityProduction building="habitat" state={state} dispatch={dispatch}/><FacilityProduction building="greenhouse" state={state} dispatch={dispatch}/></>:null}</>}
      {panel === 'mission' && <><p>Current goal: <strong>{guide.title}</strong></p><p>{guide.text}</p><ol className="objective-list">{view.objectives.map(o => <li key={o.id}><button type="button" className="mission-destination" onClick={() => navigateMission(o.id)}><span>{o.status === 'completed' ? '✓' : '○'}</span><div><strong>{o.title}</strong><small>{o.status === 'completed' ? 'Completed' : o.issues[0]?.explanation ?? 'Ready'}</small></div><span aria-hidden="true">↗</span></button></li>)}</ol><button className="primary" type="button" onClick={() => { openPanel(null); primary() }}>{guide.actionLabel}</button>{state.iceboundEvents.length > 0 && <details><summary>Recorded discoveries</summary>{state.iceboundEvents.map(e => <p key={e.resolutionId}>{e.event.objectiveId.replace('icebound.','').replaceAll('-',' ')} ✓</p>)}</details>}</>}
      {panel === 'sites' && <AdventureSites state={state} dispatch={dispatch} onChosen={() => openPanel('plan')}/>}
      {panel === 'plan' && (state.icebound.selectedSiteId ? <AdventurePlan key={state.icebound.selectedSiteId} state={state} dispatch={dispatch} onBegin={() => command({ type: "EXECUTE_EXPEDITION" })}/> : <p>Let Scout survey, then choose a research site first.</p>)}
      {panel === 'report' && <><AdventureReport state={state}/><div className="choice-row"><button className="primary" type="button" onClick={()=>openPanel('sites')}>Next: research sites</button><button type="button" onClick={()=>openPanel('mission-report')}>View Mission Report</button></div></>}
      {panel === 'restart' && <><p>Your current mission save will be replaced.</p><div className="choice-row"><button className="primary" type="button" onClick={reset}>Start new adventure</button><button type="button" onClick={() => openPanel(null)}>Keep this mission</button></div></>}
      {panel === 'end-sol' && <><p>Each Mars Day uses {dailyConsumptionDescription()}. Keep every reserve above zero.</p><p>{resourceWarning(state.resources)}</p><p>{state.actionsRemaining ? `You have ${state.actionsRemaining} Actions left. It is okay to rest or explore first.` : 'Today’s Actions are done. Ready for a fresh Mars Day?'}</p>{state.sol === 10 && !state.icebound.report && <p>Our investigation is unfinished. You can keep working before debrief.</p>}<div className="choice-row"><button className="primary" type="button" onClick={endSol}>{state.sol === 10 ? 'Finish the outpost mission' : 'Rest until next Mars Day'}</button><button type="button" onClick={() => openPanel(null)}>Keep exploring</button></div></>}
    </Dialog>}
    {expeditionPrompt && <ConfirmationDialog title="Start this expedition?" validate={()=>getActionBlocker(state,{type:'ICEBOUND_COMMAND',intent:{type:'EXECUTE_EXPEDITION'},expectedMissionRevision:state.icebound.revision})} onConfirm={()=>command({type:'EXECUTE_EXPEDITION'},true)} onClose={()=>setExpeditionPrompt(false)}><p>Travel to the selected research site. One Action and the approved trip supplies will be used when the team arrives.</p><p>Trip cost: {Object.entries(view.currentReadiness?.requiredResources??{}).filter(([,value])=>value).map(([key,value])=>`${value} ${key==='power'?'Energy':key}`).join(' · ')||'No supply cost'}. One Action.</p><p>Team: {state.icebound.approvedPlan?.method.replaceAll('-',' ')}. Your scientific result will depend on the sample and its evidence quality.</p></ConfirmationDialog>}
  </main></ActionFeedbackProvider>
}


