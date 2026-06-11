# Changelog

Alle wesentlichen Änderungen am Projekt werden in dieser Datei dokumentiert.  
Format nach [Keep a Changelog](https://keepachangelog.com/de/1.0.0/), Versionierung nach [Semantic Versioning](https://semver.org).

---

## [Unreleased]

### Geändert (Performance)
- **Code-Modus lädt lazy:** Monaco (≈ 1 MB gzip) liegt jetzt in einem eigenen Chunk, der erst beim Öffnen des Code-Modus geladen wird (racefrei: `loader.config` lebt im selben Chunk). Initial-Bundle: **≈ 0,48 MB gzip** (zwischenzeitlich 1,5 MB, vor der Monaco-Umstellung 0,55 MB). Die toten Baum-Module (Stufe 2) zahlen mit ein. `CodeModePanel` ist kein Public-Export mehr (nötig für den Split).

### Sicherheit
- **Monaco wird lokal gebündelt statt vom CDN geladen** (`packages/app/src/monacoSetup.ts`): `@monaco-editor/loader` erhält eine self-hosted Instanz, die Worker werden über das Vite-`?worker`-Rezept als eigene Dateien emittiert. Damit ist der Code-Modus **intranet-fähig** (kein Laufzeit-Zugriff auf `cdn.jsdelivr.net` mehr); die CSP wurde entsprechend von jsdelivr-Ausnahmen befreit und blockiert CDN-Regressionen aktiv. Trade-off: das Initial-Bundle wächst (gzip ≈ 0,55 MB → ≈ 1,5 MB).
- **Monaco von 0.52.2 auf 0.55.1 angehoben.** Der alte Pin umging die DOMPurify-Advisories der Monaco-Builds ≥ 0.54; stattdessen erzwingt jetzt ein scoped npm-Override `dompurify ≥ 3.4.9` (fixt u. a. GHSA-v2wj-7wpq-c8vv, GHSA-h8r8-wccr-v5f2 — 8 Advisories). `npm audit`: 0 Findings.
- **vitest auf ≥ 3.2.6** (GHSA-5xrq-8626-4rwp, critical: Datei-Lesezugriff über den Vitest-UI-Server).

### Hinzugefügt
- **Betriebsartefakte:** Multi-Stage-`Dockerfile` (node → nginx, Healthcheck, Port 8080), Referenz-`nginx.conf` (SPA-Fallback, Cache-Strategie, Security-Header, auskommentierter FIM-Reverse-Proxy für abgeschottete Netze) und `docs/BETRIEB.md` (Deploy, CSP-Erklärung, Persistenz, Diagnose, Update-Prozess).
- **Betriebs-Diagnostik:** Neue Prop `onError(error, kontext)` als zentraler Fehlerkanal (Laden, Auto-Save, Render-Fehler der ErrorBoundary) — Default bleibt `console.error`. Die Editor-Version (aus `package.json`) wird im Header angezeigt.
- **`HttpFieldStateService`** als Paket-Export: Referenz-Adapter für Server-Persistenz (GET/PUT, debounced, 404-Behandlung, `onSaveError`-Kanal, injizierbares `fetch`) — 5 Unit-Tests.
- **Pre-Commit-Hooks** (husky + lint-staged): Prettier und ESLint-Autofix laufen auf den gestagten Dateien vor jedem Commit — Format-Drift kann nicht mehr einsickern.
- **Projekt-Doku:** `CONTRIBUTING.md` (Setup, Konventionen, Qualitäts-Gates), `ROADMAP.md` und ADR-Verzeichnis (`docs/adr/`). README-Screenshots auf das aktuelle helle Theme aktualisiert — reproduzierbar über einen Playwright-Generator (`GEN_SCREENSHOTS=1`, FIM gemockt).
- **Tastatur-Alternativpfad zum Drag & Drop (BITV):** Palette-Einträge sind fokussierbar (`role="button"`); Enter/Leertaste fügt den Feldtyp ans Formularende an (im aktiven Tab). **Umsortieren per Alt+Pfeiltasten** auf der fokussierten Feld-Zeile (`aria-keyshortcuts`).

### Behoben
- **Reorder auf die oberste Drop-Zone** sortierte das Element fälschlich ans Ende statt an den Anfang (`reorderElementReducer` ohne `insertAfterKey`) — beim Bau des Tastatur-Umsortierens gefunden, durch 4 neue Reducer-Tests abgesichert.
- **Unit-Tests für `xdfExport`** (XML-Escaping/Injection-Schutz, Typ-Mapping, Codelisten, Einschränkungen) **und `fimApiService`** (URL-Bau, Header, Normalisierung, Fehlerfälle) — 28 neue Tests.
- **CI-Workflow** (GitHub Actions): Lint, Typecheck, Tests und Build laufen bei jedem Push/PR.
- **E2E-Smoke-Tests** (Playwright, `packages/app/e2e/`): sichern die Kernpfade gegen den **Produktions-Build** ab — App-Start, Drag & Drop (inkl. Auto-Save über Reload), Eigenschaften-Bearbeitung, JSONForms-Vorschau, Code-Modus (verifiziert: Monaco lädt lokal, **null CDN-Requests**) und Export-Dialog. Lokal: `npm run test:e2e`; in der CI nach dem Build.
- **Persistenz-Adapter** (`FieldStateStorageService`): Der Formular-Zustand wird nicht mehr fest in `localStorage` gespeichert, sondern über eine austauschbare Schnittstelle (Prop `fieldStateStorage` am `<JsonFormsEditor>`). Default bleibt localStorage (`LocalStorageFieldStateService`); asynchrone Adapter (REST-Backend) werden nach dem Mount hydriert. README enthält ein HTTP-Adapter-Beispiel.

### Geändert (Architektur)
- **State-Konsolidierung, Stufe 2 (ADR 0001) — Breaking:** Die komplette geerbte Baum-Welt wurde entfernt (≈ 5.000 LOC): alte Palette, Droppable-Renderer, `SchemaElement`-/`EditorUISchemaElement`-Modell, `schemasUtil`/`tree`/`clone`, `paletteService`/`propertiesService`/`categorizationService` sowie die zugehörigen `JsonFormsEditor`-Props (`schemaProviders`, `schemaDecorators`, `editorRenderers`, `propertyRenderers`, `paletteService`, `categorizationService`, `propertiesServiceProvider`) und Public-Exporte. Alle 30 Action-Cast-Nähte (`as unknown as EditorAction`) sind beseitigt — sie waren nach der Union-Bereinigung überflüssig. Details und vollständige Liste: `docs/adr/0001`.
- **State-Konsolidierung, Stufe 1 (ADR 0001):** `FieldAwareState` ist die einzige Laufzeit-Quelle. Extern geladene Schemas (`schemaService`) werden über `fieldStateFromSchemas()` in den Form-First-Zustand konvertiert statt den geerbten Baum-State aufzubauen; der Baum-Render-Zweig (`Editor.tsx`) und der tote `NEW_UI_SCHEMA_ELEMENT`-Drop (`EmptyEditor`) sind entfernt. Die Prop `editorRenderers` ist deprecated (wirkungslos). Verlustfrei konvertiert: Control, Label, HorizontalLayout/Spalten, Group; Best-Effort für exotische Knoten (z. B. Categorization → Label). Stufe 2 (Entfernung der toten Baum-Module) siehe ADR.

### Geändert (Qualität / Tooling)
- **ESLint 9 Flat-Config** eingerichtet (`eslint.config.mjs`): `typescript-eslint`, `simple-import-sort` und `eslint-plugin-react-hooks` verdrahtet. Zuvor existierte keine Konfiguration — `npm run lint` lief ins Leere.
- **Prettier** als eigenständige Skripte ergänzt (`npm run format` / `format:check`); gesamter `src`-Bestand einmalig formatiert. `eslint-plugin-prettier` entfernt, `eslint-config-prettier` bleibt für Regel-Deduplizierung.
- **`no-explicit-any` vollständig beseitigt**: alle 180 `any`-Vorkommen durch konkrete Typen (`JsonSchema7`, `UISchemaElement`, `FlatElement`, `unknown` mit gezielten Casts) ersetzt. `npm run lint` ist jetzt fehlerfrei.
- **Test-Suite repariert**: die Feldtypen-Katalog-Tests (`fieldTypes.test.ts`, `addFieldReducer.test.ts`) waren gegenüber dem auf 30+ Typen gewachsenen Katalog veraltet (strukturelle Einträge, `integer`, `file-upload`) — angeglichen, 312/312 grün.

---

## [0.2.1] — 2026-06-01

### Sicherheit
- Alle bekannten Abhängigkeits-CVEs behoben (`npm audit`: 7 moderate → 0): `vitest` auf 3.x angehoben; die Monaco-Runtime wird auf die auditierte Version `0.52.2` gepinnt statt ungepinnt vom CDN geladen (umgeht die DOMPurify-Advisories der Monaco-Builds ≥ 0.54).
- **Tabler-Icons** werden self-hosted gebündelt statt ohne Subresource Integrity vom CDN geladen.
- **Content-Security-Policy** für den Produktions-Build ergänzt (greift nur im Build, damit der Dev-HMR funktioniert).
- Schutz gegen **Prototype Pollution** (`__proto__`/`constructor`/`prototype`) beim Datei-Import und beim Laden aus `localStorage`.
- Clipboard nutzt die `navigator.clipboard`-API mit Legacy-Fallback.

### Dokumentiert
- **FimApiService**: Vertrauensanforderung an `baseUrl`/`headers` (Schutz vor SSRF / Credential-Leak) im Code dokumentiert.

---

## [0.2.0] — 2026-05-31

### Hinzugefügt
- **FIM-Bausteine-Integration**: Vollständige Anbindung an das Föderale Informationsmanagement (FIM) über die FitKo-API (`fimportal.de/api/v1`). Datenfelder und Datenfeldgruppen werden per Drag & Drop in den Editor übernommen.
- **EditorConfig**: Props-basierte Konfigurationsschicht am `<JsonFormsEditor>`-Component. Module (FIM, OpenCode) sowie Palette-Defaults sind vollständig konfigurierbar.
- **FimApiService**: HTTP-Client für die FIM-Portal-API mit konfigurierbarer Basis-URL, serverseitiger Suche und Response-Normalisierer.
- **Bedingte Anzeige**: JSONForms-native `rule`-Unterstützung. Im Properties-Panel wird für jedes Feld eine Bedingung mit Quellfeld, Vergleichswert und Effekt (SHOW / HIDE / DISABLE) konfiguriert.
- **Formular-Metadaten**: Dialog für Titel, Beschreibung, herausgebende Behörde, Rechtsgrundlage, Versionsnummer und Gültigkeitsdatum. Gespeichert als JSON-Schema-konforme `x-*`-Felder.
- **XDatenfelder-Export (XDF 2.0)**: Generierung einer XDF-2.0-konformen XML-Datei aus dem aktuellen Formularschema. Abrufbar über den Export-Dialog.
- **Wiederholungsgruppe**: Neuer Feldtyp (`type: array`) mit JSONForms-nativer Add/Remove-Steuerung.
- **Mehrsprachige Formulare**: Übersetzungseditor im Properties-Panel. Feldbezeichnungen, Hilfetexte und Platzhalter werden pro Sprache (EN/FR/PL/TR/AR/UK) in `schema.x-translations` gespeichert.
- **Druckansicht**: Print-CSS-Integration und Drucken-Button in der Vorschau-Toolbar.
- **Seitenumbruch-Stepper**: Mehrstufige Formulare werden in der Vorschau mit einem anklickbaren MUI-Stepper navigiert.
- **Einklappbare Palette**: Alle Feldtyp-Gruppen sowie die OpenCode- und FIM-Sektionen sind einzeln ein- und ausklappbar.
- **Helles Material-Design-Theme**: Weiße Editor-Canvas, hellgraue Seitenleisten, weißer AppBar mit Primärfarb-Akzent. Orientiert an Material Design 3.
- **WCAG-Quickwins**: Skip-Link, `focus-visible`-Outline (3 px, Kontrastverhältnis ≥ 3:1), `lang="de"` am HTML-Element.

### Geändert
- **FimPaletteSection**: Browse-Modus zeigt Datenfeldgruppen als ziehbare Karten mit Feldvorschau. Such-Modus trennt Gruppen und Einzelfelder.
- **Properties-Panel**: Bedingte Anzeige und Übersetzungseditor als zusätzliche Abschnitte.
- **Header**: Formular-Titel wird in der Titelleiste angezeigt. Metadaten-Button (ⓘ) ergänzt.
- **ImportExportDialog**: Neuer XDF-2.0-Tab mit Download-Button.
- **PreviewPanel**: Print-Toolbar, Seitenumbruch-Stepper, Formular-Titel-Badge.
- **fieldPropertiesReducer**: Element-Traversierung ist rekursiv (Felder in Spalten und Gruppen werden korrekt gefunden).

---

## [0.1.0] — 2025-05-01

### Hinzugefügt
- Initiale Veröffentlichung
- Form-First-Architektur mit `FieldAwareState`
- Drag & Drop aus Palette (30+ Feldtypen)
- Spalten-Layouts (2/3/4-spaltig, freie Breiten)
- Mehrstufige Formulare (Tab-System)
- Undo/Redo (50 Schritte)
- Code-Modus (Monaco Editor)
- Vorschau-Modus (JSONForms-Rendering)
- Auto-Save in `localStorage`
- Export/Import als JSON
- OpenCode-Integration (Validatoren, UI-Bausteine)
- DE/EN-Lokalisierung

[Unreleased]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/TheMIghtyNighty/jsonforms-designer/releases/tag/v0.1.0
