import { resolve } from 'node:path';

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
// Katalog-Modus: Keycloak und Redaktions-API liegen im Betrieb hinter
// demselben Origin. Liegen sie anderswo (lokale Entwicklung gegen den
// VSP-Stack), müssen ihre Origins in connect-src stehen.
function fremdeOrigins(): string[] {
  return [process.env.VITE_OIDC_AUTHORITY, process.env.VITE_KATALOG_API]
    .filter((a): a is string => !!a && /^https?:\/\//.test(a))
    .map((a) => new URL(a).origin);
}

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
  ["connect-src 'self' https://fimportal.de", ...fremdeOrigins()].join(' '),
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

// In dev, alias the editor package to its source for instant hot-reload.
// In production the workspace link resolves to the built dist/.
export default defineConfig(({ command }) => {
  const alias: Record<string, string> =
    command === 'serve'
      ? {
          '@jsonforms-designer/editor': resolve(
            import.meta.dirname,
            '../editor/src/index.ts',
          ),
        }
      : {};

  return {
    // Unterpfad, wenn der Designer z. B. unter /designer/ ausgeliefert wird.
    base: process.env.DESIGNER_BASE ?? '/',
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
