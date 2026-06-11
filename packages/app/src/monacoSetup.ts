/**
 * Monaco-Worker-Umgebung (Vite-spezifischer Teil des Self-Hostings).
 *
 * Die Worker werden über das Vite-`?worker`-Rezept als eigene Dateien
 * gebündelt (CSP: `worker-src 'self'`) und vom Browser erst beim ersten
 * `new Worker()` geladen — dieser Eager-Import kostet nur winzige Wrapper.
 *
 * Die Monaco-*Instanz* selbst (~1 MB gzip) konfiguriert der Editor
 * bundler-agnostisch im Lazy-Chunk des Code-Modus
 * (packages/editor/src/editor/components/monacoSetup.ts) — sie wird erst
 * beim Öffnen des Code-Modus geladen, niemals von einem CDN.
 *
 * Sicherheit: monaco-editor ≥ 0.54 pinnt eine verwundbare
 * dompurify-Version; der Root-Override erzwingt dompurify ≥ 3.4.9
 * (siehe package.json "overrides"). `npm audit` bleibt sauber.
 */
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string): Worker {
    return label === 'json' ? new jsonWorker() : new editorWorker();
  },
};
