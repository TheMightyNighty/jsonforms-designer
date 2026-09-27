/**
 * Verarbeitet UPDATE_FIELD_PROPERTY-Actions:
 *   - label      → schema.properties[key].title
 *   - description → schema.properties[key].description
 *   - placeholder → uischema Control options.placeholder
 *   - required   → schema.required[] (hinzufügen / entfernen)
 *
 * sowie SET_FIELD_RULE (bedingte Anzeige) und CHANGE_FIELD_TYPE (Wechsel des
 * Feldtyps innerhalb desselben JSON-Basistyps).
 *
 * Gleiche State-Schnittstelle wie addFieldReducer (FieldAwareState).
 */

import { JsonSchema7 } from '@jsonforms/core';

import { FieldAwareState } from '../core/model/addFieldReducer';
import { FlatElement } from '../core/model/uiElements';
import { stripHtml } from '../core/util/plainText';
import { getFieldType } from '../field-types/fieldTypes';
import { passtValidatorZuFeldtyp } from '../opencode/validatorZuordnung';
import {
  CHANGE_FIELD_TYPE,
  ChangeFieldTypeAction,
  propertyKeyFromScope,
  SET_FIELD_RULE,
  SetFieldRuleAction,
  UPDATE_FIELD_PROPERTY,
  UpdateFieldPropertyAction,
} from './fieldPropertiesActions';

// ---------------------------------------------------------------------------
// Hilfsfunktion: Element-Baum rekursiv transformieren
// ---------------------------------------------------------------------------

/** uiSchema-Element, das zusätzlich eine JSONForms-`rule` tragen kann. */
type UiSchemaElement = FlatElement & { rule?: unknown };

function mapElementsDeep(
  elements: UiSchemaElement[],
  fn: (el: UiSchemaElement) => UiSchemaElement,
): UiSchemaElement[] {
  return elements.map((el) => {
    const updated = fn(el);
    if (el.type === 'ColumnContainer') {
      return {
        ...updated,
        columns: (el.columns ?? []).map((col) => mapElementsDeep(col, fn)),
      };
    }
    if (el.type === 'GroupContainer') {
      return { ...updated, children: mapElementsDeep(el.children ?? [], fn) };
    }
    return updated;
  });
}

// ---------------------------------------------------------------------------
// Kombinierter Reducer (UPDATE_FIELD_PROPERTY + SET_FIELD_RULE)
// ---------------------------------------------------------------------------

export function fieldPropertiesReducer<S extends FieldAwareState>(
  state: S,
  action:
    | UpdateFieldPropertyAction
    | SetFieldRuleAction
    | ChangeFieldTypeAction,
): S {
  if (action.type === CHANGE_FIELD_TYPE) {
    return changeFieldType(state, action);
  }

  if (action.type === SET_FIELD_RULE) {
    const { scope, rule } = action.payload;
    const elements = mapElementsDeep(
      state.uiSchema.elements as UiSchemaElement[],
      (el) => {
        if (el.scope !== scope) return el;
        if (rule === null) {
          const { rule: _r, ...rest } = el;
          return rest;
        }
        return { ...el, rule };
      },
    );
    return { ...state, uiSchema: { ...state.uiSchema, elements } };
  }

  if (action.type !== UPDATE_FIELD_PROPERTY) return state;

  const { scope, property, value } = action.payload;
  const key = propertyKeyFromScope(scope);

  switch (property) {
    // Anzeigetexte ohne Markup speichern (OFM-R-404, Plain-Text-Garantie).
    case 'label':
      return updateSchemaProperty(state, key, {
        title: stripHtml(value as string),
      });

    case 'description':
      return updateSchemaProperty(state, key, {
        description: stripHtml(value as string),
      });

    case 'placeholder':
      return updateControlOptions(state, scope, {
        placeholder: value as string,
      });

    case 'required':
      return updateRequired(state, key, value as boolean);

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Feldtyp wechseln
// ---------------------------------------------------------------------------

/**
 * Tauscht Schema-Fragment und UI-Optionen eines Feldes gegen die des neuen
 * Feldtyps aus. Erhalten bleiben die redaktionellen Angaben — Bezeichnung,
 * Hilfetext und der Platzhalter, sofern der neue Typ keinen eigenen
 * mitbringt. Der Property-Schlüssel und damit der scope bleiben unberührt,
 * sonst zeigten Bedingungen und Übersetzungen ins Leere.
 *
 * Auch ein Wechsel über Basistypgrenzen hinweg (Text → Ja/Nein) ist erlaubt.
 * Er ist nicht verlustfrei, deshalb fragt die Oberfläche vorher nach und
 * benennt die Folgen (`wechselFolgen`). Der Reducer räumt dabei konsistent
 * auf: Prüfungen, die zum neuen Typ nicht mehr passen, werden entfernt statt
 * unsichtbar am Feld hängen zu bleiben. Bedingungen anderer Felder bleiben
 * bestehen — sie zu löschen wäre ein stiller Eingriff in fremde Felder; die
 * Qualitäts-Ampel und die Rückfrage weisen darauf hin.
 */
function changeFieldType<S extends FieldAwareState>(
  state: S,
  action: ChangeFieldTypeAction,
): S {
  const { scope, feldtypId } = action.payload;
  const key = propertyKeyFromScope(scope);
  const bestehend = state.schema.properties?.[key] as
    | (JsonSchema7 & { title?: string; description?: string })
    | undefined;
  if (!bestehend) return state;

  let ziel;
  try {
    ziel = getFieldType(feldtypId);
  } catch {
    // Unbekannte Feldtyp-id: nichts tun statt das Feld zu zerstören.
    return state;
  }
  // Strukturelemente tragen keine Antwort — ein Feld kann nicht zu einer
  // Überschrift werden.
  if (ziel.isStructural) return state;

  const bisherigePruefungen =
    (bestehend as { 'x-opencode-validators'?: string[] })[
      'x-opencode-validators'
    ] ?? [];
  const weiterPassendePruefungen = bisherigePruefungen.filter((id) =>
    passtValidatorZuFeldtyp(id, feldtypId),
  );

  const neuesSchema = {
    ...ziel.schema,
    title: bestehend.title ?? ziel.schema.title,
    ...(bestehend.description !== undefined
      ? { description: bestehend.description }
      : {}),
    ...(weiterPassendePruefungen.length > 0
      ? { 'x-opencode-validators': weiterPassendePruefungen }
      : {}),
  };

  const mitSchema: S = {
    ...state,
    schema: {
      ...state.schema,
      properties: { ...state.schema.properties, [key]: neuesSchema },
    },
  };

  const elements = mapElementsDeep(
    mitSchema.uiSchema.elements as UiSchemaElement[],
    (el) => {
      if (el.scope !== scope) return el;
      const bisherigerPlatzhalter = (el.options ?? {})['placeholder'];
      const zielOptionen = { ...(ziel.uiSchema.options ?? {}) };
      // Einen selbst gesetzten Platzhalter nicht durch den Beispieltext des
      // neuen Typs ersetzen — aber nur, solange der neue Typ überhaupt ein
      // Eingabefeld mit Platzhalter ist.
      if (bisherigerPlatzhalter && ziel.schema.type === 'string') {
        zielOptionen['placeholder'] = bisherigerPlatzhalter;
      }
      return { ...el, options: zielOptionen };
    },
  );

  return { ...mitSchema, uiSchema: { ...mitSchema.uiSchema, elements } };
}

// ---------------------------------------------------------------------------
// Interne Hilfsfunktionen
// ---------------------------------------------------------------------------

function updateSchemaProperty<S extends FieldAwareState>(
  state: S,
  key: string,
  patch: Partial<JsonSchema7 & { title?: string; description?: string }>,
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
  optionsPatch: Record<string, unknown>,
): S {
  const elements = mapElementsDeep(
    state.uiSchema.elements as UiSchemaElement[],
    (el) => {
      if (el.scope !== scope) return el;
      return { ...el, options: { ...(el.options ?? {}), ...optionsPatch } };
    },
  );
  return { ...state, uiSchema: { ...state.uiSchema, elements } };
}

function updateRequired<S extends FieldAwareState>(
  state: S,
  key: string,
  required: boolean,
): S {
  const current = state.schema.required ?? [];
  const next = required
    ? current.includes(key)
      ? current
      : [...current, key]
    : current.filter((k) => k !== key);

  return {
    ...state,
    schema: { ...state.schema, required: next },
  };
}
