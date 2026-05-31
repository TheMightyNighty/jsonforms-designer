/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 */
import { EditorUISchemaElement } from './uischema';
import type { AddFieldAction } from './addFieldActions';
import type { RemoveFieldAction } from './addFieldActions';
import type { LoadTemplateAction } from './addFieldActions';
import type { SetFieldStateAction } from './addFieldActions';
import type { TabAction } from './addFieldActions';
import type { ColumnDropAction } from './addFieldActions';
import type { MoveElementAction } from './addFieldActions';
import type { ReorderInColumnAction } from './addFieldActions';
import type { ToggleLineNumbersAction } from './addFieldActions';
import type { SetSectionColorAction } from './addFieldActions';
import type { ReorderElementAction } from './addFieldActions';
import type { AddFimGruppeAction, SetFormMetadataAction } from './addFieldActions';
import type { UpdateFieldPropertyAction, SetFieldRuleAction } from '../../properties/fieldPropertiesActions';

export type UiSchemaAction = AddUnscopedElementToLayout | UpdateUiSchemaElement;

export type CombinedAction =
  | SetUiSchemaAction
  | SetSchemaAction
  | SetSchemasAction
  | AddScopedElementToLayout
  | MoveUiSchemaElement
  | RemoveUiSchemaElement
  | AddDetail;

export type EditorAction =
  | UiSchemaAction
  | CombinedAction
  | AddFieldAction
  | RemoveFieldAction
  | LoadTemplateAction
  | SetFieldStateAction
  | TabAction
  | ColumnDropAction
  | MoveElementAction
  | ReorderElementAction
  | ReorderInColumnAction
  | ToggleLineNumbersAction
  | SetSectionColorAction
  | AddFimGruppeAction
  | SetFormMetadataAction
  | UpdateFieldPropertyAction
  | SetFieldRuleAction;

export const SET_SCHEMA = 'jsonforms-editor/SET_SCHEMA' as const;
export const SET_UISCHEMA = 'jsonforms-editor/SET_UISCHEMA' as const;
export const SET_SCHEMAS = 'jsonforms-editor/SET_SCHEMAS' as const;
export const ADD_SCOPED_ELEMENT_TO_LAYOUT = 'jsonforms-editor/ADD_SCOPED_ELEMENT_TO_LAYOUT' as const;
export const ADD_UNSCOPED_ELEMENT_TO_LAYOUT = 'jsonforms-editor/ADD_UNSCOPED_ELEMENT_TO_LAYOUT' as const;
export const MOVE_UISCHEMA_ELEMENT = 'jsonforms-editor/MOVE_UISCHEMA_ELEMENT' as const;
export const REMOVE_UISCHEMA_ELEMENT = 'jsonforms-editor/REMOVE_UISCHEMA_ELEMENT' as const;
export const UPDATE_UISCHEMA_ELEMENT = 'jsonforms-editor/UPDATE_UISCHEMA_ELEMENT' as const;
export const ADD_DETAIL = 'jsonforms-editor/ADD_DETAIL' as const;

// Re-exports für bequemen Import aus ./actions
export { ADD_FIELD } from './addFieldActions';
export { REMOVE_FIELD } from './addFieldActions';
export { LOAD_TEMPLATE } from './addFieldActions';
export { ADD_FIM_GRUPPE } from './addFieldActions';
export { SET_FORM_METADATA } from './addFieldActions';
export { SET_FIELD_STATE } from './addFieldActions';
export { ADD_TAB, REMOVE_TAB, RENAME_TAB, REORDER_TABS, SET_ACTIVE_TAB } from './addFieldActions';
export { COLUMN_DROP, MOVE_ELEMENT, REORDER_ELEMENT, REORDER_IN_COLUMN, TOGGLE_LINE_NUMBERS, SET_SECTION_COLOR } from './addFieldActions';
export { UPDATE_FIELD_PROPERTY } from '../../properties/fieldPropertiesActions';

export interface SetSchemaAction {
  type: typeof SET_SCHEMA;
  schema: any;
}
export interface SetUiSchemaAction {
  type: typeof SET_UISCHEMA;
  uiSchema: any;
}
export interface SetSchemasAction {
  type: typeof SET_SCHEMAS;
  schema: any;
  uiSchema: any;
}
export interface AddScopedElementToLayout {
  type: typeof ADD_SCOPED_ELEMENT_TO_LAYOUT;
  uiSchemaElement: EditorUISchemaElement;
  layoutUUID: string;
  schemaUUID: string;
  index: number;
}
export interface AddUnscopedElementToLayout {
  type: typeof ADD_UNSCOPED_ELEMENT_TO_LAYOUT;
  uiSchemaElement: EditorUISchemaElement;
  layoutUUID: string;
  index: number;
}
export interface MoveUiSchemaElement {
  type: typeof MOVE_UISCHEMA_ELEMENT;
  elementUUID: string;
  newContainerUUID: string;
  index: number;
  schemaUUID?: string;
}
export interface RemoveUiSchemaElement {
  type: typeof REMOVE_UISCHEMA_ELEMENT;
  elementUUID: string;
}
export interface UpdateUiSchemaElement {
  type: typeof UPDATE_UISCHEMA_ELEMENT;
  elementUUID: string;
  changedProperties: { [key: string]: any };
}
export interface AddDetail {
  type: typeof ADD_DETAIL;
  uiSchemaElementId: string;
  detail: EditorUISchemaElement;
}

const setSchema = (schema: any) => ({ type: SET_SCHEMA, schema });
const setUiSchema = (uiSchema: any) => ({ type: SET_UISCHEMA, uiSchema });
const setSchemas = (schema: any, uiSchema: any) => ({ type: SET_SCHEMAS, schema, uiSchema });
const addScopedElementToLayout = (
  uiSchemaElement: EditorUISchemaElement, layoutUUID: string,
  index: number, schemaUUID: string
) => ({ type: ADD_SCOPED_ELEMENT_TO_LAYOUT, uiSchemaElement, layoutUUID, index, schemaUUID });
const addUnscopedElementToLayout = (
  uiSchemaElement: EditorUISchemaElement, layoutUUID: string, index: number
) => ({ type: ADD_UNSCOPED_ELEMENT_TO_LAYOUT, uiSchemaElement, layoutUUID, index });
const moveUiSchemaElement = (
  elementUUID: string, newContainerUUID: string, index: number, schemaUUID?: string
) => ({ type: MOVE_UISCHEMA_ELEMENT, elementUUID, newContainerUUID, index, schemaUUID });
const removeUiSchemaElement = (elementUUID: string) => ({
  type: REMOVE_UISCHEMA_ELEMENT, elementUUID,
});
const updateUISchemaElement = (
  elementUUID: string, changedProperties: { [key: string]: any }
) => ({ type: UPDATE_UISCHEMA_ELEMENT, elementUUID, changedProperties });
const addDetail = (uiSchemaElementId: string, detail: EditorUISchemaElement) => ({
  type: ADD_DETAIL, uiSchemaElementId, detail,
});

export const Actions = {
  setSchema, setUiSchema, setSchemas, addScopedElementToLayout,
  addUnscopedElementToLayout, moveUiSchemaElement, removeUiSchemaElement,
  updateUISchemaElement, addDetail,
};
