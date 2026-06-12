// Self-hosted icon font (kein CDN).
import '@tabler/icons-webfont/dist/tabler-icons.min.css';
// Monaco-Worker-Umgebung (Vite-?worker-Rezept).
import './monacoSetup';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
