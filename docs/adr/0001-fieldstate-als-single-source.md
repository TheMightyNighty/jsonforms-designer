# ADR 0001: FieldAwareState als einzige Laufzeit-Quelle

**Status:** Akzeptiert (Stufe 1 + Stufe 2 umgesetzt, 2026-06)
**Kontext:** packages/editor

## Kontext

Der Editor ist ein Fork von `eclipsesource/jsonforms-editor` und trug zwei
parallele Zustandsmodelle:

1. **Geerbter Baum-State** (`EditorState.schema`/`EditorState.uiSchema`):
   `SchemaElement`-/`EditorUISchemaElement`-Bäume mit `parent`-Zeigern und
   UUIDs, befüllt über `SET_SCHEMA`/`SET_UISCHEMA` (SchemaService, alte
   Baum-Palette) und gerendert über einen eigenen JSONForms-Canvas
   (`core/renderers/Droppable*`, `EditorElement`).
2. **Form-First-State** (`EditorState.fieldState`, `FieldAwareState`):
   flaches JSON-Schema + `FlatElement`-Liste, befüllt über die
   `ADD_FIELD`-Action-Familie und gerendert über `FieldFormPreview`.

Zwei Wahrheitsquellen bedeuteten: doppelte Action-Welten (mit
`as unknown as EditorAction`-Casts an den Nähten), Drift-Risiko, zyklische
Strukturen (`parent`-Zeiger) mit `cloneDeep`-Kosten bei jeder Action und
50 History-Snapshots.

Eine Bestandsaufnahme (2026-06) ergab: Die alte Baum-Palette
(`PalettePanel`, `SchemaTree`, `UIElementsTree`) wird **nirgends mehr
gerendert**; der Drag-Typ `NEW_UI_SCHEMA_ELEMENT` kann im UI nicht mehr
entstehen. Einziger realer Zufluss in den Baum-State war der
`schemaService`-Effekt beim Start.

## Entscheidung

`FieldAwareState` ist die **einzige Laufzeit-Quelle** des Editors.

**Stufe 1 (umgesetzt):**

- Extern geladene Schemas (`schemaService`) werden über
  `fieldStateFromSchemas()` in den Form-First-State konvertiert
  (`SET_FIELD_STATE`) statt den Baum aufzubauen.
- Der Baum-Render-Zweig in `Editor.tsx` (JSONForms-Canvas mit
  `editorRenderers`) ist entfernt; die Prop `editorRenderers` bleibt als
  deprecated API-Hülle erhalten.
- Der tote `NEW_UI_SCHEMA_ELEMENT`-Drop im `EmptyEditor` ist entfernt.

**Stufe 2 (umgesetzt, 2026-06):** Die toten Module wurden nach
Verwendungsanalyse vollständig entfernt (≈ 5.000 LOC):

- `core/renderers/` (alle Droppable-Renderer), `EditorElement`
- alte Palette: `palette-panel/components/` komplett (PalettePanel,
  SchemaTree, Tree, UIElementsTree, JsonSchemaPanel, UISchemaPanel,
  SchemaJson)
- altes Properties-System: `core/properties/propertiesService`,
  `properties/{components,renderers,schemaDecorators,schemaProviders}`
- Baum-Modell: `core/model/{schema,uischema}.ts`,
  `core/util/{schemasUtil,tree,clone,hooks,generators}`, `core/dnd`,
  `core/selection`, `core/icons`, `categorizationService`,
  `paletteService`
- tote Dialog-Komponenten: ErrorDialog, ExportDialog, Footer,
  OkCancelDialog, ShowMoreLess
- `reducer.ts` auf reine FieldAwareState-Verarbeitung eingedampft
  (`combinedReducer`/`uiSchemaReducer`/`syncFieldState` entfernt);
  `actions.ts` enthält nur noch die Form-First-Union
- `EditorContext` verschlankt auf dispatch/fieldState/selectedScope/
  undo/redo

**Breaking (0.x):** Entfernte `JsonFormsEditor`-Props: `schemaProviders`,
`schemaDecorators`, `paletteService`, `categorizationService`,
`propertiesServiceProvider`, `editorRenderers`, `propertyRenderers`.
Entfernte Public-Exports siehe oben. Verbleibende Props: `schemaService`,
`fieldStateStorage`, `config`, `header`, `footer`.

## Konsequenzen

- Ein Editor-Verhalten für alle Zuflüsse (Storage, SchemaService, Import,
  Code-Modus) — kein „zweiter Editor" mehr erreichbar.
- `schemaService`-Hosts erhalten jetzt den Form-First-Editor mit
  konvertiertem Zustand. Verlustfrei: Control, Label,
  HorizontalLayout/Spalten, Group; Best-Effort (Label-Fallback) für
  exotische Knoten wie Categorization.
- Der Baum-Code bleibt vorerst kompiliert/exportiert (keine Breaking
  Changes in 0.x), ist aber unerreichbar — Entfernung siehe Stufe 2.
