import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    // E2E-Specs gehören Playwright, nicht Vitest
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
