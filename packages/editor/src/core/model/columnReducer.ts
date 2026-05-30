
import {
  UiElement,
  ColumnContainer,
  GroupContainer,
  newId,
} from './uiElements';
import { FieldAwareState } from './addFieldReducer';
import { COLUMN_DROP, ColumnDropAction, MOVE_ELEMENT, MoveElementAction, REORDER_IN_COLUMN, ReorderInColumnAction } from './addFieldActions';
import { getFieldType } from '../../field-types/fieldTypes';
import { buildScope } from './addFieldActions';
import { resolveKey } from './addFieldReducer';

// ---------------------------------------------------------------------------
// Hilfsfunktionen: Baum traversieren
// ---------------------------------------------------------------------------

/** Findet ein Element by ID (rekursiv), gibt [element, parent, columnIndex?] zurück */
function findElement(
  elements: UiElement[] | any[],
  id: string,
  parent: { elements: UiElement[]; columnIndex?: number } | null = null
): { el: UiElement; siblings: UiElement[]; colIdx?: number } | null {
  for (const el of elements) {
    if (el.id === id) {
      return { el, siblings: elements, colIdx: parent?.columnIndex };
    }
    if (el.type === 'ColumnContainer') {
      for (let c = 0; c < el.columns.length; c++) {
        const found = findElement(el.columns[c], id, { elements: el.columns[c], columnIndex: c });
        if (found) return found;
      }
    }
    if (el.type === 'GroupContainer') {
      const found = findElement(el.children, id, { elements: el.children });
      if (found) return found;
    }
  }
  return null;
}

/** Entfernt ein Element by ID (rekursiv, in-place auf Kopie) */
function removeById(elements: UiElement[], id: string): UiElement[] {
  const next: UiElement[] = [];
  for (const el of elements) {
    if (el.id === id) continue;
    if (el.type === 'ColumnContainer') {
      next.push({
        ...el,
        columns: el.columns.map((col) => removeById(col, id)),
      });
    } else if (el.type === 'GroupContainer') {
      next.push({ ...el, children: removeById(el.children, id) });
    } else {
      next.push(el);
    }
  }
  return next;
}

/** Fügt ein Element in eine Liste ein (nach insertAfterId oder ans Ende) */
function insertInto(
  elements: UiElement[],
  newEl: UiElement,
  insertAfterId?: string
): UiElement[] {
  if (!insertAfterId) return [...elements, newEl];
  const idx = elements.findIndex((e) => e.id === insertAfterId);
  if (idx === -1) return [...elements, newEl];
  return [...elements.slice(0, idx + 1), newEl, ...elements.slice(idx + 1)];
}

// ---------------------------------------------------------------------------
// COLUMN_DROP Reducer
// ---------------------------------------------------------------------------

export function columnDropReducer<S extends FieldAwareState>(
  state: S,
  action: ColumnDropAction
): S {
  if (action.type !== COLUMN_DROP) return state;

  const { containerId, columnIndex, fieldTypeId, propertyKey, insertAfterId } = action.payload;
  const fieldType = getFieldType(fieldTypeId);

  // Existierende Felder auflösen
  const existingKeys = Object.keys(state.schema.properties ?? {});
  const safeKey = fieldType.isStructural ? propertyKey : resolveKey(propertyKey, existingKeys);
  const safeScope = buildScope(safeKey);

  // Neues UiElement erzeugen
  let newEl: UiElement;
  if (fieldType.isStructural) {
    if (fieldType.uiSchema.type === 'Label') {
      newEl = {
        id: newId('lbl'),
        type: 'Label',
        label: fieldType.defaults.label,
        variant: (fieldType.uiSchema.options?.variant ?? 'text') as any,
        options: fieldType.uiSchema.options,
      };
    } else if (fieldType.uiSchema.type === 'HorizontalLayout') {
      const widths = (fieldType.uiSchema.options?.widths as number[]) ?? [1, 1];
      newEl = {
        id: newId('col'),
        type: 'ColumnContainer',
        widths,
        columns: widths.map(() => []),
      };
    } else {
      newEl = {
        id: newId('grp'),
        type: 'GroupContainer',
        label: fieldType.defaults.label,
        children: [],
      };
    }
  } else {
    newEl = { id: newId('ctrl'), type: 'Control', scope: safeScope, options: fieldType.uiSchema.options };
  }

  // ColumnContainer finden und Spalte aktualisieren
  const nextElements = (state.uiSchema.elements as any[]).map((el: any) => {
    if (el.id !== containerId) return el;
    if (el.type !== 'ColumnContainer') return el;
    const col = el as ColumnContainer;
    const nextColumns = col.columns.map((colItems, ci) =>
      ci === columnIndex ? insertInto(colItems, newEl, insertAfterId) : colItems
    );
    return { ...col, columns: nextColumns };
  });

  // Schema-Property ergänzen (nur bei nicht-strukturell)
  const nextSchema = fieldType.isStructural
    ? state.schema
    : {
        ...state.schema,
        properties: {
          ...(state.schema.properties ?? {}),
          [safeKey]: { ...fieldType.schema, title: fieldType.defaults.label },
        },
      };

  return {
    ...state,
    schema: nextSchema,
    uiSchema: { ...state.uiSchema, elements: nextElements },
  };
}

// ---------------------------------------------------------------------------
// MOVE_ELEMENT Reducer
// ---------------------------------------------------------------------------

export function moveElementReducer<S extends FieldAwareState>(
  state: S,
  action: MoveElementAction
): S {
  if (action.type !== MOVE_ELEMENT) return state;

  const { elementId, targetContainerId, targetColumnIndex = 0, insertAfterId } = action.payload;

  // Element finden
  const found = findElement(state.uiSchema.elements as UiElement[], elementId);
  if (!found) return state;
  const { el: movingEl } = found;

  // Aus bisheriger Position entfernen
  const withoutEl = removeById(state.uiSchema.elements as UiElement[], elementId);

  // In Zielposition einfügen
  let nextElements: UiElement[];

  if (targetContainerId === 'root') {
    nextElements = insertInto(withoutEl, movingEl, insertAfterId);
  } else {
    nextElements = (withoutEl as any[]).map((el: any) => {
      if (el.id !== targetContainerId) return el;
      if (el.type === 'ColumnContainer') {
        const col = el as ColumnContainer;
        return {
          ...col,
          columns: col.columns.map((colItems, ci) =>
            ci === targetColumnIndex ? insertInto(colItems, movingEl, insertAfterId) : colItems
          ),
        };
      }
      if (el.type === 'GroupContainer') {
        const grp = el as GroupContainer;
        return { ...grp, children: insertInto(grp.children, movingEl, insertAfterId) };
      }
      return el;
    });
  }

  return {
    ...state,
    uiSchema: { ...state.uiSchema, elements: nextElements },
  };
}

// ---------------------------------------------------------------------------
// REORDER_IN_COLUMN Reducer
// ---------------------------------------------------------------------------

export function reorderInColumnReducer<S extends FieldAwareState>(
  state: S,
  action: ReorderInColumnAction
): S {
  if (action.type !== REORDER_IN_COLUMN) return state;
  const { containerId, columnIndex, elementId, insertAfterId } = action.payload;

  const nextElements = (state.uiSchema.elements as any[]).map((el: any) => {
    if (el.id !== containerId || el.type !== 'ColumnContainer') return el;
    const col = el as ColumnContainer;
    const nextColumns = col.columns.map((colItems: UiElement[], ci: number) => {
      if (ci !== columnIndex) return colItems;
      // Element aus Spalte entfernen
      const moving = colItems.find((e) => e.id === elementId);
      if (!moving) return colItems;
      const without = colItems.filter((e) => e.id !== elementId);
      return insertInto(without, moving, insertAfterId);
    });
    return { ...col, columns: nextColumns };
  });

  return { ...state, uiSchema: { ...state.uiSchema, elements: nextElements } };
}
