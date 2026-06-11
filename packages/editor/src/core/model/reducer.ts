/**
 * Editor-Reducer — verarbeitet ausschließlich den Form-First-Zustand
 * (FieldAwareState). Der frühere Baum-State (SchemaElement /
 * EditorUISchemaElement) wurde mit ADR 0001 Stufe 2 entfernt.
 */
import { SET_FIELD_RULE } from '../../properties/fieldPropertiesActions';
import { fieldPropertiesReducer } from '../../properties/fieldPropertiesReducer';
import {
  ADD_FIELD,
  ADD_FIM_GRUPPE,
  ADD_TAB,
  COLUMN_DROP,
  EditorAction,
  LOAD_TEMPLATE,
  MOVE_ELEMENT,
  REMOVE_FIELD,
  REMOVE_TAB,
  RENAME_TAB,
  REORDER_ELEMENT,
  REORDER_IN_COLUMN,
  REORDER_TABS,
  SET_ACTIVE_TAB,
  SET_FIELD_STATE,
  SET_FORM_METADATA,
  SET_SECTION_COLOR,
  TOGGLE_LINE_NUMBERS,
  UPDATE_FIELD_PROPERTY,
} from './actions';
import {
  addFieldReducer,
  FieldAwareState,
  fimGruppeReducer,
  loadTemplateReducer,
  removeFieldReducer,
  reorderElementReducer,
  tabReducer,
} from './addFieldReducer';
import {
  columnDropReducer,
  moveElementReducer,
  reorderInColumnReducer,
} from './columnReducer';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface EditorState {
  fieldState: FieldAwareState;
}

export const emptyFieldState: FieldAwareState = {
  schema: { type: 'object', properties: {} },
  uiSchema: { type: 'VerticalLayout', elements: [] },
  tabs: [],
  activeTabIndex: 0,
  tabAssignments: {},
  lineNumbersEnabled: false,
  sectionColors: {},
};

// ---------------------------------------------------------------------------
// editorReducer
// ---------------------------------------------------------------------------

export const editorReducer = (
  state: EditorState,
  action: EditorAction,
): EditorState => {
  // ADD_FIELD
  if (action.type === ADD_FIELD) {
    return { ...state, fieldState: addFieldReducer(state.fieldState, action) };
  }

  // ADD_FIM_GRUPPE
  if (action.type === ADD_FIM_GRUPPE) {
    return { ...state, fieldState: fimGruppeReducer(state.fieldState, action) };
  }

  // REMOVE_FIELD
  if (action.type === REMOVE_FIELD) {
    return {
      ...state,
      fieldState: removeFieldReducer(state.fieldState, action),
    };
  }

  // Tab-Actions
  if (
    action.type === ADD_TAB ||
    action.type === REMOVE_TAB ||
    action.type === RENAME_TAB ||
    action.type === REORDER_TABS ||
    action.type === SET_ACTIVE_TAB
  ) {
    return { ...state, fieldState: tabReducer(state.fieldState, action) };
  }

  // REORDER_IN_COLUMN
  if (action.type === REORDER_IN_COLUMN) {
    return {
      ...state,
      fieldState: reorderInColumnReducer(state.fieldState, action),
    };
  }

  // TOGGLE_LINE_NUMBERS
  if (action.type === TOGGLE_LINE_NUMBERS) {
    return {
      ...state,
      fieldState: {
        ...state.fieldState,
        lineNumbersEnabled: !state.fieldState.lineNumbersEnabled,
      },
    };
  }
  // SET_SECTION_COLOR
  if (action.type === SET_SECTION_COLOR) {
    const { elementId, color } = action.payload;
    const nextColors = color
      ? { ...state.fieldState.sectionColors, [elementId]: color }
      : Object.fromEntries(
          Object.entries(state.fieldState.sectionColors).filter(
            ([k]) => k !== elementId,
          ),
        );
    return {
      ...state,
      fieldState: { ...state.fieldState, sectionColors: nextColors },
    };
  }

  // REORDER_ELEMENT
  if (action.type === REORDER_ELEMENT) {
    return {
      ...state,
      fieldState: reorderElementReducer(state.fieldState, action),
    };
  }

  // COLUMN_DROP
  if (action.type === COLUMN_DROP) {
    return {
      ...state,
      fieldState: columnDropReducer(state.fieldState, action),
    };
  }

  // MOVE_ELEMENT
  if (action.type === MOVE_ELEMENT) {
    return {
      ...state,
      fieldState: moveElementReducer(state.fieldState, action),
    };
  }

  // LOAD_TEMPLATE / SET_FIELD_STATE
  if (action.type === LOAD_TEMPLATE || action.type === SET_FIELD_STATE) {
    return {
      ...state,
      fieldState: loadTemplateReducer(state.fieldState, action),
    };
  }

  // SET_FORM_METADATA
  if (action.type === SET_FORM_METADATA) {
    const payload = action.payload;
    const patch: Record<string, unknown> = {};
    if (payload.title !== undefined) patch['title'] = payload.title;
    if (payload.description !== undefined)
      patch['description'] = payload.description;
    if (payload.publisher !== undefined)
      patch['x-publisher'] = payload.publisher;
    if (payload.legalBasis !== undefined)
      patch['x-legal-basis'] = payload.legalBasis;
    if (payload.version !== undefined) patch['x-version'] = payload.version;
    if (payload.validFrom !== undefined)
      patch['x-valid-from'] = payload.validFrom;
    // Durchreichen beliebiger x-* Felder (z. B. x-translations)
    for (const [k, v] of Object.entries(payload)) {
      if (k.startsWith('x-') && !(k in patch)) patch[k] = v;
    }
    const schema = { ...state.fieldState.schema, ...patch };
    return { ...state, fieldState: { ...state.fieldState, schema } };
  }

  // SET_FIELD_RULE + UPDATE_FIELD_PROPERTY
  if (action.type === SET_FIELD_RULE || action.type === UPDATE_FIELD_PROPERTY) {
    return {
      ...state,
      fieldState: fieldPropertiesReducer(state.fieldState, action),
    };
  }

  return state;
};

// ---------------------------------------------------------------------------
// createInitialEditorState
// ---------------------------------------------------------------------------

export function createInitialEditorState(): EditorState {
  return { fieldState: emptyFieldState };
}
