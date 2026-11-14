import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ScenePreview } from './ScenePreview'
import { DeveloperADemo } from './DeveloperADemo'
import './preview.css'

// Standalone handoff preview only. Do not replace the team's main.tsx with this.
const gallery = new URLSearchParams(window.location.search).get('gallery') === '1'
createRoot(document.getElementById('root')!).render(<StrictMode>{gallery ? <ScenePreview /> : <DeveloperADemo />}</StrictMode>)
