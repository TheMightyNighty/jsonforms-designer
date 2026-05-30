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
  propertyKeyFromScope,
} from './fieldPropertiesActions';
import { FieldAwareState } from '../core/model/addFieldReducer';

export function fieldPropertiesReducer<S extends FieldAwareState>(
  state: S,
  action: UpdateFieldPropertyAction
): S {
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
  const elements = state.uiSchema.elements.map((el) => {
    if (el.scope !== scope) return el;
    return {
      ...el,
      options: { ...(el.options ?? {}), ...optionsPatch },
    };
  });

  return {
    ...state,
    uiSchema: { ...state.uiSchema, elements },
  };
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
