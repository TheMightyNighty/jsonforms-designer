import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The editor builds as a library: React, ReactDOM and the heavy UI/peer
// libraries are externalized so the consuming app provides a single copy.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'JsonFormsDesigner',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@emotion/react',
        '@emotion/styled',
        '@mui/material',
        '@mui/icons-material',
        '@mui/x-tree-view',
        '@jsonforms/core',
        '@jsonforms/react',
        '@jsonforms/material-renderers',
        'react-dnd',
        'react-dnd-html5-backend',
      ],
    },
    sourcemap: true,
  },
});
