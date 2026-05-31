
import { JsonSchema7 } from '@jsonforms/core';
import { FieldTypeDefinition } from '../../field-types/fieldTypes';
import { FieldAwareState } from './addFieldReducer';

// ---------------------------------------------------------------------------
// ADD_FIELD
// ---------------------------------------------------------------------------
export const ADD_FIELD = 'ADD_FIELD' as const;
export interface AddFieldPayload {
  fieldTypeId: string;
  propertyKey: string;
  schemaFragment: JsonSchema7 & { title?: string };
  uiSchemaScope: string;
  uiSchemaOptions?: Record<string, unknown>;
  label: string;
  insertAfterScope?: string;
  tabIndex?: number;
  /** Strukturelles Element (Label, Layout) — kein schema.property */
  isStructural?: boolean;
  /** uiSchema-Typ für strukturelle Elemente (z.B. 'Label', 'HorizontalLayout') */
  uiSchemaType?: string;
  /** Kinder-Elemente für Layout-Container */
  uiSchemaElements?: Array<{ type: string; scope?: string; options?: Record<string, unknown> }>;
}
export interface AddFieldAction {
  type: typeof ADD_FIELD;
  payload: AddFieldPayload;
}
export function createAddFieldAction(
  fieldType: FieldTypeDefinition,
  propertyKey: string,
  insertAfterScope?: string,
  tabIndex?: number
): AddFieldAction {
  return {
    type: ADD_FIELD,
    payload: {
      fieldTypeId: fieldType.id,
      propertyKey,
      schemaFragment: { ...fieldType.schema, title: fieldType.defaults.label },
      uiSchemaScope: buildScope(propertyKey),
      uiSchemaOptions: fieldType.uiSchema.options,
      label: fieldType.defaults.label,
      insertAfterScope,
      tabIndex,
      isStructural: fieldType.isStructural,
      uiSchemaType: fieldType.uiSchema.type,
      uiSchemaElements: (fieldType.uiSchema as any).elements,
    },
  };
}
export function buildScope(propertyKey: string): string {
  return `#/properties/${propertyKey}`;
}

// ---------------------------------------------------------------------------
// REMOVE_FIELD
// ---------------------------------------------------------------------------
export const REMOVE_FIELD = 'REMOVE_FIELD' as const;
export interface RemoveFieldAction {
  type: typeof REMOVE_FIELD;
  payload: { scope: string };
}
export function createRemoveFieldAction(scope: string): RemoveFieldAction {
  return { type: REMOVE_FIELD, payload: { scope } };
}

// ---------------------------------------------------------------------------
// LOAD_TEMPLATE
// ---------------------------------------------------------------------------
export const LOAD_TEMPLATE = 'LOAD_TEMPLATE' as const;
export interface LoadTemplateAction {
  type: typeof LOAD_TEMPLATE;
  payload: FieldAwareState;
}
export function createLoadTemplateAction(state: FieldAwareState): LoadTemplateAction {
  return { type: LOAD_TEMPLATE, payload: state };
}

// ---------------------------------------------------------------------------
// SET_FIELD_STATE
// ---------------------------------------------------------------------------
export const SET_FIELD_STATE = 'SET_FIELD_STATE' as const;
export interface SetFieldStateAction {
  type: typeof SET_FIELD_STATE;
  payload: FieldAwareState;
}
export function createSetFieldStateAction(state: FieldAwareState): SetFieldStateAction {
  return { type: SET_FIELD_STATE, payload: state };
}

// ---------------------------------------------------------------------------
// Tab-Actions
// ---------------------------------------------------------------------------
export const ADD_TAB = 'ADD_TAB' as const;
export const REMOVE_TAB = 'REMOVE_TAB' as const;
export const RENAME_TAB = 'RENAME_TAB' as const;
export const REORDER_TABS = 'REORDER_TABS' as const;
export const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB' as const;

export interface AddTabAction {
  type: typeof ADD_TAB;
  payload: { label: string };
}
export interface RemoveTabAction {
  type: typeof REMOVE_TAB;
  payload: { tabIndex: number };
}
export interface RenameTabAction {
  type: typeof RENAME_TAB;
  payload: { tabIndex: number; label: string };
}
export interface ReorderTabsAction {
  type: typeof REORDER_TABS;
  payload: { fromIndex: number; toIndex: number };
}
export interface SetActiveTabAction {
  type: typeof SET_ACTIVE_TAB;
  payload: { tabIndex: number };
}

export function createAddTabAction(label: string): AddTabAction {
  return { type: ADD_TAB, payload: { label } };
}
export function createRemoveTabAction(tabIndex: number): RemoveTabAction {
  return { type: REMOVE_TAB, payload: { tabIndex } };
}
export function createRenameTabAction(tabIndex: number, label: string): RenameTabAction {
  return { type: RENAME_TAB, payload: { tabIndex, label } };
}
export function createReorderTabsAction(fromIndex: number, toIndex: number): ReorderTabsAction {
  return { type: REORDER_TABS, payload: { fromIndex, toIndex } };
}
export function createSetActiveTabAction(tabIndex: number): SetActiveTabAction {
  return { type: SET_ACTIVE_TAB, payload: { tabIndex } };
}

export type TabAction =
  | AddTabAction
  | RemoveTabAction
  | RenameTabAction
  | ReorderTabsAction
  | SetActiveTabAction;

// ---------------------------------------------------------------------------
// COLUMN_DROP — Feld/Element in einen ColumnContainer ablegen
// ---------------------------------------------------------------------------

export const COLUMN_DROP = 'COLUMN_DROP' as const;

export interface ColumnDropPayload {
  /** ID des ColumnContainer-Elements */
  containerId: string;
  /** Spalten-Index (0-basiert) */
  columnIndex: number;
  /** Feldtyp-ID aus der Palette (beginnt mit 'fim:' für FIM-Felder) */
  fieldTypeId: string;
  /** Gewünschter Property-Key */
  propertyKey: string;
  /** Optional: nach welchem Element-ID einfügen */
  insertAfterId?: string;
  /** Nur für FIM-Datenfelder: vollständiges Schema-Fragment */
  fimSchema?: JsonSchema7 & { title?: string };
  /** Nur für FIM-Datenfelder: UI-Schema-Optionen */
  fimUiOptions?: Record<string, unknown>;
}

export interface ColumnDropAction {
  type: typeof COLUMN_DROP;
  payload: ColumnDropPayload;
}

export function createColumnDropAction(payload: ColumnDropPayload): ColumnDropAction {
  return { type: COLUMN_DROP, payload };
}

// ---------------------------------------------------------------------------
// MOVE_ELEMENT — Element in der flachen Liste oder zwischen Containern verschieben
// ---------------------------------------------------------------------------

export const MOVE_ELEMENT = 'MOVE_ELEMENT' as const;

export interface MoveElementPayload {
  elementId: string;
  /** Ziel: 'root' oder containerId */
  targetContainerId: string;
  /** Spalten-Index bei ColumnContainer */
  targetColumnIndex?: number;
  insertAfterId?: string;
}

export interface MoveElementAction {
  type: typeof MOVE_ELEMENT;
  payload: MoveElementPayload;
}

export function createMoveElementAction(payload: MoveElementPayload): MoveElementAction {
  return { type: MOVE_ELEMENT, payload };
}

// ---------------------------------------------------------------------------
// REORDER_ELEMENT — Element in der flachen uiSchema.elements-Liste verschieben
// ---------------------------------------------------------------------------

export const REORDER_ELEMENT = 'REORDER_ELEMENT' as const;

export interface ReorderElementAction {
  type: typeof REORDER_ELEMENT;
  payload: {
    /** scope oder id des zu verschiebenden Elements */
    elementKey: string;
    /** scope/id des Elements nach dem eingefügt wird (undefined = ans Ende) */
    insertAfterKey?: string;
  };
}

export function createReorderElementAction(
  elementKey: string,
  insertAfterKey?: string
): ReorderElementAction {
  return { type: REORDER_ELEMENT, payload: { elementKey, insertAfterKey } };
}

// ---------------------------------------------------------------------------
// REORDER_IN_COLUMN — Element innerhalb einer Spalte neu sortieren
// ---------------------------------------------------------------------------

export const REORDER_IN_COLUMN = 'REORDER_IN_COLUMN' as const;

export interface ReorderInColumnAction {
  type: typeof REORDER_IN_COLUMN;
  payload: {
    containerId: string;
    columnIndex: number;
    elementId: string;
    insertAfterId?: string;
  };
}

export function createReorderInColumnAction(
  containerId: string,
  columnIndex: number,
  elementId: string,
  insertAfterId?: string
): ReorderInColumnAction {
  return { type: REORDER_IN_COLUMN, payload: { containerId, columnIndex, elementId, insertAfterId } };
}

// ---------------------------------------------------------------------------
// TOGGLE_LINE_NUMBERS + SET_SECTION_COLOR
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SET_FORM_METADATA — Formular-Metadaten (Titel, Behörde, Rechtsgrundlage …)
// ---------------------------------------------------------------------------

export const SET_FORM_METADATA = 'SET_FORM_METADATA' as const;

export interface FormMetadata {
  title?: string;
  description?: string;
  publisher?: string;   // x-publisher
  legalBasis?: string;  // x-legal-basis
  version?: string;     // x-version
  validFrom?: string;   // x-valid-from (ISO date)
}

export interface SetFormMetadataAction {
  type: typeof SET_FORM_METADATA;
  payload: FormMetadata;
}

export function createSetFormMetadataAction(meta: FormMetadata): SetFormMetadataAction {
  return { type: SET_FORM_METADATA, payload: meta };
}

// ---------------------------------------------------------------------------
// ADD_FIM_GRUPPE — fügt mehrere Felder als benannte Gruppe ein
// ---------------------------------------------------------------------------

export const ADD_FIM_GRUPPE = 'ADD_FIM_GRUPPE' as const;

export interface AddFimGruppePayload {
  gruppenName: string;
  insertAfterScope?: string;
  tabIndex?: number;
  felder: Array<{
    propertyKey: string;
    schemaFragment: JsonSchema7 & { title?: string };
    uiSchemaOptions?: Record<string, unknown>;
    label: string;
  }>;
}

export interface AddFimGruppeAction {
  type: typeof ADD_FIM_GRUPPE;
  payload: AddFimGruppePayload;
}

export function createAddFimGruppeAction(payload: AddFimGruppePayload): AddFimGruppeAction {
  return { type: ADD_FIM_GRUPPE, payload };
}

// ---------------------------------------------------------------------------
export const TOGGLE_LINE_NUMBERS = 'TOGGLE_LINE_NUMBERS' as const;
export interface ToggleLineNumbersAction { type: typeof TOGGLE_LINE_NUMBERS }
export function createToggleLineNumbersAction(): ToggleLineNumbersAction {
  return { type: TOGGLE_LINE_NUMBERS };
}

export const SET_SECTION_COLOR = 'SET_SECTION_COLOR' as const;
export interface SetSectionColorAction {
  type: typeof SET_SECTION_COLOR;
  payload: { elementId: string; color: string | null };
}
export function createSetSectionColorAction(elementId: string, color: string | null): SetSectionColorAction {
  return { type: SET_SECTION_COLOR, payload: { elementId, color } };
}
