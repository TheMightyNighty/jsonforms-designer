/**
 * Monaco-Worker-Umgebung (Vite-`?worker`-Rezept, CSP: `worker-src 'self'`).
 * Die Worker-Dateien lädt der Browser erst beim ersten `new Worker()`.
 * Die Monaco-Instanz selbst konfiguriert der Editor im Lazy-Chunk des
 * Code-Modus (editor/components/monacoSetup.ts) — kein CDN-Zugriff.
 * dompurify-Override für monaco-editor: siehe package.json "overrides".
 */
// Pfade ohne `esm/vs/`: Monaco 0.57 bildet in seiner exports-Karte
// `"./*"` auf `./esm/vs/*.js` ab. Der frühere Pfad mit `esm/vs/` löste
// dadurch ins Leere (`esm/vs/esm/vs/...`) — sichtbar erst als
// Build-Fehler, im Dev-Server als weiße Seite.
import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/language/json/json.worker?worker';

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string): Worker {
    return label === 'json' ? new jsonWorker() : new editorWorker();
  },
};
