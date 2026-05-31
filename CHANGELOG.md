# Changelog

Alle wesentlichen Änderungen am Projekt werden in dieser Datei dokumentiert.  
Format nach [Keep a Changelog](https://keepachangelog.com/de/1.0.0/), Versionierung nach [Semantic Versioning](https://semver.org).

---

## [Unreleased]

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

[Unreleased]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/TheMIghtyNighty/jsonforms-designer/releases/tag/v0.1.0
