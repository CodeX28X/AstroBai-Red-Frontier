import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MarsMapPreview from './MarsMapPreview';
import { GameProvider } from '../../../shared/store/GameProvider';
import './style.css';
import './GameScreen.css';
import './FieldStyle.css';
import './ViewportGame.css';

createRoot(document.getElementById('root')!).render(<StrictMode><GameProvider><MarsMapPreview/></GameProvider></StrictMode>);
