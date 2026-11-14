import { useEffect, useRef, useState } from 'react';
import { MarsMap } from '../components/mars/MarsMap';
import { FacilityArt } from '../components/mars/FacilityArt';
import { marsLocations } from '../data/marsLocations';
import type { ExpeditionKind, FacilityId, MarsEnvironment } from '../types/marsMap';
import { FacilityVisualDemoControls } from '../demo/FacilityVisualDemo';
import { useFacilityVisualDemo } from '../demo/useFacilityVisualDemo';
import { explorationDemo } from '../demo/explorationDemo';
import { EnvironmentDemoControls } from '../demo/EnvironmentDemoControls';
import { FacilityInterior } from '../components/mars/FacilityInterior';
import { GameViewport } from '../components/mars/GameViewport';

// Debug fixtures are opt-in locally and cannot be enabled in a production build.
const debugEnabled = import.meta.env.DEV && new URLSearchParams(window.location.search).get('debug') === '1';

export default function App() {
  const [interiorId, setInteriorId] = useState<FacilityId | null>(null);
  const [developerOpen, setDeveloperOpen] = useState(false);
  const developerDialog = useRef<HTMLDialogElement>(null);
  const enterButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (interiorId === null) enterButtonRef.current?.focus(); }, [interiorId]);
  const [selectedId, setSelectedId] = useState<FacilityId | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [proposedKind, setProposedKind] = useState<ExpeditionKind>('rover');
  const [proposal, setProposal] = useState('');
  const [environment, setEnvironment] = useState<MarsEnvironment>({});
  const [previewCompletion, setPreviewCompletion] = useState(false);
  const selected = marsLocations.find(location => location.id === selectedId);
  const selectedSite = explorationDemo.find(site => site.id === selectedSiteId);
  const demo = useFacilityVisualDemo();
  useEffect(() => {
    const dialog = developerDialog.current;
    if (developerOpen && dialog && !dialog.open) dialog.showModal();
    if (!developerOpen && dialog?.open) dialog.close();
  }, [developerOpen]);
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (developerOpen || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      if (event.target instanceof HTMLElement && (event.target.matches('input,select,textarea') || event.target.isContentEditable)) return;
      if (interiorId) return;
      const index = Number(event.key) - 1;
      if (/^[1-4]$/.test(event.key)) {
        setSelectedId(marsLocations[index].id); setSelectedSiteId(null); setProposal('');
      }
      if (event.key.toLowerCase() === 'e' && selectedId) setInteriorId(selectedId);
      if (event.key === 'Escape') { setSelectedId(null); setSelectedSiteId(null); setProposal(''); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [developerOpen, interiorId, selectedId]);
  const cardOnLeft = (selected?.position.x ?? selectedSite?.position.x ?? 0) >= 50;
  return <GameViewport><main className={`game-shell viewport-game${interiorId ? ' is-indoors' : ''}`}>
    <header className="game-hud"><div className="game-logo"><span className="logo-emblem" aria-hidden="true">✦</span><span>ASTROBAI <small>RED FRONTIER</small></span></div><div className="hud-location"><span className="hud-beacon" aria-hidden="true"/> {interiorId ? 'FACILITY INTERIOR' : 'MARS SURFACE'} <span>OUTPOST + ICEBOUND</span></div><div className="hud-actions"><button type="button" className="hud-button" onClick={()=>setDeveloperOpen(true)} aria-haspopup="dialog">⚙ Settings</button></div></header>
    {interiorId && <FacilityInterior key={interiorId} facilityId={interiorId} status={demo.statuses[interiorId]} animationsEnabled={demo.animationsEnabled} crewSheltering={environment.crewSheltering} onExit={() => setInteriorId(null)}/>}
    <div className="outpost-view" hidden={interiorId !== null}>
    <div className="scene-caption"><span><strong>Outpost field map</strong></span><span>Buildings below. Science sites at the edges.</span></div>
    <div className="game-world">
      <MarsMap isActive={interiorId === null} environment={environment} completionNotice={debugEnabled && previewCompletion ? { id: 'completion-fixture', message: 'Investigation complete' } : undefined} selectedFacilityId={selectedId} onSelectFacility={id => { setSelectedId(id); setSelectedSiteId(null); setProposal(''); }} facilityStatuses={demo.statuses} animationsEnabled={demo.animationsEnabled} sites={explorationDemo} selectedSiteId={selectedSiteId} onSelectSite={id => { setSelectedSiteId(id); setSelectedId(null); setProposal(''); }}/>
    </div>
    <nav className="facility-dock" aria-label="Quick facility selection"><span className="dock-title">YOUR BASE</span>{marsLocations.map((location, index) => <button type="button" key={location.id} aria-pressed={selectedId === location.id} onClick={() => { setSelectedId(location.id); setSelectedSiteId(null); setProposal(''); }}><span className="dock-number" aria-hidden="true">0{index + 1}</span><span>{location.label}</span></button>)}</nav>
    <nav className="mobile-science-dock" aria-label="Science site selection">{explorationDemo.map(site=><button type="button" key={site.id} aria-pressed={selectedSiteId===site.id} onClick={()=>{setSelectedSiteId(site.id);setSelectedId(null);setProposal('');}}>{site.label}<small>{site.status}</small></button>)}</nav>
    <section className={`game-console ${selected || selectedSite ? `context-card ${cardOnLeft ? 'card-left' : 'card-right'}` : 'is-empty'}`} aria-label="Inspection and exploration">
      {selected || selectedSite ? <><button className="close-inspection" type="button" onClick={() => { setSelectedId(null); setSelectedSiteId(null); setProposal(''); }} aria-label="Close inspection">×</button>
        {selected ? <><div className="console-art"><FacilityArt id={selected.id}/></div><div className="console-copy"><p className="eyebrow">{selected.shortLabel} / {demo.statuses[selected.id]}</p><h1>{selected.label}</h1><p>{selected.detail}</p><small>Inspection is always free.</small><button ref={enterButtonRef} className="enter-facility" type="button" onClick={()=>setInteriorId(selected.id)}>Enter {selected.label} →</button></div></> : selectedSite && <div className="console-copy"><p className="eyebrow">ICEBOUND / {selectedSite.status}</p><h1>{selectedSite.label}</h1><p>{selectedSite.status === 'locked' ? 'This site is locked. You can still look around the outpost.' : selectedSite.status === 'active' ? `Assigned team: ${selectedSite.assignment ?? 'expedition crew'}.` : selectedSite.status === 'completed' ? 'This location has already been studied.' : 'Choose a team to preview an expedition plan.'}</p>
          {selectedSite.status === 'available' && <div className="expedition-controls"><label>Proposed team <select value={proposedKind} onChange={event => setProposedKind(event.target.value as ExpeditionKind)}><option value="rover">Rover</option><option value="astronaut">Astronaut</option><option value="combined">Combined</option></select></label><button type="button" onClick={() => setProposal(`${proposedKind} request preview for ${selectedSite.label}. Not dispatched: shared mission validation is not connected.`)}>Preview request</button></div>}
        </div>}
      </> : <p className="map-hint">Choose a building to look inside.</p>}
      <p className="proposal-feedback" role="status">{proposal}</p>
    </section>
    </div>
    <footer className="game-footer"><span>{interiorId ? 'ESC · BACK TO OUTPOST' : '1–4 · SELECT BUILDING     E · ENTER'}</span><span>Inspection is free</span></footer>
    <dialog ref={developerDialog} className="developer-dialog" aria-labelledby="developer-title" onCancel={()=>setDeveloperOpen(false)} onClose={()=>setDeveloperOpen(false)}><header><h2 id="developer-title">Settings</h2><button type="button" onClick={()=>setDeveloperOpen(false)}>Close ×</button></header><label className="motion-control player-motion-option"><input type="checkbox" checked={demo.animationsEnabled} onChange={event=>demo.setAnimationsEnabled(event.target.checked)}/> Ambient animation</label><p>Your device’s reduced-motion preference is always respected.</p>{debugEnabled && <><hr/><h3>Development fixtures</h3><p>Visual previews only. No resource or mission changes.</p><FacilityVisualDemoControls selectedId={selectedId} selectedLabel={selected?.label} {...demo}/><EnvironmentDemoControls environment={environment} onChange={setEnvironment}/><label className="motion-control"><input type="checkbox" checked={previewCompletion} onChange={event=>setPreviewCompletion(event.target.checked)}/> Show completion notice</label></>}</dialog>
  </main></GameViewport>;
}

