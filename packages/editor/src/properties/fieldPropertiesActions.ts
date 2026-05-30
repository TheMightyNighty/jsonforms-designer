/**
 * UPDATE_FIELD_PROPERTY — Action für das Properties-Panel
 *
 * Ändert eine einzelne strukturelle Eigenschaft eines Feldes:
 *   - label (→ schema.properties[key].title)
 *   - description (→ schema.properties[key].description)
 *   - placeholder (→ uischema Control options.placeholder)
 *   - required (→ schema.required[])
 */

export const UPDATE_FIELD_PROPERTY = 'UPDATE_FIELD_PROPERTY' as const;

export type FieldPropertyKey = 'label' | 'description' | 'placeholder' | 'required';

export interface UpdateFieldPropertyPayload {
  /** scope des Controls, z. B. "#/properties/vorname" */
  scope: string;
  /** Welche Eigenschaft geändert wird */
  property: FieldPropertyKey;
  /** Neuer Wert — string für label/description/placeholder, boolean für required */
  value: string | boolean;
}

export interface UpdateFieldPropertyAction {
  type: typeof UPDATE_FIELD_PROPERTY;
  payload: UpdateFieldPropertyPayload;
}

export function createUpdateFieldPropertyAction(
  scope: string,
  property: FieldPropertyKey,
  value: string | boolean
): UpdateFieldPropertyAction {
  return {
    type: UPDATE_FIELD_PROPERTY,
    payload: { scope, property, value },
  };
}

/** Extrahiert den propertyKey aus einem scope: "#/properties/vorname" → "vorname" */
export function propertyKeyFromScope(scope: string): string {
  const match = scope.match(/^#\/properties\/(.+)$/);
  if (!match) throw new Error(`Ungültiger scope: "${scope}"`);
  return match[1];
}
