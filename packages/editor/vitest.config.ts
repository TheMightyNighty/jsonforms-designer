import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      // Regressions-Gate: Schwellwerte liegen knapp unter dem Ist-Stand
      // (gemessen 2026-06: 28 % Lines, 78 % Branches, 66 % Functions) und
      // werden mit wachsender Abdeckung angehoben — nie abgesenkt.
      thresholds: {
        lines: 26,
        statements: 26,
        branches: 74,
        functions: 60,
      },
    },
  },
});
