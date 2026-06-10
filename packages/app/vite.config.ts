import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';

// Content-Security-Policy for the production build. Injected only at build time
// so Vite's dev server / HMR (which relies on inline module preambles) keeps
// working. Directives explained:
//   script-src 'unsafe-eval' + worker blob: + cdn.jsdelivr.net — required by
//     the Monaco editor runtime (loaded/pinned via @monaco-editor/loader).
//   style-src 'unsafe-inline'  — required by Emotion/MUI runtime styles.
//   connect-src fimportal.de    — FIM-Portal API; cdn.jsdelivr.net — Monaco.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
  "connect-src 'self' https://fimportal.de https://cdn.jsdelivr.net",
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
