/**
 * Tests: columnDropReducer, reorderInColumnReducer, moveElementReducer
 */

import { describe, it, expect } from 'vitest';
import { columnDropReducer, reorderInColumnReducer, moveElementReducer } from './columnReducer';
import { createColumnDropAction, createReorderInColumnAction, createMoveElementAction } from './addFieldActions';
import { FieldAwareState } from './addFieldReducer';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function stateWithColumn(): FieldAwareState {
  return {
    schema: { type: 'object', properties: {} },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          id: 'col_001', type: 'ColumnContainer', widths: [1, 1],
          columns: [[], []],
        } as any,
      ],
    },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    sectionColors: {},
  };
}

function stateWithFilledColumn(): FieldAwareState {
  return {
    schema: { type: 'object', properties: { name: { type: 'string', title: 'Name' } } },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          id: 'col_001', type: 'ColumnContainer', widths: [1, 1],
          columns: [
            [{ id: 'ctrl_001', type: 'Control', scope: '#/properties/name' }],
            [],
          ],
        } as any,
      ],
    },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    sectionColors: {},
  };
}

// ---------------------------------------------------------------------------
// columnDropReducer
// ---------------------------------------------------------------------------

describe('columnDropReducer()', () => {
  it('fügt ein Feld in eine leere Spalte ein', () => {
    const state = stateWithColumn();
    const action = createColumnDropAction({
      containerId: 'col_001',
      columnIndex: 0,
      fieldTypeId: 'text-short',
      propertyKey: 'textfeld',
    });
    const next = columnDropReducer(state, action);
    const col = (next.uiSchema.elements[0] as any).columns[0];
    expect(col).toHaveLength(1);
    expect(col[0].type).toBe('Control');
    expect(col[0].scope).toBe('#/properties/textfeld');
  });

  it('ergänzt schema.properties', () => {
    const state = stateWithColumn();
    const action = createColumnDropAction({
      containerId: 'col_001',
      columnIndex: 1,
      fieldTypeId: 'number',
      propertyKey: 'zahl',
    });
    const next = columnDropReducer(state, action);
    expect(next.schema.properties?.['zahl']).toBeDefined();
  });

  it('löst Schlüssel-Konflikte auf', () => {
    const state = stateWithColumn();
    // Erstes Feld einfügen
    let next = columnDropReducer(state, createColumnDropAction({
      containerId: 'col_001', columnIndex: 0, fieldTypeId: 'text-short', propertyKey: 'textfeld',
    }));
    // Zweites Feld mit gleichem Key
    next = columnDropReducer(next, createColumnDropAction({
      containerId: 'col_001', columnIndex: 1, fieldTypeId: 'text-short', propertyKey: 'textfeld',
    }));
    expect(next.schema.properties?.['textfeld']).toBeDefined();
    expect(next.schema.properties?.['textfeld_1']).toBeDefined();
  });

  it('fügt strukturelles Element (Label) ohne schema-Property ein', () => {
    const state = stateWithColumn();
    const action = createColumnDropAction({
      containerId: 'col_001', columnIndex: 0,
      fieldTypeId: 'label-text', propertyKey: '_label',
    });
    const next = columnDropReducer(state, action);
    const col = (next.uiSchema.elements[0] as any).columns[0];
    expect(col[0].type).toBe('Label');
    expect(next.schema.properties).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// reorderInColumnReducer
// ---------------------------------------------------------------------------

describe('reorderInColumnReducer()', () => {
  it('verschiebt Element innerhalb einer Spalte', () => {
    const state: FieldAwareState = {
      schema: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [{
          id: 'col_001', type: 'ColumnContainer', widths: [1, 1],
          columns: [
            [
              { id: 'ctrl_a', type: 'Control', scope: '#/properties/a' },
              { id: 'ctrl_b', type: 'Control', scope: '#/properties/b' },
            ],
            [],
          ],
        } as any],
      },
      tabs: [], activeTabIndex: 0, tabAssignments: {},
      lineNumbersEnabled: false, sectionColors: {},
    };

    const action = createReorderInColumnAction('col_001', 0, 'ctrl_a', 'ctrl_b');
    const next = reorderInColumnReducer(state, action);
    const col = (next.uiSchema.elements[0] as any).columns[0];
    expect(col[0].id).toBe('ctrl_b');
    expect(col[1].id).toBe('ctrl_a');
  });
});

// ---------------------------------------------------------------------------
// moveElementReducer
// ---------------------------------------------------------------------------

describe('moveElementReducer()', () => {
  it('verschiebt Element aus einer Spalte in die root-Liste', () => {
    const state = stateWithFilledColumn();
    const action = createMoveElementAction({ elementId: 'ctrl_001', targetContainerId: 'root' });
    const next = moveElementReducer(state, action);
    // Spalte ist leer
    const col = (next.uiSchema.elements[0] as any).columns[0];
    expect(col).toHaveLength(0);
    // Element ist in root
    const rootElements = next.uiSchema.elements;
    expect(rootElements.some((el: any) => el.id === 'ctrl_001')).toBe(true);
  });
});
