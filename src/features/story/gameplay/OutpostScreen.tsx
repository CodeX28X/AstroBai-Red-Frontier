import { useEffect, useRef, useState } from 'react'
import { MarsMap, FacilityInterior, type FacilityId, type FacilityStatus } from '../../mars-map/index.ts'
import { FacilityInspection } from '../components/FacilityInspection.tsx'
import { OutpostSlot } from '../components/OutpostSlot.tsx'
import { Dialog } from '../components/Dialog.tsx'
import { useIceboundExploration, IceboundSiteDetails } from '../../mars-map/index.ts'
import { iceboundMapCommand } from '../../mars-map/integration/iceboundExploration.ts'
import { nextDayForecast } from '../../simulation/outpostSimulation.ts'
import { IceboundMission } from './IceboundMission.tsx'
import { MissionReport } from './MissionReport.tsx'
import { ConfirmButton, Costs, type ScreenProps } from './ui.tsx'
import { resourceNames } from './labels.ts'
import { BaseCarePanel } from './BaseCarePanel.tsx'
import { LaboratoryPanel } from './LaboratoryPanel.tsx'
import { SupplyStrip } from './SupplyStrip.tsx'

export function OutpostScreen({ state, send, reducedMotion = false }: ScreenProps & { reducedMotion?: boolean }) {
  const [tab, setTab] = useState<'mission'|'base'|'report'>('mission')
  const [facility, setFacility] = useState<FacilityId | null>(null)
  const [inspected, setInspected] = useState<string | null>(null)
  const [pendingSite, setPendingSite] = useState<string | null>(null)
  const [interior, setInterior] = useState<FacilityId | null>(null)
  const [motion, setMotion] = useState(false)
  const enterButton = useRef<HTMLButtonElement>(null)
  const returning = useRef(false)
  useEffect(() => {
    if (interior !== null) { returning.current = true; return }
    if (returning.current) { enterButton.current?.focus(); returning.current = false }
  }, [interior])
  const view = useIceboundExploration()
  const site = view.sites.find(item => item.id === inspected)
  const facilities: Record<FacilityId, FacilityStatus> = {
    habitat: state.facilities.habitat, 'solar-array': state.facilities['solar-array'], greenhouse: state.facilities.greenhouse,
    'research-lab': state.iceboundReadiness.laboratoryOperational && state.facilities.habitat === 'operational' ? 'operational' : 'offline',
  }
  const openRoom = (id: FacilityId) => { setFacility(id); setInspected(null); setInterior(id) }
  const forecast = nextDayForecast(state)
  const danger = forecast.shortages.map(key => resourceNames[key]).join(', ')
  const ended = state.outcome !== null || state.sol >= state.actionLimits.maxSol
  const nextQuestion = danger ? danger + ' will run out overnight. Ending the day now will end your mission. Continue anyway?' :
    state.sol === 9 ? 'Finish the last day and read your mission report? Unfinished research will stay unfinished.' :
    'End this day? Your crew will use supplies overnight. Tomorrow you get two big jobs again.'
  return <section>
    <div className="mvp-day-heading"><div><small>{state.sol === 0 ? 'Arrival day' : 'Day ' + state.sol + ' of 10'}</small>
      <h1>{danger ? 'Top up your supplies first' : state.sol < 3 ? 'Settle into your Mars base' : state.icebound.report ? 'Care for your base' : 'Care for the base. Explore Mars.'}</h1></div>
      <div className="mvp-jobs" aria-label={state.actionsRemaining + ' of 2 big jobs left today'}>
        <span aria-hidden="true">{state.actionsRemaining >= 1 ? '●' : '○'} {state.actionsRemaining >= 2 ? '●' : '○'}</span>
        <small>{state.actionsRemaining}/2 big jobs left</small>
      </div>
      <ConfirmButton disabled={ended} question={nextQuestion} onConfirm={() => send({ type: 'ADVANCE_SOL', expectedSol: state.sol })}>{state.sol === 9 ? 'Finish mission' : 'End day'}</ConfirmButton>
    </div>
    <SupplyStrip state={state} onOpenRoom={openRoom}/>
    {danger && <p className="mvp-supply-warning" role="status">{danger} needs a refill before bedtime. Tap the supply above to open the right room.</p>}
    {interior && <FacilityInterior facilityId={interior} status={facilities[interior]} animationsEnabled={motion && !reducedMotion} onExit={() => setInterior(null)}
      activityPanel={interior === 'research-lab' ? <LaboratoryPanel state={state} send={send}/> :
        <BaseCarePanel state={state} send={send} operation={interior === 'solar-array' ? 'recharge' : interior === 'greenhouse' ? 'harvest' : 'recycle'}/>}/>}
    <div hidden={!!interior}>
      <OutpostSlot heading="Your Mars base" toolbar={<label className="mvp-motion-toggle"><input type="checkbox" checked={motion} onChange={e => setMotion(e.target.checked)}/>Animations</label>}
        details={site ? <IceboundSiteDetails site={site} onSelect={setPendingSite}/> : undefined}>
        <div className="a-map-stage"><MarsMap facilityStatuses={facilities} selectedFacilityId={facility} onSelectFacility={id => {setFacility(id); setInspected(null)}}
          sites={view.sites} selectedSiteId={view.selectedSiteId} onSelectSite={id => {setInspected(id); setFacility(null)}} animationsEnabled={motion && !reducedMotion} isActive={!interior}
          completionNotice={view.completionNotice}/>
          <FacilityInspection facilityId={facility} onClose={() => setFacility(null)} enterButtonRef={enterButton}
            entryBlockedReason={facility && facilities[facility] === 'unbuilt' ? 'This room has not been built.' : undefined}
            statusLine={facility ? facilities[facility] === 'operational' ? 'Ready to use' : 'Not ready yet' : undefined}
            onEnter={openRoom}/>
        </div>
      </OutpostSlot>
      <nav className="mvp-room-nav" aria-label="Visit a room">
        <button type="button" onClick={() => openRoom('habitat')}>Home · air & water</button>
        <button type="button" onClick={() => openRoom('solar-array')}>Solar · energy</button>
        <button type="button" onClick={() => openRoom('greenhouse')}>Greenhouse · food</button>
        <button type="button" onClick={() => openRoom('research-lab')}>Lab · samples</button>
      </nav>
      <nav className="a-bottom-nav" aria-label="Outpost views">
        <button type="button" aria-pressed={tab === 'mission'} onClick={() => setTab('mission')}>My research</button>
        <button type="button" aria-pressed={tab === 'base'} onClick={() => setTab('base')}>My base</button>
        <button type="button" aria-pressed={tab === 'report'} onClick={() => setTab('report')}>My report</button>
      </nav>
      <div hidden={tab !== 'mission'}><IceboundMission state={state} send={send} onOpenLab={() => openRoom('research-lab')}/></div>
      {tab === 'base' && <section className="mvp-panel"><h2>Keep your crew supplied</h2>
        <p>Base care and research share two big jobs each day. Visiting rooms is always free.</p>
        <BaseCarePanel state={state} send={send}/>
        <details><summary>What happens overnight?</summary><p>The crew uses these game supply units each night:</p>
          <Costs resources={forecast.use}/><p>Keep every supply above zero after this use. If supplies run out, the crew stays in shelter and the mission ends.</p>
          <p>Crew ready for outside work: {state.iceboundReadiness.crewSafeForEva ? 'yes' : 'not now'}.</p>
        </details>
      </section>}
      {tab === 'report' && <MissionReport state={state}/>}
    </div>
    {pendingSite && <Dialog title="Choose this research site?" onClose={() => setPendingSite(null)}>
      <p>{view.sites.find(item => item.id === pendingSite)?.label} will be the one research site for this investigation.</p>
      <div className="a-button-row"><button type="button" onClick={() => {send(iceboundMapCommand(state, pendingSite)); setPendingSite(null)}}>Choose this site</button>
        <button type="button" onClick={() => setPendingSite(null)}>Keep comparing</button></div>
    </Dialog>}
  </section>
}

