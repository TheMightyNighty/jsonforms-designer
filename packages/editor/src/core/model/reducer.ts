/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 */
import { assign } from 'lodash';

import { SET_FIELD_RULE } from '../../properties/fieldPropertiesActions';
import { fieldPropertiesReducer } from '../../properties/fieldPropertiesReducer';
import { CategorizationService } from '../api/categorizationService';
import { withCloneTree, withCloneTrees } from '../util/clone';
import {
  findByUUID,
  getRoot,
  isEditorControl,
  isEditorLayout,
  isUUIDError,
  linkElements,
  linkSchemas,
  traverse,
  UUIDError,
} from '../util/schemasUtil';
import {
  ADD_DETAIL,
  ADD_FIELD,
  ADD_FIM_GRUPPE,
  ADD_SCOPED_ELEMENT_TO_LAYOUT,
  ADD_TAB,
  ADD_UNSCOPED_ELEMENT_TO_LAYOUT,
  COLUMN_DROP,
  CombinedAction,
  EditorAction,
  LOAD_TEMPLATE,
  MOVE_ELEMENT,
  MOVE_UISCHEMA_ELEMENT,
  REMOVE_FIELD,
  REMOVE_TAB,
  REMOVE_UISCHEMA_ELEMENT,
  RENAME_TAB,
  REORDER_ELEMENT,
  REORDER_IN_COLUMN,
  REORDER_TABS,
  SET_ACTIVE_TAB,
  SET_FIELD_STATE,
  SET_FORM_METADATA,
  SET_SCHEMA,
  SET_SCHEMAS,
  SET_SECTION_COLOR,
  SET_UISCHEMA,
  TOGGLE_LINE_NUMBERS,
  UiSchemaAction,
  UPDATE_FIELD_PROPERTY,
  UPDATE_UISCHEMA_ELEMENT,
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
import { buildSchemaTree, cleanLinkedElements, SchemaElement } from './schema';
import {
  buildEditorUiSchemaTree,
  cleanUiSchemaLinks,
  EditorControl,
  EditorLayout,
  EditorUISchemaElement,
} from './uischema';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface EditorState {
  schema?: SchemaElement;
  uiSchema?: EditorUISchemaElement;
  categorizationService?: CategorizationService;
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
// Sync: EditorState → FieldAwareState nach Baum-Änderungen
// ---------------------------------------------------------------------------

function syncFieldState(
  schema: SchemaElement | undefined,
  uiSchema: EditorUISchemaElement | undefined,
): FieldAwareState {
  const flatSchema: FieldAwareState['schema'] = {
    type: 'object',
    properties: {},
  };
  if (schema) {
    try {
      const src = getRoot(schema)?.schema;
      if (src?.properties) flatSchema.properties = src.properties;
      if (src?.required) flatSchema.required = src.required;
    } catch {
      /* defekte Schemas tolerieren — flatSchema bleibt leer */
    }
  }

  const flatUiSchema: FieldAwareState['uiSchema'] = {
    type: 'VerticalLayout',
    elements: [],
  };
  if (uiSchema) {
    try {
      const root = getRoot(uiSchema) as EditorLayout;
      const elements: EditorUISchemaElement[] =
        root?.elements ?? (uiSchema as EditorLayout).elements ?? [];
      flatUiSchema.type = root?.type ?? 'VerticalLayout';
      flatUiSchema.elements = elements.map((el) => ({
        type: el.type,
        scope: (el as EditorControl).scope,
        options: el.options,
      }));
    } catch {
      /* defekte UI-Schemas tolerieren — flatUiSchema bleibt leer */
    }
  }

  return {
    schema: flatSchema,
    uiSchema: flatUiSchema,
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    sectionColors: {},
  };
}

// ---------------------------------------------------------------------------
// uiSchemaReducer
// ---------------------------------------------------------------------------

export const uiSchemaReducer = (
  uiSchema: EditorUISchemaElement | undefined,
  action: UiSchemaAction,
) => {
  switch (action.type) {
    case ADD_UNSCOPED_ELEMENT_TO_LAYOUT:
      return uiSchema
        ? withCloneTree(
            uiSchema,
            action.layoutUUID,
            uiSchema,
            (newUiSchema) => {
              const newUIElement = action.uiSchemaElement;
              newUIElement.parent = newUiSchema;
              (newUiSchema as EditorLayout).elements.splice(
                action.index,
                0,
                newUIElement,
              );
              return getRoot(newUiSchema as EditorUISchemaElement);
            },
          )
        : uiSchema;
    case UPDATE_UISCHEMA_ELEMENT:
      return uiSchema
        ? withCloneTree(
            uiSchema,
            action.elementUUID,
            uiSchema,
            (newUiSchema) => {
              const optionsDetail = newUiSchema.options?.detail;
              assign(newUiSchema, action.changedProperties);
              if (optionsDetail && !newUiSchema.options?.detail) {
                newUiSchema.options = newUiSchema.options || {};
                newUiSchema.options.detail = optionsDetail;
              }
              return getRoot(newUiSchema);
            },
          )
        : uiSchema;
  }
  return uiSchema;
};

// ---------------------------------------------------------------------------
// combinedReducer
// ---------------------------------------------------------------------------

export const combinedReducer = (
  state: EditorState,
  action: CombinedAction,
): EditorState => {
  switch (action.type) {
    case SET_SCHEMA:
      return withCloneTree(state.uiSchema, undefined, state, (clonedUiSchema) =>
        linkSchemas(
          buildSchemaTree(action.schema),
          cleanUiSchemaLinks(clonedUiSchema),
        ),
      );
    case SET_UISCHEMA:
      return withCloneTree(state.schema, undefined, state, (clonedSchema) => {
        state.categorizationService?.clearTabSelections();
        return linkSchemas(
          cleanLinkedElements(clonedSchema),
          buildEditorUiSchemaTree(action.uiSchema),
        );
      });
    case SET_SCHEMAS:
      return linkSchemas(
        buildSchemaTree(action.schema),
        buildEditorUiSchemaTree(action.uiSchema),
      );
    case ADD_SCOPED_ELEMENT_TO_LAYOUT:
      return withCloneTrees(
        state.uiSchema,
        action.layoutUUID,
        state.schema,
        action.schemaUUID,
        state,
        (newUiSchema, newSchema) => {
          const newUIElement = action.uiSchemaElement;
          newUIElement.parent = newUiSchema;
          (newUiSchema as EditorLayout).elements.splice(
            action.index,
            0,
            newUIElement,
          );
          if (!newSchema || !linkElements(newUIElement, newSchema)) {
            console.error('Could not add new UI element', newUIElement);
            return state;
          }
          return {
            schema: getRoot(newSchema),
            uiSchema: getRoot(newUiSchema),
            fieldState: emptyFieldState,
          };
        },
      );
    case MOVE_UISCHEMA_ELEMENT:
      return withCloneTrees(
        state.uiSchema,
        action.newContainerUUID,
        state.schema,
        action.schemaUUID,
        state,
        (newContainer, newSchema) => {
          const elementToMove = findByUUID(newContainer, action.elementUUID);
          if (isUUIDError(elementToMove)) {
            console.error(
              'Could not find corresponding element',
              elementToMove,
            );
            return state;
          }
          const oldParentUUID = elementToMove.parent?.uuid;
          const oldIndexInParent = elementToMove.parent
            ? (elementToMove.parent as EditorLayout).elements.indexOf(
                elementToMove,
              )
            : -1;
          const removeResult = removeUiElement(elementToMove, newSchema);
          if (isUUIDError(removeResult)) {
            console.error('Could not remove ui element', removeResult);
            return state;
          }
          elementToMove.parent = newContainer;
          if (newContainer && isEditorLayout(newContainer)) {
            const moveRight =
              action.newContainerUUID === oldParentUUID &&
              oldIndexInParent !== -1 &&
              oldIndexInParent < action.index;
            const idx = moveRight ? action.index - 1 : action.index;
            (newContainer as EditorLayout).elements.splice(
              idx,
              0,
              elementToMove,
            );
          } else if (newContainer && isEditorControl(newContainer)) {
            newContainer.options = {
              ...newContainer.options,
              detail: elementToMove,
            };
          } else {
            console.error('Move encountered an invalid case');
            return state;
          }
          if (elementToMove.linkedSchemaElement) {
            (newSchema!.linkedUISchemaElements =
              newSchema!.linkedUISchemaElements || new Set()).add(
              elementToMove.uuid,
            );
          }
          const schemaToReturn =
            action.schemaUUID !== undefined ? getRoot(newSchema) : state.schema;
          return {
            schema: schemaToReturn,
            uiSchema: getRoot(newContainer as EditorUISchemaElement),
            fieldState: emptyFieldState,
          };
        },
      );
    case REMOVE_UISCHEMA_ELEMENT:
      return withCloneTrees(
        state.uiSchema,
        action.elementUUID,
        state.schema,
        undefined,
        state,
        (elementToRemove, newSchema) => {
          if (!elementToRemove) {
            console.error('Could not remove ui element', elementToRemove);
            return state;
          }
          const removeResult = removeUiElement(
            elementToRemove,
            newSchema,
            state.categorizationService,
          );
          if (isUUIDError(removeResult)) {
            console.error('Could not remove ui element', removeResult);
            return state;
          }
          const uiSchemaToReturn = elementToRemove.parent
            ? getRoot(elementToRemove)
            : undefined;
          return {
            schema: newSchema,
            uiSchema: uiSchemaToReturn,
            fieldState: emptyFieldState,
          };
        },
      );
    case ADD_DETAIL:
      return withCloneTrees(
        state.schema,
        undefined,
        state.uiSchema,
        undefined,
        state,
        (schema, uiSchema) => {
          const elementForDetail = findByUUID(
            uiSchema,
            action.uiSchemaElementId,
          );
          if (isUUIDError(elementForDetail)) {
            console.error('Could not find ui schema element', elementForDetail);
            return state;
          }
          const linkResult = traverse(
            action.detail,
            (uiSchemaElement, _parent, acc) => {
              if (uiSchemaElement.linkedSchemaElement) {
                const schemaEl = findByUUID(
                  schema,
                  uiSchemaElement.linkedSchemaElement,
                );
                if (isUUIDError(schemaEl)) {
                  acc.error = true;
                } else {
                  (schemaEl.linkedUISchemaElements =
                    schemaEl.linkedUISchemaElements || new Set()).add(
                    action.detail.uuid,
                  );
                }
              }
            },
            { error: false },
          );
          if (linkResult.error) return state;
          elementForDetail.options = elementForDetail.options || {};
          elementForDetail.options.detail = action.detail;
          action.detail.parent = elementForDetail;
          return { schema, uiSchema, fieldState: emptyFieldState };
        },
      );
  }
  return state;
};

// ---------------------------------------------------------------------------
// removeUiElement
// ---------------------------------------------------------------------------

const removeUiElement = (
  elementToRemove: EditorUISchemaElement,
  schema?: SchemaElement,
  categorizationService?: CategorizationService,
): true | UUIDError => {
  if (schema && elementToRemove.linkedSchemaElement) {
    const uuidToRemove = elementToRemove.uuid;
    if (!uuidToRemove) return { id: 'noUUIDError', element: elementToRemove };
    const linkedSchemaElement = findByUUID(
      getRoot(schema),
      elementToRemove.linkedSchemaElement,
    );
    if (!isUUIDError(linkedSchemaElement)) {
      linkedSchemaElement?.linkedUISchemaElements?.delete(uuidToRemove);
    }
  }
  if (elementToRemove.parent) {
    if ((elementToRemove.parent as EditorLayout).elements) {
      const index = (elementToRemove.parent as EditorLayout).elements.indexOf(
        elementToRemove,
      );
      if (index !== -1) {
        (elementToRemove.parent as EditorLayout).elements.splice(index, 1);
      }
    }
    if (elementToRemove.parent.options?.detail === elementToRemove) {
      delete elementToRemove.parent.options.detail;
      if (Object.keys(elementToRemove.parent.options).length === 0) {
        delete elementToRemove.parent.options;
      }
    }
  }
  if (
    elementToRemove.type === 'Categorization' ||
    elementToRemove.type === 'Category'
  ) {
    categorizationService?.removeElement(elementToRemove);
  }
  return true;
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

  // Bestehende Actions
  switch (action.type) {
    case ADD_UNSCOPED_ELEMENT_TO_LAYOUT:
    case UPDATE_UISCHEMA_ELEMENT:
      return {
        ...state,
        uiSchema: uiSchemaReducer(state.uiSchema, action),
      };
    case SET_SCHEMA:
    case SET_UISCHEMA:
    case SET_SCHEMAS:
    case ADD_SCOPED_ELEMENT_TO_LAYOUT:
    case MOVE_UISCHEMA_ELEMENT:
    case REMOVE_UISCHEMA_ELEMENT:
    case ADD_DETAIL: {
      const combined = combinedReducer(state, action);
      combined.categorizationService = state.categorizationService;
      combined.fieldState = syncFieldState(combined.schema, combined.uiSchema);
      return combined;
    }
  }

  return state;
};

// ---------------------------------------------------------------------------
// createInitialEditorState
// ---------------------------------------------------------------------------

export interface EditorStateInit {
  categorizationService?: CategorizationService;
}

export function createInitialEditorState(init: EditorStateInit): EditorState {
  return {
    schema: undefined,
    uiSchema: undefined,
    categorizationService: init.categorizationService,
    fieldState: emptyFieldState,
  };
}
