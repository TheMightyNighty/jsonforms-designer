# Changelog

Alle wesentlichen Änderungen am Projekt werden in dieser Datei dokumentiert.  
Format nach [Keep a Changelog](https://keepachangelog.com/de/1.0.0/), Versionierung nach [Semantic Versioning](https://semver.org).

---

## [Unreleased]

### Sicherheit
- **Monaco wird lokal gebündelt statt vom CDN geladen** (`packages/app/src/monacoSetup.ts`): `@monaco-editor/loader` erhält eine self-hosted Instanz, die Worker werden über das Vite-`?worker`-Rezept als eigene Dateien emittiert. Damit ist der Code-Modus **intranet-fähig** (kein Laufzeit-Zugriff auf `cdn.jsdelivr.net` mehr); die CSP wurde entsprechend von jsdelivr-Ausnahmen befreit und blockiert CDN-Regressionen aktiv. Trade-off: das Initial-Bundle wächst (gzip ≈ 0,55 MB → ≈ 1,5 MB).
- **Monaco von 0.52.2 auf 0.55.1 angehoben.** Der alte Pin umging die DOMPurify-Advisories der Monaco-Builds ≥ 0.54; stattdessen erzwingt jetzt ein scoped npm-Override `dompurify ≥ 3.4.9` (fixt u. a. GHSA-v2wj-7wpq-c8vv, GHSA-h8r8-wccr-v5f2 — 8 Advisories). `npm audit`: 0 Findings.
- **vitest auf ≥ 3.2.6** (GHSA-5xrq-8626-4rwp, critical: Datei-Lesezugriff über den Vitest-UI-Server).

### Hinzugefügt
- **CI-Workflow** (GitHub Actions): Lint, Typecheck, Tests und Build laufen bei jedem Push/PR.
- **E2E-Smoke-Tests** (Playwright, `packages/app/e2e/`): sichern die Kernpfade gegen den **Produktions-Build** ab — App-Start, Drag & Drop (inkl. Auto-Save über Reload), Eigenschaften-Bearbeitung, JSONForms-Vorschau, Code-Modus (verifiziert: Monaco lädt lokal, **null CDN-Requests**) und Export-Dialog. Lokal: `npm run test:e2e`; in der CI nach dem Build.
- **Persistenz-Adapter** (`FieldStateStorageService`): Der Formular-Zustand wird nicht mehr fest in `localStorage` gespeichert, sondern über eine austauschbare Schnittstelle (Prop `fieldStateStorage` am `<JsonFormsEditor>`). Default bleibt localStorage (`LocalStorageFieldStateService`); asynchrone Adapter (REST-Backend) werden nach dem Mount hydriert. README enthält ein HTTP-Adapter-Beispiel.

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
