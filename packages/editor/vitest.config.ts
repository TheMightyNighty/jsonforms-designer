import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      // Regressions-Gate: Schwellwerte liegen knapp unter dem Ist-Stand
      // und werden mit wachsender Abdeckung angehoben — nie abgesenkt.
      //
      // Neu kalibriert mit dem Wechsel auf Vitest 5 (2026-09). Dessen
      // v8-Provider wertet AST-genau aus statt über rohe Bereichszähler:
      // Lines und Statements steigen dadurch stark (26 → 66 %), Branches
      // sinken (74 → 50 %), **ohne dass sich an den Tests etwas geändert
      // hat**. Die alten Zahlen sind mit den neuen nicht vergleichbar;
      // die Nur-anheben-Politik beginnt hier von vorn.
      thresholds: {
        lines: 65,
        statements: 64,
        branches: 49,
        functions: 58,
      },
    },
  },
});
