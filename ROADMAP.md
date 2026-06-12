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

## Langfristig / zu bewerten

- [ ] **XDatenfelder 3.x:** Export an den aktuellen Standard anschließen
      (heute: XDF 2.0)
- [ ] **BITV-2.0-Vollprüfung** mit externem Audit
- [ ] **Versionierung/Audit-Trail** für Formularstände (heute nur
      `x-version`-Metadatum)
- [ ] **Codelisten-Nachladen** aus der FIM-API
      (`/fields/{fim_id}/{version}`) statt nur `code_list_id`
- [ ] **npm-Veröffentlichung** von `@jsonforms-designer/editor`
