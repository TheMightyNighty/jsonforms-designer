import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In dev, alias the editor package to its source for instant hot-reload.
// In production the workspace link resolves to the built dist/.
export default defineConfig(({ command }) => {
  const alias: Record<string, string> =
    command === 'serve'
      ? { '@jsonforms-designer/editor': resolve(import.meta.dirname, '../editor/src/index.ts') }
      : {};

  return {
    plugins: [react()],
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
