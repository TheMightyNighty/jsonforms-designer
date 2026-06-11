/**
 * Public API of @jsonforms-designer/editor.
 *
 * Based on eclipsesource/jsonforms-editor (MIT, 2020 EclipseSource Munich).
 *
 * Hinweis: Mit ADR 0001 Stufe 2 wurde die geerbte Baum-Welt entfernt
 * (alte Palette, Droppable-Renderer, SchemaElement-/EditorUISchemaElement-
 * Modell, paletteService/propertiesService/categorizationService).
 * FieldAwareState ist die einzige Laufzeit-Quelle.
 */
export * from './core/api';
export * from './core/components';
export * from './core/context';
export * from './core/model';
export * from './core/util';
export * from './editor';
export * from './palette-panel';

export const EDITOR_VERSION = '0.1.0';

// Hinweis: Die Monaco-Runtime wird NICHT mehr hier konfiguriert. Der Host
// (siehe packages/app/src/monacoSetup.ts) übergibt @monaco-editor/loader eine
// lokal gebündelte Monaco-Instanz — ohne diese Konfiguration lädt der Loader
// einen ungepinnten Build vom CDN (siehe README, Abschnitt „Einbettung").

export * from './config';
export * from './field-types';
export * from './fim';
export * from './i18n';
export * from './JsonFormsEditor';
export * from './JsonFormsEditorUi';
export * from './opencode';
export * from './properties';
