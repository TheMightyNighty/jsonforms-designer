# Roadmap

Stand: Juni 2026. Reihenfolge = grobe Priorität; keine Terminzusagen.

## Kurzfristig (0.3.x)

- [ ] **Release v0.3.0** mit den konsolidierten Änderungen (CI, self-hosted
      Monaco, Persistenz-Adapter, E2E-Suite, Tastatur-Pfad, ADR 0001 Stufe 1)
- [ ] **CSP härten:** Prüfen, ob `'unsafe-eval'` nach der Monaco-ESM-Umstellung
      entfernt werden kann (TODO in `packages/app/vite.config.ts`)
- [ ] **Bundle-Optimierung:** Code-Modus (Monaco, ~1 MB gzip) lazy laden,
      Initial-Bundle zurück Richtung ~0,5 MB gzip

## Mittelfristig

- [ ] **State-Konsolidierung Stufe 2** (ADR 0001): tote Baum-Module entfernen
      (alte Palette, `core/renderers/`, Baum-Reducer-Zweige) — Breaking,
      daher gebündelt als Major-Cleanup
- [x] ~~**Tastatur-Umsortieren** von Feldern~~ (umgesetzt: Alt+Pfeiltasten)
- [ ] **Referenz-Backend-Adapter:** kleines Beispiel-Backend +
      `HttpFieldStateService` als Paket-Export statt nur README-Snippet
- [ ] **FIM-Proxy-Beispiel** (CORS/Firewall): dokumentierte Reverse-Proxy-
      Konfiguration für abgeschottete Netze
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
