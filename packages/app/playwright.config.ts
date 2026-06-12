import { defineConfig, devices } from '@playwright/test';

/**
 * E2E-Smoke-Tests gegen den Produktions-Build (vite preview).
 *
 * Bewusst gegen den Build statt den Dev-Server: nur so werden CSP,
 * self-hosted Monaco und das gebaute editor-dist mitgetestet.
 * Voraussetzung: `npm run build` wurde vorher ausgeführt
 * (Root-Skript `npm run test:e2e` erledigt beides).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
