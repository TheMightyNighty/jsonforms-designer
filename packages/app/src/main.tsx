// Self-hosted icon font (previously loaded from a CDN without SRI).
import '@tabler/icons-webfont/dist/tabler-icons.min.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
