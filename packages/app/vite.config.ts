import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';

// Content-Security-Policy for the production build. Injected only at build time
// so Vite's dev server / HMR (which relies on inline module preambles) keeps
// working. Directives explained:
//   script-src 'unsafe-eval' — benötigt von AJV: JSONForms kompiliert
//     Schemas zur Validierung per `new Function` (Vorschau-Modus). Monaco
//     braucht es nicht.
//   style-src 'unsafe-inline'  — required by Emotion/MUI runtime styles.
//   worker-src 'self' blob:    — Monaco-Worker werden als eigene Dateien
//     gebündelt (?worker-Rezept); blob: als Fallback für Vite-Worker-Helper.
//   connect-src fimportal.de   — FIM-Portal API.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-eval'",
  "worker-src 'self' blob:",
  "connect-src 'self' https://fimportal.de",
].join('; ');

const cspPlugin = (): Plugin => ({
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml(html) {
    return html.replace(
      '</title>',
      `</title>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
    );
  },
});

/**
 * Seit Vite 8 (Rolldown statt Rollup) löst der Bundler einen bloßen
 * Paketpfad mit `?worker`-Suffix nicht mehr auf — der Monaco-Worker-Import
 * scheiterte deshalb im Build. Ein Alias auf das tatsächliche
 * Paketverzeichnis behebt das unabhängig davon, ob npm monaco-editor
 * hoisted oder in den Workspace legt; ein relativer `../../node_modules`-
 * Pfad wäre genau davon abhängig.
 */
// Der Paketstamm wird über den Haupteinstieg (min/vs/index.js) ermittelt:
// Die exports-Karte von monaco-editor lässt weder package.json noch die
// esm/-Pfade direkt auflösen.
const monacoVerzeichnis = resolve(
  dirname(createRequire(import.meta.url).resolve('monaco-editor')),
  '../..',
);

// In dev, alias the editor package to its source for instant hot-reload.
// In production the workspace link resolves to the built dist/.
export default defineConfig(({ command }) => {
  const alias: Record<string, string> = {
    'monaco-editor': monacoVerzeichnis,
    ...(command === 'serve'
      ? {
          '@jsonforms-designer/editor': resolve(
            import.meta.dirname,
            '../editor/src/index.ts',
          ),
        }
      : {}),
  };

  return {
    plugins: [react(), cspPlugin()],
    resolve: { alias },
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'build',
      sourcemap: true,
    },
  };
});
