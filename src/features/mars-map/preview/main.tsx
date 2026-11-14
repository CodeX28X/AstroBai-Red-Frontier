import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MarsMapPreview from './MarsMapPreview';
import './style.css';
import './GameScreen.css';
import './FieldStyle.css';
import './ViewportGame.css';

createRoot(document.getElementById('root')!).render(<StrictMode><MarsMapPreview/></StrictMode>);
