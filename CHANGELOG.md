# Changelog

Alle wesentlichen Änderungen am Projekt werden in dieser Datei dokumentiert.  
Format nach [Keep a Changelog](https://keepachangelog.com/de/1.0.0/), Versionierung nach [Semantic Versioning](https://semver.org).

---

## [Unreleased]

### Behoben (Barrierefreiheit)
- **Aufklappbare Palette-Überschriften waren nicht per Tastatur bedienbar** („Eingabe", „OPENCODE", „FIM-Bausteine"): klickbare `div`s ohne Rolle und ohne Fokus. Jetzt echte Schaltflächen mit `aria-expanded` (WCAG 2.1.1).
- **Zwei ineinander verschachtelte `banner`-Landmarks** (ein `<header>` um die AppBar, die selbst eines rendert) — die äußere entfällt. `main` hat einen Namen und trägt das Sprungziel des Skip-Links.
- **Die Seite hatte genau eine Überschrift** (den Produktnamen). Palette, Arbeitsfläche und Eigenschaften sind jetzt benannte Bereiche mit `h2`-Überschrift für die Screenreader-Navigation (visuell unverändert).
- **Horizontales Scrollen bei 320 px Breite** (WCAG 1.4.10): Die Kopfzeile passte nicht. Rückgängig/Wiederholen/Weitere zeigen auf schmalen Bildschirmen nur ihr Symbol (zugänglicher Name bleibt), und die Aktionsgruppe darf umbrechen.

### Behoben
- **Verschieben in einen Container verlor das Element:** `moveElementReducer` entfernte das Element aus seiner Position und fügte es nicht wieder ein, wenn der Zielcontainer nicht gefunden wurde — und gefunden wurde er nur eine Ebene tief, eine Gruppe innerhalb einer Spalte also nie. Beides behoben: Das Ziel wird vor dem Entfernen geprüft, und das Einfügen läuft über dieselbe rekursive Hilfsfunktion wie das Ablegen aus der Palette.

### Geändert (Editor-UX)
- **Feldtyp-Wechsel über Basistypgrenzen ist jetzt möglich** (vorher abgelehnt): Die Auswahl im Reiter „Inhalt" zeigt alle Feldtypen, getrennt in „Gleiche Art von Antwort" und „Andere Art von Antwort". Vor einem nicht verlustfreien Wechsel fragt ein Dialog nach und benennt konkret, was wegfällt — Auswahloptionen, nicht mehr passende Prüfungen und Bedingungen anderer Felder, die einen Wert dieses Feldes vergleichen. Die Aufzählung liegt als reine Funktion `wechselFolgen` und ist getestet; der Reducer entfernt beim Wechsel die Prüfungen, die nicht mehr passen, statt sie unsichtbar am Feld zu lassen. Damit kann der Typvorschlag jetzt immer „Übernehmen" anbieten.

### Geändert (Architektur)
- **Baustein-Katalog kommt aus einem austauschbaren Dienst** statt aus dem Editor-Code (ADR 0005): neues `BausteinService`-Interface, konfiguriert über `EditorConfig.modules.bausteine` — dasselbe Muster wie `FimService` und `OpenCodeService`. Eine Behörde pflegt ihre Bausteinbibliothek damit ohne Editor-Build. Default bleibt der `MockBausteinService` mit den drei als Beispiel gekennzeichneten Bausteinen.
- **`HttpBausteinService`** als Referenz-Adapter: liest den Katalog als JSON (Array oder `{ items }`) von einer konfigurierten URL. Eingehende Einträge sind unvertraute Eingabe und laufen durch `normalisiereBaustein` — Prototype-Pollution-Schlüssel raus, Pflichtangaben geprüft, unbrauchbare Einträge einzeln verworfen und über `onEintragVerworfen` gemeldet, statt den ganzen Katalog scheitern zu lassen. Format dokumentiert im README.
- Das Drag-Item der Bausteine trägt jetzt den vollständigen Baustein statt seiner id — ein asynchroner Katalog lässt sich im Drop-Handler nicht synchron nachschlagen (dieselbe Lösung wie bei FIM-Datenfeldgruppen). Der Einfügepfad bleibt `ADD_FIM_GRUPPE`.

### Hinzugefügt (Editor-UX)
- **Typvorschläge aus der Feldbezeichnung:** Eine reine Funktion `vorschlagFeldtyp` liest die Bezeichnung und schlägt über eine deutsche Stichwortliste den passenden Feldtyp vor (Geburtsdatum → Datum, IBAN → IBAN, Postleitzahl → Textfeld mit PLZ-Prüfung …). Weicht der gewählte Typ ab, erscheint im Reiter „Inhalt" ein nicht blockierender Hinweis mit „Übernehmen" und „Ignorieren"; führt der Vorschlag über eine Basistypgrenze, wird er erklärt, aber nicht angeboten. „Ignorieren" wird pro Feld gemerkt — in `FieldAwareState.typvorschlagIgnoriert`, also im gespeicherten Stand und **nicht** im Export. Alt-Stände ohne das Feld laden unverändert.
- **Qualitäts-Ampel:** Eine reine Funktion `pruefeFormular(state): Hinweis[]` prüft Feld ohne Bezeichnung (Fehler), Pflichtfeld ohne Hilfetext (Hinweis), Bezeichnung länger als `MAX_LABEL_LAENGE` = 80 Zeichen (Hinweis), doppelte Bezeichnungen (Fehler), Formular ohne Titel oder ohne Rechtsgrundlage (Fehler), offener Typvorschlag (Hinweis) und Bedingungen auf gelöschte Felder (Fehler). Die Kopfzeile zeigt den Zähler; ein Klick öffnet die Liste, ein Klick auf einen Eintrag wählt das betroffene Feld aus.
- **Geräte-Ansicht auf der Arbeitsfläche** als Prototyp hinter `EditorConfig.features.canvasGeraeteAnsicht` (Default **aus**): Umschalter Desktop/Handy, der die Fläche auf 390 px verengt, damit sich Auswahl und Umsortieren per Overlay auch dort prüfen lassen. Ohne Flag rendert die Arbeitsfläche exakt wie zuvor. In der Demo-Anwendung über `?geraeteansicht=1` erreichbar.

### Dokumentation
- **ADR 0003 „Arbeitsfläche mit dem Produktiv-Renderer" (Entwurf)**: hält Auswahl, Ziehen und Inline-Bearbeitung als Overlay über gerenderten JSONForms-Controls fest, dazu den Umschalter Desktop/Handy und die Abhängigkeit zum gemeinsamen Renderer-Paket, das noch nicht existiert. Status bewusst „Entwurf" — die Entscheidung fällt, wenn das Paket vorliegt.

### Geändert (Design)
- **Visuelle Neuausrichtung am Verwaltungs-Designsystem KERN** (ADR 0004): Farben, Abstände, Radien, Rahmenbreiten und Typografie kommen aus den KERN-Design-Token statt aus einer eigenen Markenpalette; Schrift ist Fira Sans. Betroffen sind die Werkzeug-Oberfläche (Kopfzeile, Palette, Eigenschaften, Dialoge) **und** die KERN-Vorschau-Variante — beide bauen auf derselben Theme-Funktion auf, die frühere Nachempfindung mit geschätzten Farben entfällt.
- **KERN ist vendored, keine Laufzeit-Abhängigkeit:** `scripts/vendor-kern.mjs` zieht `@kern-ux/native` (EUPL-1.2) einmalig, löst die Token des hellen Themes auf, rechnet die oklch-Werte nach sRGB-Hex um (MUI versteht kein oklch) und schreibt sie als generiertes Modul `kernTokens.ts`; dazu kommen drei Fira-Sans-Schnitte als woff2 (~400 KB), getrimmtes `@font-face`-CSS, Lizenz und Herkunftsnotiz. Keine neue Abhängigkeit in `package.json`, kein Laufzeit-CDN, `npm audit` unverändert. Aktualisierung: `node scripts/vendor-kern.mjs <version>`.
- **Kontrast als Gate statt Zusage:** Ein Unit-Test rechnet die Kontraste der tatsächlich verwendeten Farbpaare nach WCAG 2.1 durch — 4,5:1 für Text (Fließtext, gedämpfter Text, Aktionsfarbe, Rückmeldungen) und 3:1 für Fokusindikator und Feldrahmen.
- **Abschnittsfarben** (Auswahl und Vorgabewert für Abschnittsköpfe) kommen aus den KERN-Token. Gespeicherte Alt-Farben bleiben gültig und werden beim Laden weiterhin über `legacyColorToToken` migriert.

### Geändert (Editor-UX)
- **Eigenschaften in Reitern „Inhalt · Prüfung · Bedingungen · Übersetzung"** (vorher „Allgemein · Validierung · Sichtbarkeit · Übersetzung", hart codiert — die Beschriftungen kommen jetzt aus `i18n`). Strukturelemente zeigen nur den passenden Reiter „Inhalt".
- **Art des Feldes wechselbar:** Im Reiter „Inhalt" steht die Art des Feldes als Auswahl. Angeboten werden nur Arten mit demselben JSON-Basistyp (Text ↔ E-Mail ↔ Datum, nicht Text → Ja/Nein). Neue Action `CHANGE_FIELD_TYPE` mit Reducer-Tests; Bezeichnung, Hilfetext, selbst gesetzter Platzhalter, Property-Schlüssel und damit Bedingungen und Übersetzungen bleiben erhalten.
- **Bedingungen als Satz:** „Nur anzeigen / Ausblenden / Sperren, wenn [Feld] [ist gleich / ist nicht gleich] [Wert]" statt drei getrennter Formularteile mit nachgestellter Erklärung. Ausgabe bleibt der JSONForms-`rule`-Eintrag; `ist nicht gleich` wird als `{ not: { const } }` abgebildet und von der Regel-Auswertung im Testmodus unterstützt. „ist ausgefüllt" wird bewusst nicht angeboten (keine feldartübergreifende Abbildung in `rule.condition`).
- **Palette neu gegliedert:** ein Suchfeld über drei Reitern — **Bausteine** (Standard) · **FIM** · **Einzelfelder** — statt einer flachen Liste aus rund dreißig Rohfeldtypen. Die Suche findet Bausteine (auch über enthaltene Felder: „IBAN" findet „Bankverbindung") und Einzelfelder gemeinsam und ist umlautunempfindlich („strasse" findet „Straße"); FIM behält seine eigene, entfernte Suche im FIM-Reiter. Unter „Einzelfelder" stehen die acht häufigsten Feldtypen oben (Konstante `HAEUFIGE_FELDTYP_IDS`), der Rest unter „Weitere Feldtypen".
- **Bausteine:** vorgefertigte Feldgruppen, die als benannte Gruppe in einem Schritt eingefügt werden — über dieselbe Action wie FIM-Datenfeldgruppen (`ADD_FIM_GRUPPE`), es gibt keinen zweiten Einfügepfad. Der Katalog kommt aus einem austauschbaren Dienst (siehe „Geändert (Architektur)"); der Default enthält drei sichtbar als **„Beispiel"** gekennzeichnete Bausteine (Antragsteller, Anschrift, Bankverbindung), deren fachliche Inhalte noch nicht abgestimmt sind.
- **Tastatur-Hinzufügen für FIM-Einträge** (Enter/Leertaste, wie bei den Katalog-Feldtypen) — schließt den offenen ROADMAP-Punkt für FIM. Bausteine sind ebenfalls per Tastatur einfügbar. OpenCode-Einträge bleiben außen vor: Für sie existiert im Editor gar keine Drop-Zone, auch der Maus-Pfad führt zu nichts (im Modulkopf vermerkt).
- **Kopfzeile mit klarer Aufgabe:** Links stehen Produktname, Formularname und der **Speicherstatus** („Entwurf · gespeichert vor 5 s", bei Fehlern „Speichern fehlgeschlagen" in Rot mit `aria-live`), gespeist aus dem Auto-Save des `FieldStateStorageService`. Rechts stehen beschriftete Aktionen — Rückgängig/Wiederholen und **„Ausprobieren"** als Hauptaktion — statt acht unbeschrifteter Symbole. Code-Modus, Schema kopieren, Import/Export, Vorlagen, Metadaten und Editorsprache liegen im Menü **„Weitere"**. Der Platz für die Qualitäts-Ampel ist im Layout vorgesehen (`data-testid="header-slot-qualitaet"`).
- **Produktname konfigurierbar:** neue optionale `EditorConfig.produktName`. Default bleibt unverändert „JSONForms Designer".

### Behoben (Editor-UX)
- **Typ-Angabe in Fachsprache statt JSON-Basistyp:** Der Eigenschaften-Bereich zeigt jetzt „Art des Feldes: Datum" statt des JSON-Typs. Die Ableitung liegt in einer gemeinsamen, getesteten Funktion (`ermittleFeldtyp`/`feldtypLabel`), die den Feldtyp über eine geordnete Regelliste aus `FIELD_TYPE_CATALOG` zurückgewinnt — ein Rundlauftest sichert, dass jeder Katalog-Feldtyp wieder als genau dieser erkannt wird. Fallback ist „Feld", nie „string".
- **Prüfungen sind kontextsensitiv:** `ValidatorSection` bietet nur noch die Validatoren an, die zur Art des Feldes passen (Zuordnungstabelle `VALIDATOR_FELDTYPEN`) — die Steuer-ID-Prüfung erscheint nicht mehr am Geburtsdatum. Bereits gesetzte Prüfungen bleiben sichtbar, Validatoren ohne Tabelleneintrag werden weiterhin überall angeboten.
- **Fehlendes Symbol bei „Mehrfachauswahl":** Der Katalog verwies auf `ti-checkboxes`, das die vendorte Tabler-Schrift nicht enthält — jetzt `ti-list-check`. Ein Test in der App prüft alle Katalog-Symbole gegen das vendorte CSS.
- **Kontrast der Palette-Überschriften** („EINGABE", „OPENCODE", „FIM-BAUSTEINE" …) von 2,4:1 auf 6,9:1 angehoben (`text.disabled` → `text.secondary`).
- **FIM-Screenshot zeigte keine FIM-Bausteine:** Der Generator prüfte nur die Sichtbarkeit im DOM; bei 1600x900 lag die Sektion unterhalb des Bildausschnitts. Sie wird jetzt in den Sichtbereich gescrollt, und der Generator prüft die Lage im Viewport. Screenshots neu erzeugt.

### Dokumentation
- **ADR 0002 „Fachsprachliche Editor-UX"**: hält die Richtung für die Editor-Oberfläche fest (Zielgruppe Formularredakteurin im Fachbereich, Fachsprache statt Technik) samt der sechs verbindlichen Randbedingungen — Repo-Konventionen, stabiles Persistenzformat `jfd_fieldState_v1`, unverändertes Ausgabeformat, keine Verschlechterung der Barrierefreiheit, keine neuen Laufzeit-Abhängigkeiten, Fachsprache aus `i18n`.

### Qualität
- **Coverage-Gate wieder grün** (Branches 69,8 % → 74,1 %): neue Unit-Tests für `sectionColorTokens`, `manifestMeta`, `layoutWidth` sowie elf zusätzliche Fälle für `columnReducer` (Container-Ziele, Einfügeposition, Nicht-Treffer). Der E2E-Smoke „Vorschau" war nach dem Umbau auf den Testmodus tot und prüft jetzt den Testmodus.

### Sicherheit (Supply Chain)
- **Vertrauensaudit aller 44 Direktabhängigkeiten** (Provenance, Maintainer, Aktivität): 4 verwaiste Runtime-Dependencies entfernt (lodash, json-schema-traverse, uuid, @mui/x-tree-view); `react-dnd` (seit 2022 ungepflegt) als Migrationsziel in der ROADMAP bewertet — Empfehlung `@atlaskit/pragmatic-drag-and-drop`.
- **Tabler-Icon-Font vendored** (nur woff2 + getrimmtes CSS, MIT-Lizenz beigelegt): entfernt `@tabler/icons-webfont` samt transitiver nativer Build-Kette (`svgtofont`/`ttf2woff2` mit Install-Script); der App-Build enthält statt drei Font-Formaten (~4 MB) nur noch das woff2 (457 KB).
- **Dependabot** aktiviert (wöchentlich, gruppierte Minor/Patch-PRs, auch GitHub Actions): Abhängigkeits-Updates kommen als reviewbare PRs statt unbemerkt über Caret-Ranges.

---

## [0.3.0] — 2026-06-12

### Geändert (Performance)
- **Code-Modus lädt lazy:** Monaco (≈ 1 MB gzip) liegt jetzt in einem eigenen Chunk, der erst beim Öffnen des Code-Modus geladen wird (racefrei: `loader.config` lebt im selben Chunk). Initial-Bundle: **≈ 0,48 MB gzip** (zwischenzeitlich 1,5 MB, vor der Monaco-Umstellung 0,55 MB). Die toten Baum-Module (Stufe 2) zahlen mit ein. `CodeModePanel` ist kein Public-Export mehr (nötig für den Split).

### Sicherheit
- **Monaco wird lokal gebündelt statt vom CDN geladen** (`packages/app/src/monacoSetup.ts`): `@monaco-editor/loader` erhält eine self-hosted Instanz, die Worker werden über das Vite-`?worker`-Rezept als eigene Dateien emittiert. Damit ist der Code-Modus **intranet-fähig** (kein Laufzeit-Zugriff auf `cdn.jsdelivr.net` mehr); die CSP wurde entsprechend von jsdelivr-Ausnahmen befreit und blockiert CDN-Regressionen aktiv. Trade-off: das Initial-Bundle wächst (gzip ≈ 0,55 MB → ≈ 1,5 MB).
- **Monaco von 0.52.2 auf 0.55.1 angehoben.** Der alte Pin umging die DOMPurify-Advisories der Monaco-Builds ≥ 0.54; stattdessen erzwingt jetzt ein scoped npm-Override `dompurify ≥ 3.4.9` (fixt u. a. GHSA-v2wj-7wpq-c8vv, GHSA-h8r8-wccr-v5f2 — 8 Advisories). `npm audit`: 0 Findings.
- **vitest auf ≥ 3.2.6** (GHSA-5xrq-8626-4rwp, critical: Datei-Lesezugriff über den Vitest-UI-Server).

### Hinzugefügt
- **Unit-Tests für `xdfExport`** (XML-Escaping/Injection-Schutz, Typ-Mapping, Codelisten, Einschränkungen) **und `fimApiService`** (URL-Bau, Header, Normalisierung, Fehlerfälle) — 28 neue Tests.
- **CI-Workflow** (GitHub Actions): Lint, Typecheck, Tests und Build laufen bei jedem Push/PR.
- **E2E-Smoke-Tests** (Playwright, `packages/app/e2e/`): sichern die Kernpfade gegen den **Produktions-Build** ab — App-Start, Drag & Drop (inkl. Auto-Save über Reload), Eigenschaften-Bearbeitung, JSONForms-Vorschau, Code-Modus (verifiziert: Monaco lädt lokal, **null CDN-Requests**) und Export-Dialog. Lokal: `npm run test:e2e`; in der CI nach dem Build.
- **Persistenz-Adapter** (`FieldStateStorageService`): Der Formular-Zustand wird nicht mehr fest in `localStorage` gespeichert, sondern über eine austauschbare Schnittstelle (Prop `fieldStateStorage` am `<JsonFormsEditor>`). Default bleibt localStorage (`LocalStorageFieldStateService`); asynchrone Adapter (REST-Backend) werden nach dem Mount hydriert. README enthält ein HTTP-Adapter-Beispiel.
- **Qualitäts-Gates verschärft:** Coverage-Schwellwerte als Regressions-Gate (`@vitest/coverage-v8`, Werte knapp unter Ist-Stand, werden nur angehoben); erste **Komponenten-Tests** mit Testing Library (Palette-Tastaturpfad, ErrorBoundary→onError, MetadataDialog); E2E-Suite läuft zusätzlich in **Firefox** (16 Läufe gesamt).
- **Betriebsartefakte:** Multi-Stage-`Dockerfile` (node → nginx, Healthcheck, Port 8080), Referenz-`nginx.conf` (SPA-Fallback, Cache-Strategie, Security-Header, auskommentierter FIM-Reverse-Proxy für abgeschottete Netze) und `docs/BETRIEB.md` (Deploy, CSP-Erklärung, Persistenz, Diagnose, Update-Prozess).
- **Betriebs-Diagnostik:** Neue Prop `onError(error, kontext)` als zentraler Fehlerkanal (Laden, Auto-Save, Render-Fehler der ErrorBoundary) — Default bleibt `console.error`. Die Editor-Version (aus `package.json`) wird im Header angezeigt.
- **`HttpFieldStateService`** als Paket-Export: Referenz-Adapter für Server-Persistenz (GET/PUT, debounced, 404-Behandlung, `onSaveError`-Kanal, injizierbares `fetch`) — 5 Unit-Tests.
- **Pre-Commit-Hooks** (husky + lint-staged): Prettier und ESLint-Autofix laufen auf den gestagten Dateien vor jedem Commit — Format-Drift kann nicht mehr einsickern.
- **Projekt-Doku:** `CONTRIBUTING.md` (Setup, Konventionen, Qualitäts-Gates), `ROADMAP.md` und ADR-Verzeichnis (`docs/adr/`). README-Screenshots auf das aktuelle helle Theme aktualisiert — reproduzierbar über einen Playwright-Generator (`GEN_SCREENSHOTS=1`, FIM gemockt).
- **Tastatur-Alternativpfad zum Drag & Drop (BITV):** Palette-Einträge sind fokussierbar (`role="button"`); Enter/Leertaste fügt den Feldtyp ans Formularende an (im aktiven Tab). **Umsortieren per Alt+Pfeiltasten** auf der fokussierten Feld-Zeile (`aria-keyshortcuts`).

### Behoben
- **Bedingte Anzeige wirkte nie in der Vorschau:** `toJsonForms` verwarf die `rule` — JSONForms bekam die Bedingungen nicht zu sehen. `rule` wird jetzt auf allen Konverter-Pfaden (fromLegacy/toLegacy/toJsonForms) erhalten und ist getestet.
- **Einfügen hinter Spalten-/Gruppen-Containern** landete am Listenende statt direkt dahinter (`insertControl` matchte nur `scope`, Container haben aber nur eine `id`).
- **Strukturelle Elemente (Überschriften, Hinweise) in mehrstufigen Formularen** wurden immer Tab 1 zugeordnet (Identitäts-Mismatch zwischen Element-id und Pseudo-Scope der Tab-Zuweisung).
- **Reorder auf die oberste Drop-Zone** sortierte das Element fälschlich ans Ende statt an den Anfang (`reorderElementReducer` ohne `insertAfterKey`) — beim Bau des Tastatur-Umsortierens gefunden, durch 4 neue Reducer-Tests abgesichert.

### Geändert (Architektur)
- **State-Konsolidierung, Stufe 3 (ADR 0001):** `uiSchema.elements` ist jetzt die strikte `UiElement`-Union (ids verpflichtend, Narrowing statt Casts in allen Reducern/Komponenten). Lose Eingangsformen (`FlatElement`/`FieldStateInput`: Templates, Import, Code-Modus, Storage, SchemaService) werden ausschließlich an den Grenzen über `fromLegacy()` normalisiert — alte gespeicherte Stände werden beim Laden automatisch migriert.
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

[Unreleased]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/TheMIghtyNighty/jsonforms-designer/releases/tag/v0.1.0
