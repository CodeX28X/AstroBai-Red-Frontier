import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameProvider } from '../../shared/store/GameProvider.tsx'
import { PlaytestShell } from './PlaytestShell.tsx'
import './playtest.css'

// This separate HTML entry never replaces the production application.
if (import.meta.env.DEV) {
  const labPreset = new URLSearchParams(location.search).get('preset') === 'installed-lab'
  createRoot(document.getElementById('root')!).render(<StrictMode>
    <GameProvider reportActionErrors initializationOptions={labPreset ? { installedCapabilities: ['lab-analysis', 'drilling'] } : undefined}>
      <PlaytestShell labPreset={labPreset}/>
    </GameProvider>
  </StrictMode>)
} else {
  document.getElementById('root')!.textContent = 'Playtest is available on the development server only.'
}

