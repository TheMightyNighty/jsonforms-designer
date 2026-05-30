/**
 * Universelle UiElement-Typen — intern im Editor.
 * Konverter nach JSONForms-Format (toLegacy / toJsonForms).
 */

export type UiElementType =
  | 'Control'
  | 'Label'
  | 'ColumnContainer'
  | 'GroupContainer';

interface BaseUiElement {
  id: string;
  type: UiElementType;
  options?: Record<string, unknown>;
}

export interface ControlElement extends BaseUiElement {
  type: 'Control';
  scope: string;
}

export interface LabelElement extends BaseUiElement {
  type: 'Label';
  label: string;
  variant?: 'heading' | 'text' | 'info' | 'warning';
}

export interface ColumnContainer extends BaseUiElement {
  type: 'ColumnContainer';
  widths: number[];
  columns: UiElement[][];
}

export interface GroupContainer extends BaseUiElement {
  type: 'GroupContainer';
  label: string;
  children: UiElement[];
}

export type UiElement =
  | ControlElement
  | LabelElement
  | ColumnContainer
  | GroupContainer;

/** Flaches Legacy-Element wie in uiSchema.elements */
export type FlatElement = {
  type: string;
  scope?: string;
  label?: string;
  id?: string;
  options?: Record<string, unknown>;
  elements?: FlatElement[];
  children?: FlatElement[];
  columns?: FlatElement[][];
  widths?: number[];
};

// ---------------------------------------------------------------------------
// ID-Generator
// ---------------------------------------------------------------------------
let _idCounter = 0;
export function newId(prefix = 'el'): string {
  return `${prefix}_${Date.now()}_${++_idCounter}`;
}

// ---------------------------------------------------------------------------
// fromLegacy: altes Format → neues UiElement-Format
// ---------------------------------------------------------------------------
export function fromLegacy(el: FlatElement): UiElement {
  if (el.type === 'Control') {
    return { id: el.id ?? newId('ctrl'), type: 'Control', scope: el.scope ?? '', options: el.options };
  }
  if (el.type === 'Label') {
    const variant = (el.options?.variant ?? 'text') as LabelElement['variant'];
    return { id: el.id ?? newId('lbl'), type: 'Label', label: el.label ?? '', variant, options: el.options };
  }
  if (el.type === 'HorizontalLayout' || el.type === 'ColumnContainer') {
    const widths = (el.options?.widths ?? el.widths ?? [1, 1]) as number[];
    // Wenn .columns bereits vorhanden → direkter Import
    if (el.columns) {
      return {
        id: el.id ?? newId('col'), type: 'ColumnContainer', widths,
        columns: el.columns.map((col) => col.map(fromLegacy)),
        options: el.options,
      };
    }
    // Legacy: elements → erste Spalte befüllen
    const cols: UiElement[][] = widths.map(() => []);
    (el.elements ?? []).forEach((child, i) => {
      cols[Math.min(i, cols.length - 1)].push(fromLegacy(child));
    });
    return { id: el.id ?? newId('col'), type: 'ColumnContainer', widths, columns: cols };
  }
  if (el.type === 'Group' || el.type === 'GroupContainer') {
    const children = (el.elements ?? el.children ?? []).map(fromLegacy);
    return { id: el.id ?? newId('grp'), type: 'GroupContainer', label: el.label ?? 'Gruppe', children, options: el.options };
  }
  // Fallback
  return { id: el.id ?? newId('el'), type: 'Label', label: el.label ?? el.type, variant: 'text' };
}

// ---------------------------------------------------------------------------
// toLegacy: internes Format → flaches FlatElement (für JSON-Export / Persistenz)
// ---------------------------------------------------------------------------
export function toLegacy(el: UiElement): FlatElement {
  if (el.type === 'Control') {
    return { id: el.id, type: 'Control', scope: el.scope, options: el.options };
  }
  if (el.type === 'Label') {
    return { id: el.id, type: 'Label', label: el.label, options: { ...el.options, variant: el.variant } };
  }
  if (el.type === 'ColumnContainer') {
    return {
      id: el.id, type: 'ColumnContainer',
      widths: el.widths,
      columns: el.columns.map((col) => col.map(toLegacy)),
      options: el.options,
    };
  }
  if (el.type === 'GroupContainer') {
    return { id: el.id, type: 'GroupContainer', label: el.label, children: el.children.map(toLegacy), options: el.options };
  }
  return { type: 'Label', label: '' };
}

// ---------------------------------------------------------------------------
// toJsonForms: internes Format → JSONForms-uiSchema (für Vorschau + Renderer)
// ---------------------------------------------------------------------------
export function toJsonForms(el: UiElement | FlatElement): object | null {
  const e = el as any;

  if (e.type === 'ColumnContainer' && e.columns) {
    return {
      type: 'HorizontalLayout',
      elements: e.columns.map((col: any[]) => ({
        type: 'VerticalLayout',
        elements: col.map(toJsonForms).filter(Boolean),
      })),
    };
  }
  if (e.type === 'GroupContainer' && e.children) {
    return {
      type: 'Group', label: e.label ?? '',
      elements: e.children.map(toJsonForms).filter(Boolean),
    };
  }
  if (e.type === 'Label') {
    return { type: 'Label', text: e.label ?? '' };
  }
  if (e.type === 'Control' && e.scope) {
    return { type: 'Control', scope: e.scope, options: e.options };
  }
  // Legacy HorizontalLayout (Fallback)
  if (e.type === 'HorizontalLayout' && e.elements) {
    return { type: 'HorizontalLayout', elements: (e.elements ?? []).map(toJsonForms).filter(Boolean) };
  }
  return null;
}

// ---------------------------------------------------------------------------
// exportSchema: uiSchema.elements → sauberes JSONForms-kompatibles uiSchema
// ---------------------------------------------------------------------------
export function exportToJsonForms(elements: FlatElement[]): object {
  return {
    type: 'VerticalLayout',
    elements: elements.map(toJsonForms).filter(Boolean),
  };
}
