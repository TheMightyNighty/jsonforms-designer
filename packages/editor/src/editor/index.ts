/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { materialRenderers } from '@jsonforms/material-renderers';

import { DroppableArrayControlRegistration } from '../core/renderers/DroppableArrayControl';
import { DroppableCategorizationLayoutRegistration } from '../core/renderers/DroppableCategorizationLayout';
import { DroppableCategoryLayoutRegistration } from '../core/renderers/DroppableCategoryLayout';
import { DroppableElementRegistration } from '../core/renderers/DroppableElement';
import { DroppableGroupLayoutRegistration } from '../core/renderers/DroppableGroupLayout';
import {
  DroppableHorizontalLayoutRegistration,
  DroppableVerticalLayoutRegistration,
} from '../core/renderers/DroppableLayout';

export * from './components/Editor';
export { EditorElement } from './components/EditorElement';
export * from './components/EditorPanel';
export * from './components/EmptyEditor';

export const defaultEditorRenderers: JsonFormsRendererRegistryEntry[] = [
  ...materialRenderers,
  DroppableHorizontalLayoutRegistration,
  DroppableVerticalLayoutRegistration,
  DroppableElementRegistration,
  DroppableGroupLayoutRegistration,
  DroppableCategoryLayoutRegistration,
  DroppableArrayControlRegistration,
  DroppableCategorizationLayoutRegistration,
];
export * from './components/CodeModePanel';
export * from './components/ColumnContainerRow';
export * from './components/FieldFormPreview';
export * from './components/PreviewPanel';
export * from './components/StructuralElementRow';
export * from './components/TabBar';
export * from './editorMode';
