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
  /** JSONForms-Rule für bedingte Anzeige (SHOW/HIDE/DISABLE). */
  rule?: unknown;
}

export interface ControlElement extends BaseUiElement {
  type: 'Control';
  scope: string;
}

export interface LabelElement extends BaseUiElement {
  type: 'Label';
  label: string;
  variant?: 'heading' | 'text' | 'info' | 'warning';
  /**
   * Legacy-Identität: strukturelle Elemente aus dem Feldtypen-Katalog tragen
   * einen Pseudo-Scope (z. B. '#/properties/_label'), über den Selektion und
   * Tab-Zuordnung historisch laufen. Wird von den Konvertern erhalten.
   */
  scope?: string;
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

/**
 * Loses Grenz-Format („parse, don't validate"): beschreibt, was von außen
 * hereinkommen darf — localStorage-Stände (auch v0.1 ohne ids), Datei-Import,
 * Code-Modus-JSON, Templates, JSONForms-uiSchemas. Alles außer `type` ist
 * optional; `fromLegacy()` normalisiert in die strikte `UiElement`-Union,
 * mit der State und Reducer arbeiten.
 */
export type FlatElement = {
  type: string;
  scope?: string;
  label?: string;
  id?: string;
  options?: Record<string, unknown>;
  rule?: unknown;
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
    return {
      id: el.id ?? newId('ctrl'),
      type: 'Control',
      scope: el.scope ?? '',
      options: el.options,
      rule: el.rule,
    };
  }
  if (el.type === 'Label') {
    const variant = (el.options?.variant ?? 'text') as LabelElement['variant'];
    return {
      id: el.id ?? newId('lbl'),
      type: 'Label',
      label: el.label ?? '',
      variant,
      scope: el.scope,
      options: el.options,
      rule: el.rule,
    };
  }
  if (el.type === 'HorizontalLayout' || el.type === 'ColumnContainer') {
    const widths = (el.options?.widths ?? el.widths ?? [1, 1]) as number[];
    // Wenn .columns bereits vorhanden → direkter Import
    if (el.columns) {
      return {
        id: el.id ?? newId('col'),
        type: 'ColumnContainer',
        widths,
        columns: el.columns.map((col) => col.map(fromLegacy)),
        options: el.options,
        rule: el.rule,
      };
    }
    // Legacy: elements → erste Spalte befüllen
    const cols: UiElement[][] = widths.map(() => []);
    (el.elements ?? []).forEach((child, i) => {
      cols[Math.min(i, cols.length - 1)].push(fromLegacy(child));
    });
    return {
      id: el.id ?? newId('col'),
      type: 'ColumnContainer',
      widths,
      columns: cols,
      rule: el.rule,
    };
  }
  if (el.type === 'Group' || el.type === 'GroupContainer') {
    const children = (el.elements ?? el.children ?? []).map(fromLegacy);
    return {
      id: el.id ?? newId('grp'),
      type: 'GroupContainer',
      label: el.label ?? 'Gruppe',
      children,
      options: el.options,
      rule: el.rule,
    };
  }
  // Fallback
  return {
    id: el.id ?? newId('el'),
    type: 'Label',
    label: el.label ?? el.type,
    variant: 'text',
  };
}

// ---------------------------------------------------------------------------
// toLegacy: internes Format → flaches FlatElement (für JSON-Export / Persistenz)
// ---------------------------------------------------------------------------
export function toLegacy(el: UiElement): FlatElement {
  if (el.type === 'Control') {
    return {
      id: el.id,
      type: 'Control',
      scope: el.scope,
      options: el.options,
      rule: el.rule,
    };
  }
  if (el.type === 'Label') {
    return {
      id: el.id,
      type: 'Label',
      label: el.label,
      scope: el.scope,
      options: { ...el.options, variant: el.variant },
      rule: el.rule,
    };
  }
  if (el.type === 'ColumnContainer') {
    return {
      id: el.id,
      type: 'ColumnContainer',
      widths: el.widths,
      columns: el.columns.map((col) => col.map(toLegacy)),
      options: el.options,
      rule: el.rule,
    };
  }
  if (el.type === 'GroupContainer') {
    return {
      id: el.id,
      type: 'GroupContainer',
      label: el.label,
      children: el.children.map(toLegacy),
      options: el.options,
      rule: el.rule,
    };
  }
  return { type: 'Label', label: '' };
}

// ---------------------------------------------------------------------------
// toJsonForms: internes Format → JSONForms-uiSchema (für Vorschau + Renderer)
// ---------------------------------------------------------------------------
export function toJsonForms(el: UiElement | FlatElement): object | null {
  const rule = el.rule !== undefined ? { rule: el.rule } : {};

  if (el.type === 'ColumnContainer' && el.columns) {
    const columns = el.columns as Array<UiElement[] | FlatElement[]>;
    return {
      type: 'HorizontalLayout',
      elements: columns.map((col) => ({
        type: 'VerticalLayout',
        elements: col.map(toJsonForms).filter(Boolean),
      })),
      ...rule,
    };
  }
  if (el.type === 'GroupContainer' && el.children) {
    return {
      type: 'Group',
      label: el.label ?? '',
      elements: el.children.map(toJsonForms).filter(Boolean),
      ...rule,
    };
  }
  if (el.type === 'Label') {
    return { type: 'Label', text: el.label ?? '', ...rule };
  }
  if (el.type === 'Control' && el.scope) {
    return { type: 'Control', scope: el.scope, options: el.options, ...rule };
  }
  // Legacy HorizontalLayout (Fallback)
  if (el.type === 'HorizontalLayout' && el.elements) {
    return {
      type: 'HorizontalLayout',
      elements: (el.elements ?? []).map(toJsonForms).filter(Boolean),
      ...rule,
    };
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
