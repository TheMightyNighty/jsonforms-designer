/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import { materialRenderers } from '@jsonforms/material-renderers';

import { RuleEditorRendererRegistration } from './renderers/RuleEditorRenderer';

export * from '../core/properties/propertiesService';
export type { PropertiesPanelProps } from './components/PropertiesPanel';
export { PropertiesPanel } from './components/PropertiesPanel';
export * from './schemaDecorators';
export * from './schemaProviders';

export const defaultPropertyRenderers = [
  ...materialRenderers,
  RuleEditorRendererRegistration,
];

export * from './EnumEditor';
export * from './SectionColorPicker';
export * from './StructuralPropertiesPanel';
