/**
 * Public API of @jsonforms-designer/editor.
 *
 * Based on eclipsesource/jsonforms-editor (MIT, 2020 EclipseSource Munich).
 */
export * from './core/api';
export * from './core/components';
export * from './core/context';
export * from './core/dnd';
export * from './core/icons';
export * from './core/model';
export * from './core/properties/propertiesService';
export * from './core/selection';
export * from './core/util/generators/uiSchema';
export * from './core/util/hooks';
export * as schemasUtil from './core/util/schemasUtil';
export * as treeUtil from './core/util/tree';
export * from './editor';
export * from './palette-panel';

export const EDITOR_VERSION = '0.1.0';

// Hinweis: Die Monaco-Runtime wird NICHT mehr hier konfiguriert. Der Host
// (siehe packages/app/src/monacoSetup.ts) übergibt @monaco-editor/loader eine
// lokal gebündelte Monaco-Instanz — ohne diese Konfiguration lädt der Loader
// einen ungepinnten Build vom CDN (siehe README, Abschnitt „Einbettung").

export * from './config';
export * from './core/jsonschema';
export * from './field-types';
export * from './fim';
export * from './i18n';
export * from './JsonFormsEditor';
export * from './JsonFormsEditorUi';
export * from './opencode';
export * from './properties';
export * from './text-editor';
