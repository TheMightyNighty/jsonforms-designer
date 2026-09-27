/**
 * Monaco-Worker-Umgebung (Vite-`?worker`-Rezept, CSP: `worker-src 'self'`).
 * Die Worker-Dateien lädt der Browser erst beim ersten `new Worker()`.
 * Die Monaco-Instanz selbst konfiguriert der Editor im Lazy-Chunk des
 * Code-Modus (editor/components/monacoSetup.ts) — kein CDN-Zugriff.
 * dompurify-Override für monaco-editor: siehe package.json "overrides".
 */
// Mit ausdrücklicher .js-Endung: Rolldown (seit Vite 8) löst den bloßen
// Paketpfad mit ?worker-Suffix nicht mehr auf.
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker';

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string): Worker {
    return label === 'json' ? new jsonWorker() : new editorWorker();
  },
};
