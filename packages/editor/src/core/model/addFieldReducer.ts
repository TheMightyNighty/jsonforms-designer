import { JsonSchema7 } from '@jsonforms/core';

import {
  ADD_FIELD,
  ADD_FIM_GRUPPE,
  ADD_TAB,
  AddFieldAction,
  AddFimGruppeAction,
  AddTabAction,
  buildScope,
  LOAD_TEMPLATE,
  LoadTemplateAction,
  REMOVE_FIELD,
  REMOVE_TAB,
  RemoveFieldAction,
  RemoveTabAction,
  RENAME_TAB,
  RenameTabAction,
  REORDER_ELEMENT,
  REORDER_TABS,
  ReorderElementAction,
  ReorderTabsAction,
  SET_ACTIVE_TAB,
  SET_FIELD_STATE,
  SetActiveTabAction,
  SetFieldStateAction,
} from './addFieldActions';
import { FlatElement, fromLegacy, newId, UiElement } from './uiElements';

// ---------------------------------------------------------------------------
// Tab-Struktur
// ---------------------------------------------------------------------------

export interface FormTab {
  label: string;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface FieldAwareState {
  schema: JsonSchema7 & {
    properties?: Record<string, JsonSchema7>;
    required?: string[];
  };
  uiSchema: {
    type: string;
    /** Strikte UiElement-Union; lose Formate (FlatElement) werden an den
     *  Grenzen über fromLegacy normalisiert. */
    elements: UiElement[];
  };
  tabs: FormTab[];
  activeTabIndex: number;
  tabAssignments: Record<string, number>;
  lineNumbersEnabled: boolean;
  sectionColors: Record<string, string>;
}

/**
 * Lose Eingangsform an den Grenzen (Templates, Import, Code-Modus):
 * Elemente dürfen als FlatElement ankommen und werden beim Verarbeiten
 * über fromLegacy in die strikte UiElement-Union normalisiert.
 */
export interface FieldStateInput extends Omit<FieldAwareState, 'uiSchema'> {
  uiSchema: { type: string; elements: FlatElement[] };
}

// ---------------------------------------------------------------------------
// addFieldReducer
// ---------------------------------------------------------------------------

export function addFieldReducer<S extends FieldAwareState>(
  state: S,
  action: AddFieldAction,
): S {
  if (action.type !== ADD_FIELD) return state;
  const {
    propertyKey,
    schemaFragment,
    uiSchemaOptions,
    insertAfterScope,
    tabIndex,
  } = action.payload;

  const existingKeys = Object.keys(state.schema.properties ?? {});
  const safeKey = resolveKey(propertyKey, existingKeys);
  const safeScope = buildScope(safeKey);

  // Strukturelle Elemente (Label, HorizontalLayout, Group) bekommen keine schema-Property
  const { isStructural } = action.payload;

  // Für Layout-Container sofort das neue UiElement-Format erzeugen
  let newControl: UiElement;
  if (isStructural && action.payload.uiSchemaType === 'HorizontalLayout') {
    const widths = (uiSchemaOptions?.widths as number[]) ?? [1, 1];
    newControl = {
      id: newId('col'),
      type: 'ColumnContainer',
      widths,
      columns: widths.map(() => [] as UiElement[]),
    };
  } else if (isStructural && action.payload.uiSchemaType === 'Group') {
    newControl = {
      id: newId('grp'),
      type: 'GroupContainer',
      label: action.payload.label,
      children: [],
    };
  } else if (isStructural) {
    // Label, Alert etc. — Pseudo-Scope als Legacy-Identität (Tab-Zuordnung)
    newControl = {
      id: newId('lbl'),
      type: 'Label',
      label: action.payload.label,
      scope: safeScope,
      ...(uiSchemaOptions ? { options: uiSchemaOptions } : {}),
    };
  } else {
    // Normales Control-Feld
    newControl = {
      id: newId('ctrl'),
      type: 'Control' as const,
      scope: safeScope,
      ...(uiSchemaOptions ? { options: uiSchemaOptions } : {}),
    };
  }

  // Tab-Zuweisung: wenn tabIndex angegeben, dann diesem Tab zuweisen; sonst activeTabIndex
  const effectiveTabIndex =
    tabIndex ?? (state.tabs.length > 0 ? state.activeTabIndex : undefined);
  const nextTabAssignments =
    effectiveTabIndex !== undefined
      ? { ...state.tabAssignments, [safeScope]: effectiveTabIndex }
      : state.tabAssignments;

  // Schema nur bei nicht-strukturellen Elementen ändern
  const nextSchema = isStructural
    ? state.schema
    : {
        ...state.schema,
        properties: {
          ...(state.schema.properties ?? {}),
          [safeKey]: schemaFragment,
        },
      };

  return {
    ...state,
    schema: nextSchema,
    uiSchema: {
      ...state.uiSchema,
      elements: insertControl(
        state.uiSchema.elements,
        newControl,
        insertAfterScope,
      ),
    },
    tabAssignments: nextTabAssignments,
  };
}

// ---------------------------------------------------------------------------
// removeFieldReducer
// ---------------------------------------------------------------------------

export function removeFieldReducer<S extends FieldAwareState>(
  state: S,
  action: RemoveFieldAction,
): S {
  if (action.type !== REMOVE_FIELD) return state;
  const target = action.payload.scope;
  const key = target.replace(/^#\/properties\//, '');
  const isPropertyScope = target.startsWith('#/properties/');
  const { [key]: _removed, ...rest } = state.schema.properties ?? {};
  const { [target]: _tab, ...restTabs } = state.tabAssignments;

  /** Entfernt Element mit scope/id === target aus einem Array rekursiv */
  function removeDeep(elements: UiElement[]): UiElement[] {
    return elements
      .filter((el) => !matchesElementKey(el, target))
      .map((el) => {
        if (el.type === 'ColumnContainer') {
          return { ...el, columns: el.columns.map((col) => removeDeep(col)) };
        }
        if (el.type === 'GroupContainer') {
          return { ...el, children: removeDeep(el.children) };
        }
        return el;
      });
  }

  return {
    ...state,
    schema: isPropertyScope
      ? {
          ...state.schema,
          properties: rest,
          required: state.schema.required?.filter((k) => k !== key),
        }
      : state.schema,
    uiSchema: {
      ...state.uiSchema,
      elements: removeDeep(state.uiSchema.elements),
    },
    tabAssignments: restTabs,
  };
}

// ---------------------------------------------------------------------------
// loadTemplateReducer / setFieldStateReducer
// ---------------------------------------------------------------------------

export function loadTemplateReducer<S extends FieldAwareState>(
  state: S,
  action: LoadTemplateAction | SetFieldStateAction,
): S {
  if (action.type !== LOAD_TEMPLATE && action.type !== SET_FIELD_STATE)
    return state;
  // Incoming payload kann ohne tabs/tabAssignments sein (alte Formate) —
  // Defaults ergänzen und Elemente in die strikte UiElement-Union
  // normalisieren (Templates, Code-Modus, Import liefern lose Formen).
  const incoming = action.payload as Partial<FieldStateInput>;
  const incomingUiSchema = incoming.uiSchema
    ? {
        type: incoming.uiSchema.type ?? 'VerticalLayout',
        elements: (incoming.uiSchema.elements ?? []).map(fromLegacy),
      }
    : state.uiSchema;
  return {
    ...state,
    schema: incoming.schema ?? state.schema,
    uiSchema: incomingUiSchema,
    tabs: incoming.tabs ?? [],
    activeTabIndex: incoming.activeTabIndex ?? 0,
    tabAssignments: incoming.tabAssignments ?? {},
    lineNumbersEnabled: incoming.lineNumbersEnabled ?? false,
    sectionColors: incoming.sectionColors ?? {},
  };
}

// ---------------------------------------------------------------------------
// tabReducer
// ---------------------------------------------------------------------------

type AnyTabAction =
  | AddTabAction
  | RemoveTabAction
  | RenameTabAction
  | ReorderTabsAction
  | SetActiveTabAction;

export function tabReducer<S extends FieldAwareState>(
  state: S,
  action: AnyTabAction,
): S {
  switch (action.type) {
    case ADD_TAB: {
      const newTabs = [...state.tabs, { label: action.payload.label }];
      return { ...state, tabs: newTabs, activeTabIndex: newTabs.length - 1 };
    }
    case REMOVE_TAB: {
      const { tabIndex } = action.payload;
      if (state.tabs.length <= 1) return state; // letzten Tab nicht löschen
      const newTabs = state.tabs.filter((_, i) => i !== tabIndex);
      // Felder des gelöschten Tabs dem Tab 0 zuweisen
      const nextAssignments: Record<string, number> = {};
      for (const [scope, idx] of Object.entries(state.tabAssignments)) {
        if (idx === tabIndex) {
          nextAssignments[scope] = 0;
        } else if (idx > tabIndex) {
          nextAssignments[scope] = idx - 1;
        } else {
          nextAssignments[scope] = idx;
        }
      }
      const nextActive = Math.min(state.activeTabIndex, newTabs.length - 1);
      return {
        ...state,
        tabs: newTabs,
        activeTabIndex: nextActive,
        tabAssignments: nextAssignments,
      };
    }
    case RENAME_TAB: {
      const newTabs = state.tabs.map((t, i) =>
        i === action.payload.tabIndex
          ? { ...t, label: action.payload.label }
          : t,
      );
      return { ...state, tabs: newTabs };
    }
    case REORDER_TABS: {
      const { fromIndex, toIndex } = action.payload;
      const newTabs = [...state.tabs];
      const [moved] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, moved);
      // Zuweisung-Indizes anpassen
      const nextAssignments: Record<string, number> = {};
      for (const [scope, idx] of Object.entries(state.tabAssignments)) {
        let newIdx = idx;
        if (idx === fromIndex) {
          newIdx = toIndex;
        } else if (fromIndex < toIndex && idx > fromIndex && idx <= toIndex) {
          newIdx = idx - 1;
        } else if (fromIndex > toIndex && idx >= toIndex && idx < fromIndex) {
          newIdx = idx + 1;
        }
        nextAssignments[scope] = newIdx;
      }
      return { ...state, tabs: newTabs, tabAssignments: nextAssignments };
    }
    case SET_ACTIVE_TAB:
      return { ...state, activeTabIndex: action.payload.tabIndex };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

export function resolveKey(desired: string, existing: string[]): string {
  if (!existing.includes(desired)) return desired;
  let i = 1;
  while (existing.includes(`${desired}_${i}`)) i++;
  return `${desired}_${i}`;
}

/**
 * Element-Identität: Controls und Labels werden historisch über ihren
 * (Pseudo-)Scope angesprochen, Container über ihre id — der Matcher
 * akzeptiert beides.
 */
export function matchesElementKey(el: UiElement, key: string): boolean {
  return el.id === key || ('scope' in el && el.scope === key);
}

export function insertControl(
  elements: UiElement[],
  newControl: UiElement,
  insertAfterScope?: string,
): UiElement[] {
  if (!insertAfterScope) return [...elements, newControl];
  const idx = elements.findIndex((el) =>
    matchesElementKey(el, insertAfterScope),
  );
  if (idx === -1) return [...elements, newControl];
  return [
    ...elements.slice(0, idx + 1),
    newControl,
    ...elements.slice(idx + 1),
  ];
}

// ---------------------------------------------------------------------------
// fimGruppeReducer
// ---------------------------------------------------------------------------

export function fimGruppeReducer<S extends FieldAwareState>(
  state: S,
  action: AddFimGruppeAction,
): S {
  if (action.type !== ADD_FIM_GRUPPE) return state;
  const { gruppenName, felder, insertAfterScope, tabIndex } = action.payload;

  const existingKeys = [...Object.keys(state.schema.properties ?? {})];

  // Duplikat-sichere Keys für alle Felder aufbauen
  const resolvedFelder = felder.map((f) => {
    const safeKey = resolveKey(f.propertyKey, existingKeys);
    existingKeys.push(safeKey);
    const safeScope = buildScope(safeKey);
    return { ...f, safeKey, safeScope };
  });

  // Schema-Properties
  const addedProperties: Record<string, JsonSchema7 & { title?: string }> = {};
  for (const f of resolvedFelder) {
    addedProperties[f.safeKey] = f.schemaFragment;
  }

  // GroupContainer mit vorbefüllten Kindern
  const groupControl = {
    id: newId('grp'),
    type: 'GroupContainer' as const,
    label: gruppenName,
    children: resolvedFelder.map((f) => ({
      id: newId('ctrl'),
      type: 'Control' as const,
      scope: f.safeScope,
      ...(f.uiSchemaOptions && Object.keys(f.uiSchemaOptions).length > 0
        ? { options: f.uiSchemaOptions }
        : {}),
    })),
  };

  const effectiveTabIndex =
    tabIndex ?? (state.tabs.length > 0 ? state.activeTabIndex : undefined);
  const newTabAssignments =
    effectiveTabIndex !== undefined
      ? Object.fromEntries(
          resolvedFelder.map((f) => [f.safeScope, effectiveTabIndex]),
        )
      : {};

  return {
    ...state,
    schema: {
      ...state.schema,
      properties: { ...(state.schema.properties ?? {}), ...addedProperties },
    },
    uiSchema: {
      ...state.uiSchema,
      elements: insertControl(
        state.uiSchema.elements,
        groupControl,
        insertAfterScope,
      ),
    },
    tabAssignments: { ...state.tabAssignments, ...newTabAssignments },
  };
}

// ---------------------------------------------------------------------------
// reorderElementReducer
// ---------------------------------------------------------------------------

export function reorderElementReducer<S extends FieldAwareState>(
  state: S,
  action: ReorderElementAction,
): S {
  if (action.type !== REORDER_ELEMENT) return state;
  const { elementKey, insertAfterKey } = action.payload;

  const elements = state.uiSchema.elements;

  // Element herausfiltern
  const moving = elements.find((el) => matchesElementKey(el, elementKey));
  if (!moving) return state;

  const without = elements.filter((el) => !matchesElementKey(el, elementKey));

  // Ohne insertAfterKey → an den Anfang (oberste Drop-Zone und
  // Tastatur-Hochsortieren übergeben undefined und meinen Position 0).
  let nextElements: UiElement[];
  if (!insertAfterKey) {
    nextElements = [moving, ...without];
  } else {
    const idx = without.findIndex((el) =>
      matchesElementKey(el, insertAfterKey),
    );
    if (idx === -1) {
      nextElements = [...without, moving];
    } else {
      nextElements = [
        ...without.slice(0, idx + 1),
        moving,
        ...without.slice(idx + 1),
      ];
    }
  }

  return {
    ...state,
    uiSchema: { ...state.uiSchema, elements: nextElements },
  };
}
