<div align="center">

# JSONForms Designer

**Visueller Formular-Editor für JSON Schema & JSONForms UI Schema**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-brightgreen.svg)](./packages/editor/package.json)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![MUI](https://img.shields.io/badge/MUI-7-007FFF?logo=mui)](https://mui.com)

*Erstellt und bearbeitet JSONForms-kompatible Formulare ohne Schema-Vorkenntnisse — per Drag & Drop.*

</div>

---

<div align="center">
  <img src="docs/screenshot-visual.png" alt="JSONForms Designer — Visueller Modus" width="900" />
  <br/><br/>
  <img src="docs/screenshot-code.png" alt="JSONForms Designer — Code Modus" width="900" />
</div>

---

## Überblick

JSONForms Designer ist ein React-basierter Formular-Editor, der nach dem **Form-First-Prinzip** arbeitet: Felder werden visuell zusammengestellt, das JSON Schema und UI Schema werden automatisch erzeugt. Der Editor wird als npm-Paket `@jsonforms-designer/editor` in bestehende Anwendungen eingebettet.

### Features auf einen Blick

| Bereich | Funktionen |
|---|---|
| **Formular-Design** | Drag & Drop aus Palette, 30+ Feldtypen, Spalten-Layouts (2/3/4-spaltig, freie Breiten), mehrstufige Formulare (Tabs) |
| **Struktur-Elemente** | Abschnittsköpfe (farbig konfigurierbar), Hinweistexte, Annotationen, benannte Gruppen |
| **Feldeigenschaften** | Label, Hilfetext, Platzhalter, Pflichtfeld, Enum-Optionen, OpenCode-Validatoren |
| **Modi** | Visuell · Code (Monaco) · Vorschau — alle bidirektional synchronisiert |
| **Persistenz** | Auto-Save in `localStorage`, Export/Import als JSON, Undo/Redo (50 Schritte) |
| **Vorlagen** | 3 vorgefertigte Formular-Vorlagen (Kontakt, Adresse, Anliegen) |
| **Mehrsprachigkeit** | DE / EN, per Klick umschaltbar |
| **Barrierefreiheit** | ARIA-Attribute, Keyboard-Navigation, BITV-Grundlagen |
| **Responsivität** | Desktop 3-Spalten, Tablet/Mobile Tab-Layout |

### OpenCode-Integration

Validatoren und UI-Bausteine aus dem OpenCode-Ökosystem lassen sich per Drag aus der Palette auf Felder anwenden. Die Anbindung erfolgt über ein austauschbares `OpenCodeService`-Interface — im Entwicklungsmodus ist ein Mock-Provider aktiv.

---

## Tech-Stack

```
packages/
  app/        Vite-App (Entwicklungshost)
  editor/     @jsonforms-designer/editor — das einbettbare Paket
```

| Abhängigkeit | Version | Zweck |
|---|---|---|
| React | 19 | UI |
| JSONForms | 3.x | Schema-basiertes Formular-Rendering |
| MUI (Material UI) | 7.x | Komponenten-Bibliothek |
| react-dnd | 16 | Drag & Drop |
| @monaco-editor/react | 4.x | Code-Editor (JSON-Modus) |
| Vite | 6 | Build-Tool |
| TypeScript | 5 | Typsicherheit |
| Vitest | 2.x | Tests |

---

## Quickstart

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten (http://localhost:3000)
npm run dev

# TypeScript prüfen
npm run typecheck

# Tests ausführen
npm run test
```

---

## Einbettung

```tsx
import { JsonFormsEditor } from '@jsonforms-designer/editor';
import '@jsonforms-designer/editor/style.css';

function MyApp() {
  return <JsonFormsEditor />;
}
```

Optionale Props:

```tsx
<JsonFormsEditor
  schemaService={mySchemaService}    // Vorhandenes Schema laden
  paletteService={myPaletteService}  // Palette konfigurieren
  editorRenderers={customRenderers}  // Eigene JSONForms-Renderer
/>
```

---

## Architektur

```
EditorContext
  ├── fieldState (FieldAwareState)    Form-First State
  │     ├── schema                   JSON Schema
  │     ├── uiSchema.elements        UiElement-Baum (inkl. ColumnContainer)
  │     ├── tabs / tabAssignments    Mehrstufige Formulare
  │     ├── sectionColors            Abschnittsfarben
  │     └── lineNumbersEnabled       Zeilennummern
  ├── historyReducer                 Undo/Redo (50 Schritte)
  ├── selectedScope                  Selektiertes Element
  └── dispatch (EditorAction)        Alle Mutations
```

### Wichtige Actions

| Action | Zweck |
|---|---|
| `ADD_FIELD` | Feld aus Palette in Formular |
| `COLUMN_DROP` | Feld in Spalten-Container |
| `REMOVE_FIELD` | Feld / Container löschen (rekursiv) |
| `REORDER_ELEMENT` | Reihenfolge in flacher Liste |
| `REORDER_IN_COLUMN` | Reihenfolge in Spalte |
| `MOVE_ELEMENT` | Aus Spalte herauslösen |
| `ADD_TAB / REMOVE_TAB` | Tab-Verwaltung |
| `TOGGLE_LINE_NUMBERS` | Zeilennummern an/aus |
| `SET_SECTION_COLOR` | Hintergrundfarbe für Container |
| `UNDO / REDO` | History-Navigation |

---

## Lizenz

MIT — siehe [LICENSE](./LICENSE).

Dieses Projekt basiert auf dem [JSONForms Editor](https://github.com/eclipsesource/jsonforms-editor) von EclipseSource Munich (MIT, Copyright 2021). Die ursprüngliche Kern-Infrastruktur (Schema-Modell, UiSchema-Utilities, DnD-Grundgerüst) wurde übernommen und umfangreich erweitert. Alle neuen Features (Form-First-Modus, Spalten-Layouts, OpenCode-Integration, i18n u.v.m.) wurden neu entwickelt.

Der Original-Copyright-Hinweis ist gemäß MIT-Lizenz in den betreffenden Quelldateien erhalten.
