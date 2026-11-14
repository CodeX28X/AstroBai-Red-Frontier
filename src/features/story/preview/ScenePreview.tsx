import { useRef, useState } from 'react'
import { MainMenu, SceneFrame, StoryBackdrop, sceneArtwork } from '../index'
import type { MenuCommand, StoryArtwork } from '../index'

export function ScenePreview() {
  const [artwork, setArtwork] = useState<StoryArtwork>('menu-dusk')
  const [mode, setMode] = useState<'menu' | 'frame' | 'art'>('menu')
  const [notice, setNotice] = useState('Preview only. No game state is connected.')
  const [dialogTitle, setDialogTitle] = useState('Settings')
  const dialog = useRef<HTMLDialogElement>(null)
  const scene = sceneArtwork.find(item => item.id === artwork)!
  function menuCommand(command: MenuCommand) {
    if (command === 'start') {
      setArtwork('launch-pad'); setMode('frame')
      setNotice('Start callback received. Showing launch artwork, without starting a game.')
    } else if (command === 'settings' || command === 'science') {
      setDialogTitle(command === 'settings' ? 'Settings integration' : 'Science content integration')
      dialog.current?.showModal()
    }
  }
  return <main className="handoff-shell">
    <header className="handoff-header"><div><p>DEVELOPER A · ART + SCENE STARTER</p><h1>Scene workshop</h1></div><span>Isolated handoff · v2.0 presentation</span></header>
    <div className="handoff-workspace">
      <aside className="handoff-library" aria-label="Scene artwork library"><h2>Supplied artwork</h2><p>Choose a backdrop to try it.</p>{sceneArtwork.map(item => <button type="button" key={item.id} aria-pressed={artwork === item.id} onClick={() => { setArtwork(item.id); setMode('frame') }}><span aria-hidden="true">{artwork === item.id ? '◆' : '◇'}</span>{item.label}</button>)}</aside>
      <section className="handoff-stage" aria-label="Scene preview">
        <nav aria-label="Preview layout" className="handoff-modes"><button type="button" aria-pressed={mode === 'menu'} onClick={() => { setArtwork('menu-dusk'); setMode('menu') }}>Menu mockup</button><button type="button" aria-pressed={mode === 'frame'} onClick={() => setMode('frame')}>Scene frame</button><button type="button" aria-pressed={mode === 'art'} onClick={() => setMode('art')}>Artwork only</button></nav>
        {mode === 'menu' ? <MainMenu onCommand={menuCommand} /> : mode === 'art' ? <StoryBackdrop artwork={artwork} /> : <SceneFrame artwork={artwork} chapterLabel="LAYOUT PREVIEW · NOT A MISSION EVENT" title={scene.label} speaker="Preview" dialogue="A can place the approved short dialogue here.">
          <button className="handoff-preview-button" type="button" onClick={() => setNotice('Presentation callback received. No resources, missions or action slots changed.')}>Test presentation callback</button>
        </SceneFrame>}
        <p className="handoff-description">{scene.description}</p>{scene.note && <p className="handoff-note">{scene.note}</p>}
        <p role="status" className="handoff-notice">{notice}</p>
      </section>
    </div>
    <footer className="handoff-footer">The interactive outpost stays in Developer B’s feature. State, validation and outcomes stay with C/D. Reference dashboards are images, not live controls.</footer>
    <dialog ref={dialog} className="handoff-dialog" aria-labelledby="handoff-dialog-title"><h2 id="handoff-dialog-title">{dialogTitle}</h2><p>This is a handoff preview. A connects this callback to her existing screen. Member E supplies reviewed educational content; no NASA record is invented here.</p><form method="dialog"><button type="submit">Close</button></form></dialog>
  </main>
}
