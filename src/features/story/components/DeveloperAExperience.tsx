import { useEffect, useRef, useState } from 'react'
import { MarsMap, FacilityInterior } from '../../mars-map'
import type { FacilityId } from '../../mars-map'
import { chapterCards, futureMessages, homeCheckLabels, todayGoals } from '../data/approvedScenes'
import { feedbackCopy } from '../data/feedbackCopy'
import { formatCopy } from '../data/formatCopy'
import { scienceCards } from '../data/scienceCards'
import { quickChecks, recapLogs } from '../data/quickChecks'
import { systemCopy } from '../data/systemCopy'
import type { ExperiencePorts, ExperienceView, IndicatorView } from '../types/experience'
import { MainMenu } from './MainMenu'
import { StoryBackdrop } from './StoryBackdrop'
import { Dialog } from './Dialog'
import { Dialogue, ReadAloud } from './Dialogue'
import { PowerPlanPanel } from './PowerPlanPanel'
import { useUiSettings } from './useUiSettings'
import { useUiSound } from './useUiSound'
import { FacilityInspection } from './FacilityInspection'
import './experience.css'

type Panel = 'power' | 'science' | 'settings' | 'journal' | 'missions' | 'crew' | 'indicator' | 'deeper' | null
interface Confirmation { readonly title: string;readonly text: string;readonly run: () => void }

/** GDD Part0 and Part2B presentation. C/D remain the single source of truth. */
export function DeveloperAExperience({ view, ports, previewLabel }: {readonly view: ExperienceView;readonly ports: ExperiencePorts;readonly previewLabel?: string}) {
  const [panel, setPanel] = useState<Panel>(view.page === 'outpost' && view.scene.id !== 'S1-A-K' ? 'missions' : null)
  const [indicator, setIndicator] = useState<IndicatorView | null>(null)
  const [facility, setFacility] = useState<FacilityId | null>(null)
  const [site, setSite] = useState<string | null>(null)
  const [interiorId, setInteriorId] = useState<FacilityId | null>(null)
  const enterButtonRef=useRef<HTMLButtonElement>(null)
  const returningFromInterior=useRef(false)
  useEffect(() => {
    if (interiorId !== null) {returningFromInterior.current=true;return}
    if (returningFromInterior.current) {enterButtonRef.current?.focus();returningFromInterior.current=false}
  },[interiorId])
  const [cargo, setCargo] = useState<readonly string[]>([])
  const [hint, setHint] = useState('')
  const {settings,change:changeSetting} = useUiSettings()
  const {largeText,reducedMotion,readAloud,sound}=settings
  const playUiSound=useUiSound(sound)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [fullDebrief, setFullDebrief] = useState(false)
  const [showKidDebrief, setShowKidDebrief] = useState(false)
  const [kidCard, setKidCard] = useState(0)
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null)
  const [reflection, setReflection] = useState<string | null>(null)
  const selectedSite = view.map.sites?.find(item => item.id === site)
  const chapter = chapterCards[view.chapter - 1]
  const quickCheck = quickChecks[view.chapter - 1]
  const copy = (text: string) => formatCopy(text, view.tokens)
  const feedback = view.feedback ? feedbackCopy[view.feedback.id] : undefined
  const feedbackTokens = {...view.tokens,...view.feedback?.tokens}
  function requestRestart(scope: 'mission' | 'game' | 'chapter' | 'sol1') {
    setConfirmation({title:scope === 'chapter' ? 'Try this chapter again?' : 'Restart mission?',text:scope === 'game' ? 'Clear everything and start fresh? This cannot be undone.' : 'Go back to the beginning? You will lose this run.',run:() => ports.onRestart(scope)})
  }
  function newMission() {
    if (view.hasSave) setConfirmation({title:'Start a new mission?',text:'Your saved mission will be replaced.',run:ports.onNewMission})
    else ports.onNewMission()
  }
  function selectChoice(id: string) {
    const availability = view.choices.find(item => item.id === id)
    if (!availability?.available) {setHint(availability?.reason ?? copy(systemCopy[availability?.blockId ?? ''] ?? 'This choice is not available.'));return}
    // Part2B S: prologue choices are quick; no extra confirmation.
    if (view.page === 'prologue') {ports.onChoice(id);return}
    setConfirmation({title:'Your choice',text:`Choose “${view.scene.choices.find(item => item.id === id)?.label ?? id}”? ${availability.cost ?? copy(view.scene.choices.find(item => item.id === id)?.consequence ?? '')}`,run:() => ports.onChoice(id)})
  }
  function advance() {
    if (!view.advance.allowed) {setHint(view.advance.reason ?? 'One more step first.');return}
    if (view.advance.unusedJobs > 0) setConfirmation({title:'Move to the next Mars Day?',text:`You still have ${view.advance.unusedJobs} job(s). Move to the next Mars Day anyway?`,run:ports.onAdvanceSol})
    else ports.onAdvanceSol()
  }
  const missionContent = (<section className="a-mission-card"><div><span className="a-eyebrow">{view.scene.id}</span><h2>{view.scene.title}</h2></div><div className="a-chat-grid">{view.scene.lines.slice(0,3).map((line,index) => <Dialogue key={`${view.scene.id}-${index}`} speaker={line.speaker} text={copy(line.text)} readAloud={readAloud}/>)}</div>{view.scene.id === 'S6-A-K' && <p className="a-risk-note">Game risk: made up for play.</p>}
            {view.scene.id === 'S8-A-K' && <div className="a-button-row">{(view.labBoostOptions ?? [{mode:'full' as const,label:'Full power · clear reading',available:true},{mode:'slow' as const,label:'Slow and save · uses both jobs',available:true}]).map(option => <div key={option.mode}><button type="button" disabled={!option.available} onClick={() => {ports.onLabBoost(option.mode);setPanel('power')}}>{option.label}</button>{option.reason && <p>{option.reason}</p>}</div>)}</div>}
            <div className="a-choice-grid">{view.scene.choices.filter(choice => !view.choices.find(item => item.id === choice.id)?.hidden).map(choice => {const availability=view.choices.find(item => item.id===choice.id);return <div key={choice.id}><button type="button" disabled={!availability?.available} onClick={() => selectChoice(choice.id)}><strong>{choice.label}</strong><span>{availability?.cost ?? copy(choice.consequence)}</span></button>{(availability?.reason || availability?.blockId) && <p className="a-block-reason">{availability.reason ?? copy(systemCopy[availability.blockId ?? ''] ?? 'This choice is not available.')}</p>}</div>})}</div>
            {view.scene.deeper && <button type="button" onClick={() => setPanel('deeper')}>Go deeper</button>}
          </section>)
  const missionPatch = (<div className="a-patch"><strong>MISSION PATCH</strong><div>{view.badges.map(badge => <span className="a-badge" key={badge}>◇ {badge}</span>)}</div>{view.selectedMessage && <p>{futureMessages.find(message => message.id===view.selectedMessage)?.text}</p>}</div>)
  const checkList = <ul className="a-home-check">{view.readiness.map(check => <li key={check.id} className={check.passed ? 'a-ready' : 'a-not-ready'}><span aria-hidden="true">{check.passed ? '✓' : '○'}</span><div><strong>{homeCheckLabels[Number(check.id.slice(1)) - 1]}</strong><p>{check.passed ? 'Ready' : 'Needs care'} · {copy(check.reason)}</p></div></li>)}</ul>
  const sciencePanel = <div className="a-science-record"><p><strong>Archived data · not live</strong></p><dl>{[['Record',view.science.id],['Title',view.science.title],['Type',view.science.type],['Observed date',view.science.observedDate],['Reported attributes',view.science.reportedAttributes],['Source',view.science.sourceName]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value.startsWith('[') ? '[data not yet loaded]' : value}</dd></div>)}</dl>{/^https:\/\//.test(view.science.sourceUrl) && <a href={view.science.sourceUrl} target="_blank" rel="noreferrer">Open source record</a>}<p>The storm in this game is a simplified lesson. Game risk levels and consequences are made up for play.</p><p>DONKI event data are not a direct Mars surface dose estimate. NASA does not endorse the game.</p></div>
  const outcomeLabel = view.outcome === 'SUCCESS' ? 'Success' : view.outcome === 'PARTIAL_SUCCESS' ? 'Partial Success' : 'Needs Another Try'
  const scienceLabel = view.scienceResult === 'positive' ? 'Ice Finder' : view.scienceResult === 'inconclusive' ? 'Mystery Marker' : 'Map Maker'
  return <div className={`a-experience${largeText ? ' a-large-text' : ''}${reducedMotion ? ' a-still' : ''}`} onClickCapture={event => {
    if (event.target instanceof Element && event.target.closest('button') && !event.target.closest('.a-read-aloud')) playUiSound()
  }}>
    {previewLabel && <div className="a-preview-label">{previewLabel}</div>}
    {view.page === 'menu' ? <>
      <MainMenu hasSave={view.hasSave} onCommand={command => {
        if (command === 'start') newMission()
        if (command === 'continue') ports.onContinue()
        if (command === 'science' || command === 'settings') setPanel(command)
      }}/>
      <div className="a-menu-secondary"><button type="button" onClick={() => requestRestart('mission')}>Restart Mission</button><button type="button" onClick={() => requestRestart('game')}>Restart Game</button></div>
    </> : <>
      <header className="a-hud"><strong>✦ ASTROBAI <small>RED FRONTIER</small></strong><div><span>Chapter {view.chapter} · {chapter.title}</span><span>Mars Day {view.sol} / 10</span></div><nav aria-label="Outpost indicators">{view.indicators.map(item => <button key={item.id} type="button" className={`a-indicator a-level-${item.level}`} onClick={() => {setIndicator(item);setPanel('indicator')}}><span aria-hidden="true">{item.symbol}</span><span>{item.label}<small>{item.level === 'good' ? 'Good' : item.level === 'watch' ? 'Watch out' : 'Danger'}</small></span></button>)}</nav><button type="button" onClick={() => setPanel('settings')}>Settings</button></header>
      {view.tutorial && <p className="a-tutorial" role="status">BAI: {view.tutorial.instruction}</p>}
      {view.page === 'prologue' ? <StoryBackdrop artwork={view.scene.artwork} className="a-prologue">
        <header className="a-chapter-banner"><span>Chapter {view.chapter} · {chapter.title}</span><h1>{view.scene.title}</h1></header>
        <div className="a-prologue-card"><div className="a-chat-grid">{view.scene.lines.slice(0,3).map((line,index) => <Dialogue key={`${view.scene.id}-${index}`} speaker={line.speaker} text={copy(line.text)} readAloud={readAloud}/>)}</div>
          <div className="a-choice-grid">{view.scene.choices.filter(choice => !view.choices.find(item => item.id === choice.id)?.hidden).map(choice => <button type="button" key={choice.id} aria-pressed={view.scene.id === 'P1-S2-K' ? cargo.includes(choice.id) : undefined} onClick={() => {
            if (view.scene.id !== 'P1-S2-K') {selectChoice(choice.id);return}
            if (cargo.includes(choice.id)) setCargo(cargo.filter(id => id !== choice.id))
            else if (cargo.length < 2) setCargo([...cargo,choice.id])
            else setHint('Only two crates fit. Put one back first.')
          }}><strong>{choice.label}</strong><span>{copy(choice.consequence)}</span></button>)}</div>
          {view.scene.id === 'P1-S2-K' && <button type="button" className="a-primary" disabled={cargo.length !== 2} onClick={() => ports.onCargo(cargo)}>Load the ship (cannot change later)</button>}
          {view.scene.deeper && <button type="button" onClick={() => setPanel('deeper')}>Go deeper</button>}
        </div>
      </StoryBackdrop> : <>
        {view.page === 'outpost' && <>
          {interiorId && <FacilityInterior key={interiorId} facilityId={interiorId} status={view.map.facilityStatuses[interiorId]} animationsEnabled={!reducedMotion} crewSheltering={view.map.environment?.crewSheltering} onExit={() => setInteriorId(null)}/>}
          {/* Retain B’s map while indoors so returning does not replay the walk. */}
          <div className="a-outpost-surface" hidden={interiorId !== null}>
          <section className="a-today"><div><span>Today’s Goal</span><h1>{view.todayGoal ?? todayGoals[view.sol - 1] ?? view.scene.title}</h1></div><div className="a-job-slots">{view.jobs.map(job => <span key={job.label}>{job.available ? '○' : '✓'} {job.label}{job.available ? ' · ready' : ' · used'}</span>)}</div><button type="button" className="a-primary" onClick={advance}>Advance Mars Day →</button></section>
          <div className="a-map-stage"><MarsMap {...view.map} isActive={interiorId === null && view.map.isActive !== false} animationsEnabled={!reducedMotion} selectedFacilityId={facility} selectedSiteId={site} onSelectFacility={id => {setFacility(id);setSite(null);ports.onInspectLocation?.(id);setHint('✧ Looking is free. You found a curiosity sparkle.')}} onSelectSite={id => {setSite(id);setFacility(null)}}/>
            <FacilityInspection facilityId={facility} statusLine={facility ? view.facilityInfo?.[facility]?.statusLine ?? view.map.facilityStatuses[facility] : undefined} site={selectedSite} enterButtonRef={enterButtonRef} onClose={() => {setFacility(null);setSite(null)}} onEnter={id => {setHint('');setInteriorId(id)}}/>
          </div>
          <nav className="a-map-site-nav" aria-label="Science site selection">{view.map.sites?.map(location => <button type="button" key={location.id} aria-pressed={site===location.id} onClick={() => {setSite(location.id);setFacility(null)}}>{location.label}<small>{location.status}</small></button>)}</nav>
          <nav className="a-bottom-nav" aria-label="Dashboard panels"><button type="button" onClick={() => setPanel('missions')}>Missions</button><button type="button" onClick={() => setPanel('power')}>Power Plan</button><button type="button" onClick={() => setPanel('science')}>Science</button><button type="button" onClick={() => setPanel('crew')}>Crew</button><button type="button" onClick={() => setPanel('journal')}>Journal</button><button type="button" onClick={() => setHint(view.baiSuggestion ? `I would try: ${view.baiSuggestion.text}. You decide!` : 'Nothing urgent today. Pick any job you like!')}>Ask BAI</button></nav>
          <section className="a-mission-strip"><div><small>Current mission</small><h2>{view.scene.title}</h2></div><button type="button" className="a-primary" onClick={() => setPanel('missions')}>Open mission briefing</button></section>
          </div>
        </>}
        {view.page === 'home-check' && <section className="a-end-panel"><h1>Ready for Home?</h1><Dialogue speaker="BAI" text="Let us check six things, one by one." readAloud={readAloud}/>{checkList}</section>}
        {view.page === 'discovery' && <section className={`a-end-panel a-discovery a-result-${view.scienceResult ?? 'pending'}`}><h1>A Discovery Worth Protecting</h1><Dialogue speaker="BAI" text="Let us count our clues." readAloud={readAloud}/><div className="a-clue-list">{view.evidence.map(item => <span key={item.label}>✧ {item.label} · {item.points}</span>)}</div><h2>{view.scienceResult ? scienceLabel : 'The lab goes quiet…'}</h2><p>{view.scienceResult === 'positive' ? 'Ice! Real water ice, under the dust!' : view.scienceResult === 'inconclusive' ? 'Hmm. Some clues point to ice. Not enough to be sure.' : view.scienceResult === 'negative' ? 'A no is a real answer. You helped draw the map!' : 'The crew waits for the reading.'}</p><p>This is a game result. Real scientists would test again.</p><h3>Message to Future Explorers</h3><div className="a-choice-grid">{futureMessages.map(message => <button type="button" key={message.id} aria-pressed={view.selectedMessage===message.id} onClick={() => ports.onMessage(message.id)}>{message.text}</button>)}</div></section>}
        {view.page === 'recap' && <section className="a-end-panel"><span className="a-badge">◇ {view.badges.includes(chapter.badge) ? chapter.badge : 'Crew Log'}</span><h1>Chapter {view.chapter} · {chapter.title}</h1><p>{copy(recapLogs[view.chapter-1].event)}</p><p>{recapLogs[view.chapter-1].learned}</p><h2>Quick Check · optional</h2><p>{quickCheck?.question ?? 'Which choice was hardest, and why?'}</p><div className="a-button-row">{(quickCheck?.answers ?? ['Power grid','Big dig','Storm','Lab power']).map((answer,index) => <button type="button" key={answer} onClick={() => setQuickAnswer(String(index))}>{answer}</button>)}<button type="button" onClick={() => setQuickAnswer('skipped')}>Skip</button></div>{quickAnswer && <p role="status">{quickAnswer === 'skipped' ? 'You can skip. Let us keep exploring.' : quickCheck ? `${quickAnswer === '0' ? 'Yes!' : 'Nice try! Here is the idea:'} ${quickCheck.reason}` : 'Thank you! Tell a friend or a grown-up why.'}</p>}<p>Quick Checks are not scored or shared.</p></section>}
        {view.page === 'outcome' && !fullDebrief && !showKidDebrief && <section className="a-end-panel"><h1>{outcomeLabel}</h1><p className="a-stars" aria-label={`${view.stars} stars`}>{'★'.repeat(view.stars)}</p><Dialogue speaker="BAI" text={view.criticalReason ?? (view.outcome === 'FAILURE' ? 'In this story, nobody is hurt. Every mission teaches us something.' : 'The crew is safe, and we learned a lot.')} readAloud={readAloud}/>{missionPatch}{checkList}<div className="a-button-row">{view.criticalReason && <button type="button" onClick={() => setPanel('journal')}>See what happened</button>}<button type="button" onClick={() => setShowKidDebrief(true)}>See Debrief</button>{view.checkpointAvailable && <button type="button" onClick={() => requestRestart('chapter')}>Try this chapter again</button>}<button type="button" onClick={() => requestRestart('sol1')}>Retry from Mars Day 1</button><button type="button" onClick={newMission}>Play Again</button></div></section>}
        {(view.page === 'debrief' || fullDebrief || showKidDebrief) && <section className="a-end-panel"><h1>Mission Debrief</h1>{!fullDebrief ? <><p>Card {kidCard+1} of 3</p>{kidCard === 0 ? <><h2>{outcomeLabel}</h2>{missionPatch}{checkList}<p>You found {view.secretsFound} of 6 secrets!</p></> : kidCard === 1 ? <div className="a-choice-grid">{view.lessons.slice(0,3).map(lesson => <article key={lesson.id}><h2>{lesson.caption}</h2><p>{lesson.text}</p></article>)}</div> : <><h2>Your hardest choice</h2><div className="a-button-row">{['Power grid','Big dig','Storm','Lab power'].map(value => <button type="button" key={value} aria-pressed={reflection===value} onClick={() => setReflection(value)}>{value}</button>)}</div>{view.nextIdeas.map(idea => <p key={idea}>{idea}</p>)}<p>Want to explore Mars again? Try a new plan!</p></>}<div className="a-button-row">{kidCard<2 && <button type="button" onClick={() => setKidCard(kidCard+1)}>Next</button>}<button type="button" onClick={() => setFullDebrief(true)}>See full debrief</button></div></> : <>
          <h2>1 · Result</h2><p>{outcomeLabel} · {view.stars} stars</p>{checkList}
          <h2>2 · Your choices</h2><ul>{view.journal.map((entry,index) => <li key={`${entry.feedbackId}-${index}`}>{entry.text}</li>)}</ul>
          <h2>3 · Science result</h2><p>{view.scienceResult ? `${view.scienceResult} counts as real science.` : 'ICEBOUND is not completed.'}</p><table><thead><tr><th>Evidence source</th><th>Clues</th></tr></thead><tbody>{view.evidence.map(item => <tr key={item.label}><td>{item.label}</td><td>{item.points}</td></tr>)}</tbody></table>
          <h2>4 · Real NASA Science</h2>{sciencePanel}
          <h2>5 · Lessons</h2>{view.lessons.map(lesson => <article key={lesson.id}><h3>{lesson.caption}</h3><p>{lesson.text}</p></article>)}
          <h2>6 · Try next time</h2>{view.nextIdeas.map(idea => <p key={idea}>{idea}</p>)}
        </>}<div className="a-button-row"><button type="button" onClick={newMission}>Play Again</button><button type="button" onClick={ports.onMainMenu}>Main Menu</button></div></section>}
      </>}
    </>}
    {hint && <div className="a-hint" role="status"><span>BAI: {hint}</span><button type="button" aria-label="Dismiss BAI hint" onClick={() => setHint('')}>×</button></div>}
    {view.saveNotice && <div className="a-save-notice" role="status"><span>{view.saveNotice.id === 'save_ok' ? '✓ Progress saved.' : view.saveNotice.id === 'save_corrupt' ? 'Oops! We could not read your saved mission. It may be damaged. You can start a new mission.' : 'This save is from an older version of the game and cannot be used. You can start a new mission.'}</span>{view.saveNotice.id !== 'save_ok' && <button type="button" onClick={newMission}>Start new mission</button>}</div>}
    {view.postcard && <Dialog title={`Mars Day ${view.sol} postcard`} onClose={ports.onPostcardDismiss}><p>{view.postcard.text}</p><ReadAloud text={view.postcard.text} enabled={readAloud}/><button type="button" onClick={ports.onPostcardDismiss}>Skip ahead</button></Dialog>}
    {view.chapterCard && <Dialog title={`Chapter ${view.chapter}: ${chapter.title}`} onClose={ports.onChapterCardDismiss}><Dialogue speaker="BAI" text={chapter.line} readAloud={readAloud}/><button type="button" onClick={ports.onChapterCardDismiss}>Let’s explore</button></Dialog>}
    {view.feedback && <Dialog title="What happened" onClose={ports.onFeedbackDismiss}><div className="a-feedback-ripple">✧ → {view.indicators.filter(item => view.feedback?.changedIndicators?.includes(item.id)).map(item => <span key={item.id}>{item.symbol}</span>)}</div>{feedback ? <>{feedback.changed && <Dialogue speaker="What changed" text={formatCopy(feedback.changed,feedbackTokens)} readAloud={readAloud}/>} {feedback.why && <Dialogue speaker="BAI · because" text={formatCopy(feedback.why,feedbackTokens)} readAloud={readAloud}/>} {feedback.summary && <p>{formatCopy(feedback.summary,feedbackTokens)}</p>}<details><summary>Your choice and what comes next</summary>{feedback.chosen && <p>You chose: {formatCopy(feedback.chosen,feedbackTokens)}</p>}{feedback.next && <p>{formatCopy(feedback.next,feedbackTokens)}</p>}</details></> : <p>Feedback text is not available for this result.</p>}<button type="button" onClick={ports.onFeedbackDismiss}>Continue</button></Dialog>}
    {panel && <Dialog title={panel === 'power' ? 'Power Plan' : panel === 'indicator' ? indicator?.label ?? 'Indicator' : panel === 'deeper' ? 'Go deeper' : panel[0].toUpperCase()+panel.slice(1)} onClose={() => setPanel(null)} hero={panel === 'missions' && ['S2-A-K','S5-B-K','S6-A-K','S8-A-K','S9-A-K'].includes(view.scene.id)}>
      {panel === 'power' && <PowerPlanPanel key={`${view.power.budget}-${view.sol}`} view={view.power} onChange={ports.onPowerDraft} onConfirm={ports.onPowerConfirm}/>}
      {panel === 'indicator' && indicator && <><Dialogue speaker="BAI" text={indicator.explanation} readAloud={readAloud}/><dl>{indicator.values.map(value => <div key={value.label}><dt>{value.label}</dt><dd>{value.value}</dd></div>)}</dl></>}
      {panel === 'science' && sciencePanel}
      {panel === 'deeper' && <><Dialogue speaker="BAI" text={scienceCards[view.scene.deeper ?? 'gd_sol'] ?? 'Let us check together.'} readAloud={readAloud}/></>}
      {panel === 'journal' && view.criticalReason && view.recentDecisions ? <ul>{view.recentDecisions.map((entry,index) => <li key={index}>{entry}</li>)}</ul> : panel === 'journal' && <ul>{view.journal.length ? view.journal.map((entry,index) => <li key={`${entry.feedbackId}-${index}`}>{entry.text}</li>) : <li>Your choices will appear here.</li>}</ul>}
      {panel === 'missions' && missionContent}
      {panel === 'crew' && <><h3>Our little crew</h3>{['Captain','Engineer','Scientist','Medic','BAI','Scout'].map(role => <p key={role}>{role}</p>)}<p>The crew is always safe in this story.</p><h3>Equipment · free inspection</h3>{view.equipment?.map(item => <article key={item.id}><h4>{item.label}</h4><p>{item.purpose}</p><p>{item.status}</p><button type="button" onClick={() => {ports.onInspectLocation?.(item.id);setHint('✧ Looking is free. You found a curiosity sparkle.')}}>Inspect {item.label}</button></article>)}</>}
      {panel === 'settings' && <div className="a-settings"><label><input type="checkbox" checked={largeText} onChange={event => changeSetting('largeText',event.target.checked)}/> Large text</label><label><input type="checkbox" checked={reducedMotion} onChange={event => changeSetting('reducedMotion',event.target.checked)}/> Reduced motion</label><label><input type="checkbox" checked={readAloud} onChange={event => changeSetting('readAloud',event.target.checked)}/> Read aloud buttons</label><label><input type="checkbox" checked={sound} onChange={event => changeSetting('sound',event.target.checked)}/> Sound preference</label><p>Your device’s reduced-motion preference is always respected.</p><div className="a-button-row"><button type="button" onClick={() => requestRestart('mission')}>Restart Mission</button><button type="button" onClick={() => requestRestart('game')}>Restart Game</button></div></div>}
    </Dialog>}
    {confirmation && <Dialog title={confirmation.title} onClose={() => setConfirmation(null)}><p>{confirmation.text}</p><div className="a-button-row"><button type="button" onClick={() => {confirmation.run();setConfirmation(null)}}>Yes, do it</button><button type="button" onClick={() => setConfirmation(null)}>Go back</button></div></Dialog>}
  </div>
}
