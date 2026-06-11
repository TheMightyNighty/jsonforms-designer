/**
 * Konvertiert extern geladene JSONForms-Schemas (z. B. aus einem
 * SchemaService) in den Form-First-Zustand des Editors.
 *
 * Hintergrund (siehe docs/adr/0001-fieldstate-als-single-source.md):
 * Früher bauten SET_SCHEMA/SET_UISCHEMA einen separaten, geerbten
 * Baum-State auf, der einen zweiten Editor-Pfad rendert. Seit der
 * State-Konsolidierung ist FieldAwareState die einzige Laufzeit-Quelle —
 * extern geladene Schemas werden hierüber konvertiert.
 *
 * Bekannte Einschränkung: Exotische uiSchema-Knoten (z. B. Categorization)
 * werden best-effort konvertiert (fromLegacy-Fallback: Label) — verlustfrei
 * sind Control, Label, HorizontalLayout/Spalten und Group.
 */
import { JsonSchema7, UISchemaElement } from '@jsonforms/core';

import { normalizeFieldState } from '../api/fieldStateStorage';
import { FieldAwareState } from '../model/addFieldReducer';
import { FlatElement, fromLegacy, toLegacy } from '../model/uiElements';

export function fieldStateFromSchemas(
  schema: JsonSchema7 | undefined,
  uiSchema: UISchemaElement | undefined,
): FieldAwareState | undefined {
  if (!schema && !uiSchema) return undefined;

  const baseSchema: JsonSchema7 = schema ?? { type: 'object', properties: {} };

  let elements: FlatElement[];
  if (uiSchema) {
    const root = uiSchema as FlatElement;
    // VerticalLayout-Root wird entpackt, alles andere als Einzelelement
    // übernommen (z. B. ein einzelnes Control oder ein HorizontalLayout).
    const rawElements =
      root.type === 'VerticalLayout' ? (root.elements ?? []) : [root];
    elements = rawElements.map((el) => toLegacy(fromLegacy(el)));
  } else {
    // Ohne uiSchema: ein Control je Schema-Property generieren.
    elements = Object.keys(baseSchema.properties ?? {}).map((key) => ({
      type: 'Control',
      scope: `#/properties/${key}`,
    }));
  }

  return normalizeFieldState({
    schema: baseSchema,
    uiSchema: { type: 'VerticalLayout', elements },
  });
}
