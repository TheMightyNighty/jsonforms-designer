/**
 * Self-hosted Monaco-Runtime.
 *
 * `@monaco-editor/react` lädt Monaco standardmäßig zur Laufzeit über
 * `@monaco-editor/loader` von cdn.jsdelivr.net — in abgeschotteten Netzen
 * (Behörden-Intranet) fällt der Code-Modus damit aus. Die hier übergebene,
 * lokal gebündelte Instanz unterbindet jeden CDN-Zugriff; die Worker werden
 * über das Vite-`?worker`-Rezept als eigene Dateien emittiert
 * (CSP: `worker-src 'self'`).
 *
 * Sicherheit: monaco-editor ≥ 0.54 deklariert `dompurify` als Dependency und
 * pinnt eine verwundbare Version (u. a. GHSA-v2wj-7wpq-c8vv). Der Root-Override
 * in package.json erzwingt dompurify ≥ 3.4.9 — `npm audit` bleibt sauber.
 *
 * Muss vor dem ersten Mount eines `<Editor>` importiert werden (main.tsx).
 */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string): Worker {
    return label === 'json' ? new jsonWorker() : new editorWorker();
  },
};

loader.config({ monaco });
