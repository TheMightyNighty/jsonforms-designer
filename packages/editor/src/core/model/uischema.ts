/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import {
  BaseUISchemaElement,
  Categorization,
  Category,
  ControlElement,
  Layout,
} from '@jsonforms/core';
import { cloneDeep } from 'lodash';
import { v4 as uuid } from 'uuid';

import {
  calculatePath,
  getRoot,
  isEditorControl,
  isEditorLayout,
  isPathError,
  PathError,
  traverse,
} from '../util/schemasUtil';
import { getHierarchy, TreeElement } from '../util/tree';

export interface EditorUISchemaElement
  extends BaseUISchemaElement, TreeElement<EditorUISchemaElement> {
  linkedSchemaElement?: string;
}

export interface EditorCategoryElement extends Category, EditorUISchemaElement {
  type: 'Category';
}

export interface CategorizationLayout
  extends Omit<Categorization, 'elements'>, EditorUISchemaElement {
  type: 'Categorization';
  elements: EditorCategoryElement[];
}

export interface EditorControl extends ControlElement, EditorUISchemaElement {
  type: 'Control';
}

export interface EditorLayout
  extends Omit<Layout, 'elements'>, EditorUISchemaElement {
  elements: EditorUISchemaElement[];
}

export const getUiSchemaChildren = (
  schemaElement: EditorUISchemaElement,
): Array<EditorUISchemaElement> => {
  const children: Array<EditorUISchemaElement> = [];
  if (isEditorLayout(schemaElement)) {
    children.push(...schemaElement.elements);
  }
  return children;
};

export const hasChildren = (schemaElement: EditorUISchemaElement): boolean => {
  return isEditorLayout(schemaElement) && !!schemaElement.elements.length;
};

/**
 * Creates a copy of the given ui schema enriched with editor fields
 * like 'parent' and 'linked schema elements'.
 */
export const buildEditorUiSchemaTree = (
  uiSchema: BaseUISchemaElement | undefined,
): EditorUISchemaElement | undefined => {
  if (!uiSchema) {
    return undefined;
  }
  const editorUiSchema = cloneDeep(uiSchema) as EditorUISchemaElement;
  traverse(editorUiSchema, (current, parent) => {
    if (current) {
      current.parent = parent;
      current.uuid = uuid();
    }
  });
  return editorUiSchema;
};

/**
 * Creates a copy of the given enriched ui schema and removes all editor
 * related fields.
 */
export const buildUiSchema = (
  uiSchema: EditorUISchemaElement,
): BaseUISchemaElement => {
  const clone: EditorUISchemaElement = cloneDeep(uiSchema);
  traverse(clone, (current) => {
    const editorFields = current as Partial<EditorUISchemaElement>;
    delete editorFields.parent;
    delete editorFields.linkedSchemaElement;
    delete editorFields.uuid;
  });
  return clone;
};

export const buildDebugUISchema = (
  uiSchema: EditorUISchemaElement,
): BaseUISchemaElement => {
  const clone = cloneDeep(uiSchema);
  traverse(clone, (current) => {
    // Für die Debug-Ausgabe wird die Parent-Referenz durch ihre UUID ersetzt.
    (current as { parent?: unknown }).parent = current.parent?.uuid;
  });
  return clone;
};

export const getUISchemaPath = (
  uiSchema: EditorUISchemaElement,
): string | PathError => {
  const root = getRoot(uiSchema);
  const path = calculatePath(root, uiSchema);
  if (isPathError(path)) {
    return path;
  }
  // TODO should be done in a cleaner way
  return `/${path.join('/')}`;
};

/**
 * Returns the closes element whose detail contains the given element
 */
export const getDetailContainer = (
  element: EditorUISchemaElement,
): EditorUISchemaElement | undefined => {
  const parentIsDetail = (el: EditorUISchemaElement) =>
    el.parent?.options?.detail?.uuid === el.uuid;

  return getHierarchy(element).find(parentIsDetail)?.parent;
};

/**
 * Indicates whether the given ui schema element is a control or contains controls
 */
export const containsControls = (element: EditorUISchemaElement): boolean =>
  traverse(
    element,
    (el, _parent, acc) => {
      if (isEditorControl(el)) {
        acc.containsControls = true;
      }
    },
    { containsControls: false },
  ).containsControls;

export const cleanUiSchemaLinks = (
  element: EditorUISchemaElement | undefined,
): EditorUISchemaElement | undefined => {
  if (!element) {
    return element;
  }
  traverse(element, (current) => {
    delete current.linkedSchemaElement;
    return current;
  });
  return element;
};
