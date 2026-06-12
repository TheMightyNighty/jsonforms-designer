# Mitwirken am JSONForms Designer

Danke für dein Interesse! Diese Seite fasst Setup, Konventionen und
Qualitäts-Gates zusammen.

## Setup

```bash
# Node-Version siehe .nvmrc (nvm use)
npm install
npm run dev          # Dev-Server auf http://localhost:3000
```

## Projektstruktur

| Pfad | Inhalt |
|---|---|
| `packages/editor` | `@jsonforms-designer/editor` — einbettbare Bibliothek |
| `packages/app` | Vite-Host-Anwendung (Deployment-Artefakt) |
| `docs/adr/` | Architektur-Entscheidungen (ADRs) |

## Qualitäts-Gates (laufen in der CI bei jedem PR)

```bash
npm run lint          # ESLint (Flat-Config, kein `any`)
npm run format:check  # Prettier
npm run typecheck     # tsc --noEmit, beide Pakete
npm test              # Vitest (Unit, packages/editor)
npm run build         # editor-dist + app-Build
npm run test:e2e      # Playwright-Smoke gegen den Prod-Build (baut vorher)
```

Hinweis E2E lokal: Playwright-Browser einmalig installieren —
`npx playwright install chromium`. Auf noch nicht unterstützten
Ubuntu-Versionen: `PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64`
voranstellen.

## Konventionen

- **Sprache:** Neue Module, Kommentare, Tests und Commit-Messages auf
  Deutsch; der geerbte eclipsesource-Kern bleibt englisch.
- **TypeScript:** `no-explicit-any` ist Fehler — konkrete Typen oder
  `unknown` mit gezielten Casts verwenden.
- **State:** `FieldAwareState` ist die einzige Laufzeit-Quelle
  (ADR 0001) — keine neuen Zuflüsse in den geerbten Baum-State.
- **Tests:** Neue Logik (Reducer, Utils, Services) bekommt Unit-Tests;
  neue UI-Kernpfade einen E2E-Smoke. Security-relevanter Code
  (Sanitizing, Escaping, HTTP-Clients) wird immer getestet.
- **Commits:** Conventional-Commit-Präfixe (`feat:`, `fix:`, `test:`,
  `refactor:`, `chore:`, `ci:`, `docs:`, `style:`); Begründung in den
  Body, kein Co-Authored-By-Trailer.
- **Abhängigkeiten:** Keine Laufzeit-CDN-Zugriffe (Intranet-Fähigkeit!);
  `npm audit` muss sauber bleiben — Overrides siehe Root-`package.json`.

## Screenshots aktualisieren

```bash
npm run build
cd packages/app
GEN_SCREENSHOTS=1 npx playwright test screenshots.gen
```

Erzeugt `docs/screenshot-{visual,code,fim}.png` deterministisch
(FIM-Antworten gemockt).

## Architektur-Entscheidungen

Größere Richtungsentscheidungen werden als ADR unter `docs/adr/`
dokumentiert (Kontext → Entscheidung → Konsequenzen). Bestehende ADRs
bitte lesen, bevor angrenzende Bereiche umgebaut werden.
