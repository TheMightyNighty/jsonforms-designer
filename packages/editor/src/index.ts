/**
 * Public API of @jsonforms-designer/editor.
 *
 * Based on eclipsesource/jsonforms-editor (MIT, 2020 EclipseSource Munich).
 */
export * from './core/model';
export * from './core/selection';
export * from './core/dnd';
export * from './core/context';
export * from './core/api';
export * from './core/icons';
export * from './core/properties/propertiesService';
export * from './core/components';
export * from './palette-panel';
export * from './editor';
export * from './core/util/hooks';
export * as schemasUtil from './core/util/schemasUtil';
export * as treeUtil from './core/util/tree';
export * from './core/util/generators/uiSchema';

export const EDITOR_VERSION = '0.1.0';
export * from './text-editor';
export * from './core/jsonschema';
export * from './properties';
export * from './JsonFormsEditor';
export * from './JsonFormsEditorUi';

export * from './field-types';

export * from './opencode';

export * from './i18n';
