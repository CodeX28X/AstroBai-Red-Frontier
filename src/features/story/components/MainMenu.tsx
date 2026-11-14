import { StoryBackdrop } from './StoryBackdrop'
import type { MenuCommand } from '../types/scenes'

export function MainMenu({ onCommand, hasSave = false, assetBaseUrl }: { readonly onCommand: (command: MenuCommand) => void; readonly hasSave?: boolean; readonly assetBaseUrl?: string }) {
  return <StoryBackdrop artwork="menu-dusk" assetBaseUrl={assetBaseUrl} className="a-story-menu">
    <header className="a-story-title"><p>A MARS ADVENTURE</p><h1>ASTROBAI</h1><span>RED FRONTIER</span></header>
    <nav aria-label="Main menu" className="a-story-menu-actions">
      <button type="button" onClick={() => onCommand('start')}>New Mission <span aria-hidden="true">→</span></button>
      {hasSave && <button type="button" onClick={() => onCommand('continue')}>Continue Mission</button>}
      <button type="button" onClick={() => onCommand('science')}>Real NASA science</button>
      <button type="button" onClick={() => onCommand('settings')}>Settings</button>
    </nav>
    <p className="a-story-menu-footer">Your choices. Our little crew. One red planet.</p>
  </StoryBackdrop>
}
