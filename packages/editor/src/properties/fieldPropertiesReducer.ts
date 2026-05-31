/**
 * Verarbeitet UPDATE_FIELD_PROPERTY-Actions:
 *   - label      → schema.properties[key].title
 *   - description → schema.properties[key].description
 *   - placeholder → uischema Control options.placeholder
 *   - required   → schema.required[] (hinzufügen / entfernen)
 *
 * Gleiche State-Schnittstelle wie addFieldReducer (FieldAwareState).
 */

import { JsonSchema7 } from '@jsonforms/core';
import {
  UpdateFieldPropertyAction,
  UPDATE_FIELD_PROPERTY,
  SET_FIELD_RULE,
  SetFieldRuleAction,
  propertyKeyFromScope,
} from './fieldPropertiesActions';
import { FieldAwareState } from '../core/model/addFieldReducer';

// ---------------------------------------------------------------------------
// Hilfsfunktion: Element-Baum rekursiv transformieren
// ---------------------------------------------------------------------------

function mapElementsDeep(elements: any[], fn: (el: any) => any): any[] {
  return elements.map((el) => {
    const updated = fn(el);
    if (el.type === 'ColumnContainer') {
      return { ...updated, columns: (el.columns as any[][]).map((col) => mapElementsDeep(col, fn)) };
    }
    if (el.type === 'GroupContainer') {
      return { ...updated, children: mapElementsDeep(el.children, fn) };
    }
    return updated;
  });
}

// ---------------------------------------------------------------------------
// Kombinierter Reducer (UPDATE_FIELD_PROPERTY + SET_FIELD_RULE)
// ---------------------------------------------------------------------------

export function fieldPropertiesReducer<S extends FieldAwareState>(
  state: S,
  action: UpdateFieldPropertyAction | SetFieldRuleAction
): S {
  if (action.type === SET_FIELD_RULE) {
    const { scope, rule } = action.payload;
    const elements = mapElementsDeep(state.uiSchema.elements as any[], (el) => {
      if (el.scope !== scope) return el;
      if (rule === null) {
        const { rule: _r, ...rest } = el;
        return rest;
      }
      return { ...el, rule };
    });
    return { ...state, uiSchema: { ...state.uiSchema, elements } };
  }

  if (action.type !== UPDATE_FIELD_PROPERTY) return state;

  const { scope, property, value } = action.payload;
  const key = propertyKeyFromScope(scope);

  switch (property) {
    case 'label':
      return updateSchemaProperty(state, key, { title: value as string });

    case 'description':
      return updateSchemaProperty(state, key, { description: value as string });

    case 'placeholder':
      return updateControlOptions(state, scope, { placeholder: value as string });

    case 'required':
      return updateRequired(state, key, value as boolean);

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Interne Hilfsfunktionen
// ---------------------------------------------------------------------------

function updateSchemaProperty<S extends FieldAwareState>(
  state: S,
  key: string,
  patch: Partial<JsonSchema7 & { title?: string; description?: string }>
): S {
  const existing = state.schema.properties?.[key];
  if (!existing) return state;

  return {
    ...state,
    schema: {
      ...state.schema,
      properties: {
        ...state.schema.properties,
        [key]: { ...existing, ...patch },
      },
    },
  };
}

function updateControlOptions<S extends FieldAwareState>(
  state: S,
  scope: string,
  optionsPatch: Record<string, unknown>
): S {
  const elements = mapElementsDeep(state.uiSchema.elements as any[], (el) => {
    if (el.scope !== scope) return el;
    return { ...el, options: { ...(el.options ?? {}), ...optionsPatch } };
  });
  return { ...state, uiSchema: { ...state.uiSchema, elements } };
}

function updateRequired<S extends FieldAwareState>(
  state: S,
  key: string,
  required: boolean
): S {
  const current = state.schema.required ?? [];
  const next = required
    ? current.includes(key) ? current : [...current, key]
    : current.filter((k) => k !== key);

  return {
    ...state,
    schema: { ...state.schema, required: next },
  };
}
