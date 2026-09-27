# Roadmap

Stand: Juni 2026. Reihenfolge = grobe Priorität; keine Terminzusagen.

## Kriterien für 1.0

Eine 1.0 ist ein Stabilitätsversprechen (Breaking nur noch per Major).
Voraussetzungen:

1. **API-Beruhigung:** mindestens zwei 0.x-Releases ohne Breaking Changes
   nach der State-Konsolidierung (0.3.0)
2. **Definierte Public API:** dokumentierte Trennung offiziell/intern in
   den Paket-Exporten
3. **Persistenzformat-Garantie:** dokumentierte Migrationspolitik für
   `jfd_fieldState_v1` („wird von allen 1.x gelesen")
4. **Praxis-Härtung:** mindestens ein produktiver Pilot mit Issue-Zyklus
5. **npm-Veröffentlichung** von `@jsonforms-designer/editor` mit erstem
   Embedder-Feedback
6. **Externes BITV-2.0-Audit** bestanden
7. **XDF-Entscheidung:** Export auf 3.x gehoben oder 2.0 bewusst als
   Scope dokumentiert

## Kurzfristig (0.3.x)

- [x] ~~**Release v0.3.0**~~ (veröffentlicht 2026-06-12)
- [x] ~~**CSP härten (`unsafe-eval`)**~~ (geprüft mit Befund: AJV benötigt es
      für die Schema-Kompilierung in der Vorschau, nicht Monaco — siehe
      `packages/app/vite.config.ts` und `docs/BETRIEB.md`)
- [x] ~~**Bundle-Optimierung (Monaco lazy)**~~ (umgesetzt: Initial-Bundle
      0,48 MB gzip, Code-Modus-Chunk lädt on demand)
- [x] ~~**Upgrade-Session Dev-Toolchain**~~ (umgesetzt 2026-09):
      TypeScript 6.0.3, ESLint 10, eslint-plugin-react-hooks 7,
      simple-import-sort 14, eslint-config-prettier 10, Vite 8,
      @vitejs/plugin-react 6, jsdom 30, Vitest 5, JSONForms 3.8,
      Monaco 0.57, @types/node 26, jest-dom 7. `npm audit`: 0 Findings
      (vorher 13)
- [ ] **`set-state-in-effect` auflösen** (9 Stellen, 7 Dateien): Neu in
      eslint-plugin-react-hooks 7 und vorerst auf `warn` gesetzt. Es geht
      überall um dasselbe Muster — lokalen Zustand angleichen, wenn sich
      eine Prop ändert. React empfiehlt `key` oder Ableiten im Render;
      das ist ein Umbau mit Verhaltensrisiko und braucht eigene Tests
- [ ] **TypeScript 7** — blockiert: `@typescript-eslint` unterstützt in
      8.70.1 nur `<6.1.0`. Ein Sprung auf TS 7 ohne passendes Plugin
      hieße, das gesamte TypeScript-Linting zu verlieren (inkl.
      `no-explicit-any`). Wieder aufnehmen, sobald typescript-eslint
      nachzieht
- [ ] **Docker-Image-Smoke-Test:** das Dockerfile wurde lokal nie gebaut
      (kein Daemon verfügbar) — beim ersten Host-/CI-Build verifizieren

## Mittelfristig

- [ ] **DnD-Bibliothek migrieren:** `react-dnd` ist seit April 2022 ohne
      Release (Supply-Chain-Audit 2026-06). Bewertete Alternativen:
      `@atlaskit/pragmatic-drag-and-drop` (empfohlen — Atlassian-getragen,
      aktiv, framework-agnostisch) vor `@dnd-kit/core` (beste React-DX und
      eingebaute Tastatur-A11y, aber Einzel-Maintainer und seit Ende 2024
      still). Entschärfung bis dahin: der Tastatur-Pfad (Enter,
      Alt+Pfeile) ist react-dnd-unabhängig implementiert
- [x] ~~**State-Konsolidierung Stufe 2** (ADR 0001)~~ (umgesetzt in 0.3.0,
      inkl. Stufe 3)
- [x] ~~**Tastatur-Umsortieren** von Feldern~~ (umgesetzt: Alt+Pfeiltasten)
- [ ] **Beispiel-Backend** für den bereits enthaltenen
      `HttpFieldStateService` (Paket-Export seit 0.3.0)
- [x] ~~**FIM-Proxy-Beispiel**~~ (nginx-Block in `docker/nginx.conf` +
      `docs/BETRIEB.md`)
- [ ] **Komponenten-Sandbox** (Storybook o. ä.) evaluieren — bewusst noch
      nicht eingeführt (E2E + Screenshot-Generator decken die visuelle
      Verifikation derzeit ab)
- [x] ~~**vitest 4**~~ (übersprungen; direkt auf **Vitest 5**, 2026-09.
      Achtung: Der v8-Provider wertet seitdem AST-genau aus — die
      Coverage-Schwellwerte sind neu kalibriert, die Zahlen sind mit den
      alten nicht vergleichbar)
- [ ] **MUI 9** — **weiterhin blockiert** (2026-09 erneut geprüft):
      `@jsonforms/material-renderers@3.8.0` fordert `@mui/material ^7.0.0`
      als Peer. Ein Upgrade führt zu zwei MUI-Instanzen im Baum und damit
      zu zwei Theme-Kontexten — das KERN-Theme (ADR 0004) würde die
      gerenderten Formularfelder nicht mehr erreichen. Wartet darauf, dass
      JSONForms MUI 8/9 unterstützt
- [x] ~~**Tastatur-Hinzufügen auch für FIM-Paletteneinträge**~~ (umgesetzt:
      Enter/Leertaste auf FIM-Gruppen, FIM-Einzelfeldern und Bausteinen,
      über dieselbe Action wie der Drop-Pfad). **OpenCode-Einträge bleiben
      offen:** Für ihren DnD-Typ existiert im Editor gar keine Drop-Zone —
      auch der Maus-Pfad bewirkt nichts. Was das Ablegen bewirken soll, ist
      erst zu klären (Rückfrage im Modulkopf von `OpenCodePaletteSection`)
- [ ] **Async-Hydration ohne History-Schritt:** nach dem Laden über einen
      Server-Adapter ist aktuell ein Undo zum leeren Formular möglich
      (dokumentierte Einschränkung in JsonFormsEditor)
- [ ] **Komponenten-Testabdeckung ausbauen** (FieldFormPreview,
      PreviewPanel) und Coverage-Schwellwerte entsprechend anheben
      (Nur-anheben-Politik, siehe vitest.config)
- [ ] **Gemeinsames Renderer-Paket in der Arbeitsfläche** (ADR 0003, Entwurf):
      Der Canvas rendert bereits mit den Material-Renderern und legt die
      Bearbeitung als Overlay darüber; der Wechsel auf das gemeinsame Paket
      steht aus, solange es dieses nicht gibt. Prototyp der Geräte-Ansicht
      liegt hinter `features.canvasGeraeteAnsicht` (Default aus)
- [ ] **WebKit als dritter E2E-Browser** evaluieren

## Langfristig / zu bewerten

- [ ] **XDatenfelder 3.x:** Export an den aktuellen Standard anschließen
      (heute: XDF 2.0)
- [ ] **BITV-2.0-Vollprüfung** mit externem Audit
- [ ] **Versionierung/Audit-Trail** für Formularstände (heute nur
      `x-version`-Metadatum)
- [ ] **Codelisten-Nachladen** aus der FIM-API
      (`/fields/{fim_id}/{version}`) statt nur `code_list_id`
- [ ] **Mehrbenutzer-/Freigabe-Workflows** (Epic: gemeinsames Bearbeiten,
      Vier-Augen-Freigabe, Versionsstände) — bewusst außerhalb des
      1.0-Scopes
- [ ] **npm-Veröffentlichung** von `@jsonforms-designer/editor` —
      Arbeitspaket: `private`-Flag entfernen, npm-Scope registrieren +
      `publishConfig.access`, peerDependencies-Entscheidung (MUI/Emotion/
      JSONForms/react-dnd), Paket-README + LICENSE, `sideEffects`/
      Metadaten, `prepublishOnly`, Tarball-Probe in fremdem Vite-Projekt,
      Publish-Workflow mit `--provenance`
