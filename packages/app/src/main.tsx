// Vendored Tabler-Icon-Font (MIT) — siehe assets/tabler-icons/LICENSE.
import './assets/tabler-icons/tabler-icons.min.css';
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
