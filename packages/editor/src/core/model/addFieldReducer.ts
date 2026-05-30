
import { JsonSchema7 } from '@jsonforms/core';
import { newId } from './uiElements';
import {
  ADD_FIELD, AddFieldAction, buildScope,
  REORDER_ELEMENT, ReorderElementAction,
  REMOVE_FIELD, RemoveFieldAction,
  LOAD_TEMPLATE, LoadTemplateAction,
  SET_FIELD_STATE, SetFieldStateAction,
  ADD_TAB, REMOVE_TAB, RENAME_TAB, REORDER_TABS, SET_ACTIVE_TAB,
  AddTabAction, RemoveTabAction, RenameTabAction, ReorderTabsAction, SetActiveTabAction,
} from './addFieldActions';

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
    elements: Array<{ type: string; scope?: string; options?: Record<string, unknown> }>;
  };
  tabs: FormTab[];
  activeTabIndex: number;
  tabAssignments: Record<string, number>;
  lineNumbersEnabled: boolean;
  sectionColors: Record<string, string>;
}

// ---------------------------------------------------------------------------
// addFieldReducer
// ---------------------------------------------------------------------------

export function addFieldReducer<S extends FieldAwareState>(state: S, action: AddFieldAction): S {
  if (action.type !== ADD_FIELD) return state;
  const { propertyKey, schemaFragment, uiSchemaOptions, insertAfterScope, tabIndex } = action.payload;

  const existingKeys = Object.keys(state.schema.properties ?? {});
  const safeKey = resolveKey(propertyKey, existingKeys);
  const safeScope = buildScope(safeKey);

  // Strukturelle Elemente (Label, HorizontalLayout, Group) bekommen keine schema-Property
  const { isStructural } = action.payload;

  // Für Layout-Container sofort das neue UiElement-Format erzeugen
  let newControl: any;
  if (isStructural && action.payload.uiSchemaType === 'HorizontalLayout') {
    const widths = (uiSchemaOptions?.widths as number[]) ?? [1, 1];
    newControl = {
      id: newId('col'),
      type: 'ColumnContainer',
      widths,
      columns: widths.map(() => [] as any[]),
    };
  } else if (isStructural && action.payload.uiSchemaType === 'Group') {
    newControl = {
      id: newId('grp'),
      type: 'GroupContainer',
      label: action.payload.label,
      children: [],
    };
  } else if (isStructural) {
    // Label, Alert etc.
    newControl = {
      id: newId('lbl'),
      type: action.payload.uiSchemaType ?? 'Label',
      scope: safeScope,
      label: action.payload.label,
      ...(uiSchemaOptions ? { options: uiSchemaOptions } : {}),
    };
  } else {
    // Normales Control-Feld
    newControl = {
      type: 'Control' as const,
      scope: safeScope,
      ...(uiSchemaOptions ? { options: uiSchemaOptions } : {}),
    };
  }

  // Tab-Zuweisung: wenn tabIndex angegeben, dann diesem Tab zuweisen; sonst activeTabIndex
  const effectiveTabIndex = tabIndex ?? (state.tabs.length > 0 ? state.activeTabIndex : undefined);
  const nextTabAssignments =
    effectiveTabIndex !== undefined
      ? { ...state.tabAssignments, [safeScope]: effectiveTabIndex }
      : state.tabAssignments;

  // Schema nur bei nicht-strukturellen Elementen ändern
  const nextSchema = isStructural
    ? state.schema
    : {
        ...state.schema,
        properties: { ...(state.schema.properties ?? {}), [safeKey]: schemaFragment },
      };

  return {
    ...state,
    schema: nextSchema,
    uiSchema: {
      ...state.uiSchema,
      elements: insertControl(state.uiSchema.elements, newControl, insertAfterScope),
    },
    tabAssignments: nextTabAssignments,
  };
}

// ---------------------------------------------------------------------------
// removeFieldReducer
// ---------------------------------------------------------------------------

export function removeFieldReducer<S extends FieldAwareState>(state: S, action: RemoveFieldAction): S {
  if (action.type !== REMOVE_FIELD) return state;
  const target = action.payload.scope;
  const key = target.replace(/^#\/properties\//, '');
  const isPropertyScope = target.startsWith('#/properties/');
  const { [key]: _removed, ...rest } = state.schema.properties ?? {};
  const { [target]: _tab, ...restTabs } = state.tabAssignments;

  /** Entfernt Element mit scope/id === target aus einem Array rekursiv */
  function removeDeep(elements: any[]): any[] {
    return elements
      .filter((el: any) => el.scope !== target && el.id !== target)
      .map((el: any) => {
        if (el.columns) {
          return { ...el, columns: el.columns.map((col: any[]) => removeDeep(col)) };
        }
        if (el.children) {
          return { ...el, children: removeDeep(el.children) };
        }
        return el;
      });
  }

  return {
    ...state,
    schema: isPropertyScope ? {
      ...state.schema,
      properties: rest,
      required: state.schema.required?.filter((k) => k !== key),
    } : state.schema,
    uiSchema: { ...state.uiSchema, elements: removeDeep(state.uiSchema.elements as any[]) },
    tabAssignments: restTabs,
  };
}

// ---------------------------------------------------------------------------
// loadTemplateReducer / setFieldStateReducer
// ---------------------------------------------------------------------------

export function loadTemplateReducer<S extends FieldAwareState>(
  state: S,
  action: LoadTemplateAction | SetFieldStateAction
): S {
  if (action.type !== LOAD_TEMPLATE && action.type !== SET_FIELD_STATE) return state;
  // Incoming payload kann ohne tabs/tabAssignments sein (alte Formate) — Defaults ergänzen
  const incoming = action.payload as Partial<FieldAwareState>;
  return {
    ...state,
    schema: incoming.schema ?? state.schema,
    uiSchema: incoming.uiSchema ?? state.uiSchema,
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

type AnyTabAction = AddTabAction | RemoveTabAction | RenameTabAction | ReorderTabsAction | SetActiveTabAction;

export function tabReducer<S extends FieldAwareState>(state: S, action: AnyTabAction): S {
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
      return { ...state, tabs: newTabs, activeTabIndex: nextActive, tabAssignments: nextAssignments };
    }
    case RENAME_TAB: {
      const newTabs = state.tabs.map((t, i) =>
        i === action.payload.tabIndex ? { ...t, label: action.payload.label } : t
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

export function insertControl(
  elements: FieldAwareState['uiSchema']['elements'],
  newControl: FieldAwareState['uiSchema']['elements'][number],
  insertAfterScope?: string
): FieldAwareState['uiSchema']['elements'] {
  if (!insertAfterScope) return [...elements, newControl];
  const idx = elements.findIndex((el) => el.scope === insertAfterScope);
  if (idx === -1) return [...elements, newControl];
  return [...elements.slice(0, idx + 1), newControl, ...elements.slice(idx + 1)];
}

// ---------------------------------------------------------------------------
// reorderElementReducer
// ---------------------------------------------------------------------------

export function reorderElementReducer<S extends FieldAwareState>(
  state: S,
  action: ReorderElementAction
): S {
  if (action.type !== REORDER_ELEMENT) return state;
  const { elementKey, insertAfterKey } = action.payload;

  const elements = state.uiSchema.elements as any[];

  // Element herausfiltern
  const moving = elements.find((el) => (el.id ?? el.scope) === elementKey);
  if (!moving) return state;

  const without = elements.filter((el) => (el.id ?? el.scope) !== elementKey);

  // Einfüge-Position bestimmen
  let nextElements: any[];
  if (!insertAfterKey) {
    nextElements = [...without, moving];
  } else {
    const idx = without.findIndex((el) => (el.id ?? el.scope) === insertAfterKey);
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
