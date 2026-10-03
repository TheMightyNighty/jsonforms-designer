/**
 * Erzeugt aus dem Arbeitsstand des Editors das UI-Schema, das ein
 * JSONForms-Renderer erwartet. Reiter werden zur Categorization.
 *
 * Die Vorschau stellt Abschnittsköpfe und Annotationen selbst dar und
 * übergibt dafür einen eigenen Konverter; Exporte für andere Systeme
 * behalten sie als Label.
 */
import { FieldAwareState, FormTab } from '../model/addFieldReducer';
import { toJsonForms, UiElement } from '../model/uiElements';

export type ElementKonverter = (el: UiElement) => object | null;

function tabIndex(
  fieldState: FieldAwareState,
  el: UiElement,
  anzahl: number,
): number {
  const id = 'scope' in el ? (el.scope ?? el.id) : el.id;
  return Math.min(fieldState.tabAssignments[id] ?? 0, anzahl - 1);
}

/** Je Reiter die konvertierten Elemente; ohne Reiter genau eine Liste. */
export function elementeJeReiter(
  fieldState: FieldAwareState,
  konvertiere: ElementKonverter = toJsonForms,
): object[][] {
  const anzahl = Math.max(fieldState.tabs.length, 1);
  const buckets: object[][] = Array.from({ length: anzahl }, () => []);
  for (const el of fieldState.uiSchema.elements) {
    const jf = konvertiere(el);
    if (jf) buckets[tabIndex(fieldState, el, anzahl)].push(jf);
  }
  return buckets;
}

export function buildJsonFormsUiSchema(
  fieldState: FieldAwareState,
  konvertiere: ElementKonverter = toJsonForms,
): object {
  const buckets = elementeJeReiter(fieldState, konvertiere);
  if (fieldState.tabs.length === 0) {
    return { type: 'VerticalLayout', elements: buckets[0] };
  }
  return {
    type: 'Categorization',
    elements: fieldState.tabs.map((tab: FormTab, i: number) => ({
      type: 'Category',
      label: tab.label,
      elements: [{ type: 'VerticalLayout', elements: buckets[i] ?? [] }],
    })),
  };
}
