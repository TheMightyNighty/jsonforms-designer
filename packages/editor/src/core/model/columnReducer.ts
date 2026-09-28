import { getFieldType } from '../../field-types/fieldTypes';
import {
  buildScope,
  COLUMN_DROP,
  ColumnDropAction,
  MOVE_ELEMENT,
  MoveElementAction,
  REORDER_IN_COLUMN,
  ReorderInColumnAction,
} from './addFieldActions';
import { FieldAwareState, resolveKey } from './addFieldReducer';
import { ColumnContainer, LabelElement, newId, UiElement } from './uiElements';

// ---------------------------------------------------------------------------
// Hilfsfunktionen: Baum traversieren
// ---------------------------------------------------------------------------

/** Prüft rekursiv, ob es einen Container mit dieser id gibt. */
function containerExistiert(
  elements: UiElement[],
  containerId: string,
): boolean {
  for (const el of elements) {
    if (
      el.id === containerId &&
      (el.type === 'ColumnContainer' || el.type === 'GroupContainer')
    ) {
      return true;
    }
    if (el.type === 'ColumnContainer') {
      if (el.columns.some((col) => containerExistiert(col, containerId)))
        return true;
    }
    if (el.type === 'GroupContainer') {
      if (containerExistiert(el.children, containerId)) return true;
    }
  }
  return false;
}

/** Findet ein Element by ID (rekursiv), gibt [element, parent, columnIndex?] zurück */
function findElement(
  elements: UiElement[],
  id: string,
  parent: { elements: UiElement[]; columnIndex?: number } | null = null,
): { el: UiElement; siblings: UiElement[]; colIdx?: number } | null {
  for (const el of elements) {
    if (el.id === id) {
      return { el, siblings: elements, colIdx: parent?.columnIndex };
    }
    if (el.type === 'ColumnContainer') {
      for (let c = 0; c < el.columns.length; c++) {
        const found = findElement(el.columns[c], id, {
          elements: el.columns[c],
          columnIndex: c,
        });
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
  insertAfterId?: string,
): UiElement[] {
  if (!insertAfterId) return [...elements, newEl];
  const idx = elements.findIndex((e) => e.id === insertAfterId);
  if (idx === -1) return [...elements, newEl];
  return [...elements.slice(0, idx + 1), newEl, ...elements.slice(idx + 1)];
}

/**
 * Fügt ein Element in einen Container (ColumnContainer-Spalte oder
 * GroupContainer-Kinderliste) ein — rekursiv, damit Drops auch in
 * verschachtelten Strukturen (Gruppe in Spalte, Spalte in Gruppe) den
 * Ziel-Container finden, egal auf welcher Ebene er liegt.
 */
function insertIntoContainer(
  elements: UiElement[],
  containerId: string,
  columnIndex: number,
  newEl: UiElement,
  insertAfterId?: string,
): UiElement[] {
  return elements.map((el) => {
    if (el.id === containerId) {
      if (el.type === 'ColumnContainer') {
        const nextColumns = el.columns.map((colItems, ci) =>
          ci === columnIndex
            ? insertInto(colItems, newEl, insertAfterId)
            : colItems,
        );
        return { ...el, columns: nextColumns };
      }
      if (el.type === 'GroupContainer') {
        return {
          ...el,
          children: insertInto(el.children, newEl, insertAfterId),
        };
      }
      return el;
    }
    if (el.type === 'ColumnContainer') {
      return {
        ...el,
        columns: el.columns.map((col) =>
          insertIntoContainer(
            col,
            containerId,
            columnIndex,
            newEl,
            insertAfterId,
          ),
        ),
      };
    }
    if (el.type === 'GroupContainer') {
      return {
        ...el,
        children: insertIntoContainer(
          el.children,
          containerId,
          columnIndex,
          newEl,
          insertAfterId,
        ),
      };
    }
    return el;
  });
}

// ---------------------------------------------------------------------------
// COLUMN_DROP Reducer
// ---------------------------------------------------------------------------

export function columnDropReducer<S extends FieldAwareState>(
  state: S,
  action: ColumnDropAction,
): S {
  if (action.type !== COLUMN_DROP) return state;

  const {
    containerId,
    columnIndex,
    fieldTypeId,
    propertyKey,
    label,
    platzhalter,
    insertAfterId,
    fimSchema,
    fimUiOptions,
  } = action.payload;
  const isFim = fieldTypeId.startsWith('fim:');

  // Existierende Felder auflösen
  const existingKeys = Object.keys(state.schema.properties ?? {});

  let newEl: UiElement;
  let nextSchema: FieldAwareState['schema'];

  if (isFim && fimSchema) {
    const safeKey = resolveKey(propertyKey, existingKeys);
    const safeScope = buildScope(safeKey);
    newEl = {
      id: newId('ctrl'),
      type: 'Control',
      scope: safeScope,
      ...(fimUiOptions && Object.keys(fimUiOptions).length > 0
        ? { options: fimUiOptions }
        : {}),
    };
    nextSchema = {
      ...state.schema,
      properties: { ...(state.schema.properties ?? {}), [safeKey]: fimSchema },
    };
  } else {
    const fieldType = getFieldType(fieldTypeId);
    const safeKey = fieldType.isStructural
      ? propertyKey
      : resolveKey(propertyKey, existingKeys);
    const safeScope = buildScope(safeKey);

    // Neues UiElement erzeugen
    if (fieldType.isStructural) {
      if (fieldType.uiSchema.type === 'Label') {
        newEl = {
          id: newId('lbl'),
          type: 'Label',
          label: label,
          variant: (fieldType.uiSchema.options?.variant ??
            'text') as LabelElement['variant'],
          options: fieldType.uiSchema.options,
        };
      } else if (fieldType.uiSchema.type === 'HorizontalLayout') {
        const widths = (fieldType.uiSchema.options?.widths as number[]) ?? [
          1, 1,
        ];
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
          label: label,
          children: [],
        };
      }
    } else {
      newEl = {
        id: newId('ctrl'),
        type: 'Control',
        scope: safeScope,
        options: platzhalter
          ? { ...fieldType.uiSchema.options, placeholder: platzhalter }
          : fieldType.uiSchema.options,
      };
    }

    nextSchema = fieldType.isStructural
      ? state.schema
      : {
          ...state.schema,
          properties: {
            ...(state.schema.properties ?? {}),
            [safeKey]: { ...fieldType.schema, title: label },
          },
        };
  }

  // Ziel-Container (ColumnContainer-Spalte oder GroupContainer) finden und
  // aktualisieren — rekursiv, auch über verschachtelte Strukturen hinweg.
  const nextElements = insertIntoContainer(
    state.uiSchema.elements,
    containerId,
    columnIndex,
    newEl,
    insertAfterId,
  );

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
  action: MoveElementAction,
): S {
  if (action.type !== MOVE_ELEMENT) return state;

  const {
    elementId,
    targetContainerId,
    targetColumnIndex = 0,
    insertAfterId,
  } = action.payload;

  // Element finden
  const found = findElement(state.uiSchema.elements, elementId);
  if (!found) return state;
  const { el: movingEl } = found;

  // Zielcontainer prüfen, BEVOR das Element aus seiner Position genommen
  // wird: Sonst wird es entfernt und nirgends wieder eingefügt — es ginge
  // verloren. Dasselbe gilt für verschachtelte Container, die die frühere,
  // nur einstufige Suche gar nicht erreichte.
  if (
    targetContainerId !== 'root' &&
    !containerExistiert(state.uiSchema.elements, targetContainerId)
  ) {
    return state;
  }

  // Aus aktueller Position entfernen
  const withoutEl = removeById(state.uiSchema.elements, elementId);

  // In Zielposition einfügen — rekursiv, auch über verschachtelte
  // Strukturen hinweg (dieselbe Hilfsfunktion wie beim Ablegen aus der
  // Palette).
  const nextElements =
    targetContainerId === 'root'
      ? insertInto(withoutEl, movingEl, insertAfterId)
      : insertIntoContainer(
          withoutEl,
          targetContainerId,
          targetColumnIndex,
          movingEl,
          insertAfterId,
        );

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
  action: ReorderInColumnAction,
): S {
  if (action.type !== REORDER_IN_COLUMN) return state;
  const { containerId, columnIndex, elementId, insertAfterId } = action.payload;

  const nextElements = state.uiSchema.elements.map((el) => {
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
