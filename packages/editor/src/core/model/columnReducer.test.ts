/**
 * Tests: columnDropReducer, reorderInColumnReducer, moveElementReducer
 */

import { describe, expect, it } from 'vitest';

import {
  createColumnDropAction,
  createMoveElementAction,
  createReorderInColumnAction,
} from './addFieldActions';
import { FieldAwareState } from './addFieldReducer';
import {
  columnDropReducer,
  moveElementReducer,
  reorderInColumnReducer,
} from './columnReducer';
import { emptyManifestMeta } from './manifestMeta';
import { UiElement } from './uiElements';

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
          id: 'col_001',
          type: 'ColumnContainer',
          widths: [1, 1],
          columns: [[], []],
        } as UiElement,
      ],
    },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    typvorschlagIgnoriert: {},
    sectionColors: {},
    manifestMeta: { ...emptyManifestMeta },
  };
}

function stateWithFilledColumn(): FieldAwareState {
  return {
    schema: {
      type: 'object',
      properties: { name: { type: 'string', title: 'Name' } },
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          id: 'col_001',
          type: 'ColumnContainer',
          widths: [1, 1],
          columns: [
            [{ id: 'ctrl_001', type: 'Control', scope: '#/properties/name' }],
            [],
          ],
        } as UiElement,
      ],
    },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    typvorschlagIgnoriert: {},
    sectionColors: {},
    manifestMeta: { ...emptyManifestMeta },
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
      label: 'Testfeld',
    });
    const next = columnDropReducer(state, action);
    const col = (
      next.uiSchema.elements[0] as Extract<UiElement, { columns: unknown }>
    ).columns[0];
    expect(col).toHaveLength(1);
    expect(col[0].type).toBe('Control');
    expect('scope' in col[0] && col[0].scope).toBe('#/properties/textfeld');
  });

  it('ergänzt schema.properties', () => {
    const state = stateWithColumn();
    const action = createColumnDropAction({
      containerId: 'col_001',
      columnIndex: 1,
      fieldTypeId: 'number',
      propertyKey: 'zahl',
      label: 'Testfeld',
    });
    const next = columnDropReducer(state, action);
    expect(next.schema.properties?.['zahl']).toBeDefined();
  });

  it('löst Schlüssel-Konflikte auf', () => {
    const state = stateWithColumn();
    // Erstes Feld einfügen
    let next = columnDropReducer(
      state,
      createColumnDropAction({
        containerId: 'col_001',
        columnIndex: 0,
        fieldTypeId: 'text-short',
        propertyKey: 'textfeld',
        label: 'Testfeld',
      }),
    );
    // Zweites Feld mit gleichem Key
    next = columnDropReducer(
      next,
      createColumnDropAction({
        containerId: 'col_001',
        columnIndex: 1,
        fieldTypeId: 'text-short',
        propertyKey: 'textfeld',
        label: 'Testfeld',
      }),
    );
    expect(next.schema.properties?.['textfeld']).toBeDefined();
    expect(next.schema.properties?.['textfeld_1']).toBeDefined();
  });

  it('fügt strukturelles Element (Label) ohne schema-Property ein', () => {
    const state = stateWithColumn();
    const action = createColumnDropAction({
      containerId: 'col_001',
      columnIndex: 0,
      fieldTypeId: 'label-text',
      propertyKey: '_label',
      label: 'Testfeld',
    });
    const next = columnDropReducer(state, action);
    const col = (
      next.uiSchema.elements[0] as Extract<UiElement, { columns: unknown }>
    ).columns[0];
    expect(col[0].type).toBe('Label');
    expect(next.schema.properties).toEqual({});
  });

  it('fügt ein Feld in die Kinderliste einer Gruppe ein', () => {
    const state: FieldAwareState = {
      schema: { type: 'object', properties: {} },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          {
            id: 'grp_001',
            type: 'GroupContainer',
            label: 'Gruppe',
            children: [],
          } as UiElement,
        ],
      },
      tabs: [],
      activeTabIndex: 0,
      tabAssignments: {},
      lineNumbersEnabled: false,
      typvorschlagIgnoriert: {},
      sectionColors: {},
      manifestMeta: { ...emptyManifestMeta },
    };
    const action = createColumnDropAction({
      containerId: 'grp_001',
      columnIndex: 0,
      fieldTypeId: 'text-short',
      propertyKey: 'textfeld',
      label: 'Testfeld',
    });
    const next = columnDropReducer(state, action);
    const grp = next.uiSchema.elements[0] as Extract<
      UiElement,
      { children: unknown }
    >;
    expect(grp.children).toHaveLength(1);
    expect(grp.children[0].type).toBe('Control');
    expect('scope' in grp.children[0] && grp.children[0].scope).toBe(
      '#/properties/textfeld',
    );
  });

  it('findet eine Gruppe auch verschachtelt in einer Spalte', () => {
    const state: FieldAwareState = {
      schema: { type: 'object', properties: {} },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          {
            id: 'col_001',
            type: 'ColumnContainer',
            widths: [1, 1],
            columns: [
              [
                {
                  id: 'grp_nested',
                  type: 'GroupContainer',
                  label: 'Verschachtelte Gruppe',
                  children: [],
                },
              ],
              [],
            ],
          } as UiElement,
        ],
      },
      tabs: [],
      activeTabIndex: 0,
      tabAssignments: {},
      lineNumbersEnabled: false,
      typvorschlagIgnoriert: {},
      sectionColors: {},
      manifestMeta: { ...emptyManifestMeta },
    };
    const action = createColumnDropAction({
      containerId: 'grp_nested',
      columnIndex: 0,
      fieldTypeId: 'text-short',
      propertyKey: 'textfeld',
      label: 'Testfeld',
    });
    const next = columnDropReducer(state, action);
    const col = next.uiSchema.elements[0] as Extract<
      UiElement,
      { columns: unknown }
    >;
    const nestedGroup = col.columns[0][0] as Extract<
      UiElement,
      { children: unknown }
    >;
    expect(nestedGroup.children).toHaveLength(1);
    expect(nestedGroup.children[0].type).toBe('Control');
  });
});

// ---------------------------------------------------------------------------
// reorderInColumnReducer
// ---------------------------------------------------------------------------

describe('reorderInColumnReducer()', () => {
  it('verschiebt Element innerhalb einer Spalte', () => {
    const state: FieldAwareState = {
      schema: {
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'string' } },
      },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          {
            id: 'col_001',
            type: 'ColumnContainer',
            widths: [1, 1],
            columns: [
              [
                { id: 'ctrl_a', type: 'Control', scope: '#/properties/a' },
                { id: 'ctrl_b', type: 'Control', scope: '#/properties/b' },
              ],
              [],
            ],
          } as UiElement,
        ],
      },
      tabs: [],
      activeTabIndex: 0,
      tabAssignments: {},
      lineNumbersEnabled: false,
      typvorschlagIgnoriert: {},
      sectionColors: {},
      manifestMeta: { ...emptyManifestMeta },
    };

    const action = createReorderInColumnAction(
      'col_001',
      0,
      'ctrl_a',
      'ctrl_b',
    );
    const next = reorderInColumnReducer(state, action);
    const col = (
      next.uiSchema.elements[0] as Extract<UiElement, { columns: unknown }>
    ).columns[0];
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
    const action = createMoveElementAction({
      elementId: 'ctrl_001',
      targetContainerId: 'root',
    });
    const next = moveElementReducer(state, action);
    // Spalte ist leer
    const col = (
      next.uiSchema.elements[0] as Extract<UiElement, { columns: unknown }>
    ).columns[0];
    expect(col).toHaveLength(0);
    // Element ist in root
    const rootElements = next.uiSchema.elements;
    expect(rootElements.some((el) => el.id === 'ctrl_001')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Weitere Pfade: Container-Ziele, Einfügeposition, Nicht-Treffer
// ---------------------------------------------------------------------------

/** Ein Feld in der root-Liste, eine leere Spalte und eine leere Gruppe. */
function stateMitRootFeld(): FieldAwareState {
  return {
    schema: {
      type: 'object',
      properties: { name: { type: 'string', title: 'Name' } },
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        { id: 'ctrl_001', type: 'Control', scope: '#/properties/name' },
        {
          id: 'col_001',
          type: 'ColumnContainer',
          widths: [1, 1],
          columns: [[], []],
        },
        {
          id: 'grp_001',
          type: 'GroupContainer',
          label: 'Gruppe',
          children: [],
        },
      ] as UiElement[],
    },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    typvorschlagIgnoriert: {},
    sectionColors: {},
    manifestMeta: { ...emptyManifestMeta },
  };
}

describe('columnDropReducer() — weitere Element-Arten', () => {
  it('legt einen Spalten-Container in einer Spalte ab', () => {
    const next = columnDropReducer(
      stateWithColumn(),
      createColumnDropAction({
        containerId: 'col_001',
        columnIndex: 0,
        fieldTypeId: 'col-2',
        propertyKey: '_spalten',
        label: 'Testfeld',
      }),
    );
    const innen = (
      next.uiSchema.elements[0] as Extract<UiElement, { columns: unknown }>
    ).columns[0][0] as Extract<UiElement, { columns: unknown }>;
    expect(innen.type).toBe('ColumnContainer');
    expect(innen.columns).toHaveLength(2);
    expect(next.schema.properties).toEqual({});
  });

  it('legt eine benannte Gruppe in einer Spalte ab', () => {
    const next = columnDropReducer(
      stateWithColumn(),
      createColumnDropAction({
        containerId: 'col_001',
        columnIndex: 1,
        fieldTypeId: 'group',
        propertyKey: '_gruppe',
        label: 'Testfeld',
      }),
    );
    const innen = (
      next.uiSchema.elements[0] as Extract<UiElement, { columns: unknown }>
    ).columns[1][0] as Extract<UiElement, { children: unknown }>;
    expect(innen.type).toBe('GroupContainer');
    expect(innen.children).toEqual([]);
  });

  it('übernimmt Schema und Optionen eines FIM-Datenfeldes', () => {
    const next = columnDropReducer(
      stateWithColumn(),
      createColumnDropAction({
        containerId: 'col_001',
        columnIndex: 0,
        fieldTypeId: 'fim:F60000227',
        propertyKey: 'familienname',
        label: 'Testfeld',
        fimSchema: { type: 'string', title: 'Familienname' },
        fimUiOptions: { 'x-fim-id': 'F60000227' },
      }),
    );
    expect(next.schema.properties?.['familienname']).toMatchObject({
      type: 'string',
      title: 'Familienname',
    });
    const col = (
      next.uiSchema.elements[0] as Extract<UiElement, { columns: unknown }>
    ).columns[0];
    expect(col[0].options).toMatchObject({ 'x-fim-id': 'F60000227' });
  });

  it('lässt den Zustand unverändert, wenn der Container nicht existiert', () => {
    const state = stateWithColumn();
    const next = columnDropReducer(
      state,
      createColumnDropAction({
        containerId: 'col_gibt_es_nicht',
        columnIndex: 0,
        fieldTypeId: 'text-short',
        propertyKey: 'textfeld',
        label: 'Testfeld',
      }),
    );
    expect(next.uiSchema.elements).toEqual(state.uiSchema.elements);
  });
});

describe('moveElementReducer() — Ziel-Container', () => {
  it('verschiebt ein Feld aus der root-Liste in eine Spalte', () => {
    const next = moveElementReducer(
      stateMitRootFeld(),
      createMoveElementAction({
        elementId: 'ctrl_001',
        targetContainerId: 'col_001',
        targetColumnIndex: 1,
      }),
    );
    const container = next.uiSchema.elements.find(
      (el) => el.id === 'col_001',
    ) as Extract<UiElement, { columns: unknown }>;
    expect(container.columns[0]).toHaveLength(0);
    expect(container.columns[1].map((el) => el.id)).toEqual(['ctrl_001']);
    expect(next.uiSchema.elements.some((el) => el.id === 'ctrl_001')).toBe(
      false,
    );
  });

  it('verschiebt ein Feld aus der root-Liste in eine Gruppe', () => {
    const next = moveElementReducer(
      stateMitRootFeld(),
      createMoveElementAction({
        elementId: 'ctrl_001',
        targetContainerId: 'grp_001',
      }),
    );
    const gruppe = next.uiSchema.elements.find(
      (el) => el.id === 'grp_001',
    ) as Extract<UiElement, { children: unknown }>;
    expect(gruppe.children.map((el) => el.id)).toEqual(['ctrl_001']);
  });

  it('setzt ein Element hinter das angegebene Geschwisterelement', () => {
    const state = stateMitRootFeld();
    const mitZweitemFeld: FieldAwareState = {
      ...state,
      uiSchema: {
        ...state.uiSchema,
        elements: [
          ...state.uiSchema.elements,
          { id: 'ctrl_002', type: 'Control', scope: '#/properties/zweit' },
        ] as UiElement[],
      },
    };
    const next = moveElementReducer(
      mitZweitemFeld,
      createMoveElementAction({
        elementId: 'ctrl_001',
        targetContainerId: 'root',
        insertAfterId: 'grp_001',
      }),
    );
    expect(next.uiSchema.elements.map((el) => el.id)).toEqual([
      'col_001',
      'grp_001',
      'ctrl_001',
      'ctrl_002',
    ]);
  });

  it('lässt den Zustand unverändert, wenn das Element nicht existiert', () => {
    const state = stateMitRootFeld();
    const next = moveElementReducer(
      state,
      createMoveElementAction({
        elementId: 'gibt_es_nicht',
        targetContainerId: 'root',
      }),
    );
    expect(next).toBe(state);
  });

  it('lässt den Zustand unverändert, wenn der Ziel-Container nicht existiert', () => {
    // Früher wurde das Element hier aus seiner Position entfernt und
    // nirgends wieder eingefügt — es ging verloren.
    const state = stateMitRootFeld();
    const next = moveElementReducer(
      state,
      createMoveElementAction({
        elementId: 'ctrl_001',
        targetContainerId: 'gibt_es_nicht',
      }),
    );
    expect(next).toBe(state);
  });

  it('lässt den Zustand unverändert, wenn das Ziel kein Container ist', () => {
    const state = stateMitRootFeld();
    const next = moveElementReducer(
      state,
      createMoveElementAction({
        elementId: 'ctrl_001',
        // ctrl_001 selbst ist ein Control, kein Container
        targetContainerId: 'ctrl_001',
      }),
    );
    expect(next).toBe(state);
  });

  it('verschiebt in eine Gruppe, die in einer Spalte liegt', () => {
    const state: FieldAwareState = {
      ...stateMitRootFeld(),
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          { id: 'ctrl_001', type: 'Control', scope: '#/properties/name' },
          {
            id: 'col_001',
            type: 'ColumnContainer',
            widths: [1, 1],
            columns: [
              [
                {
                  id: 'grp_tief',
                  type: 'GroupContainer',
                  label: 'Tiefe Gruppe',
                  children: [],
                },
              ],
              [],
            ],
          },
        ] as UiElement[],
      },
    };

    const next = moveElementReducer(
      state,
      createMoveElementAction({
        elementId: 'ctrl_001',
        targetContainerId: 'grp_tief',
      }),
    );

    const spalte = (
      next.uiSchema.elements.find((el) => el.id === 'col_001') as Extract<
        UiElement,
        { columns: unknown }
      >
    ).columns[0];
    const gruppe = spalte[0] as Extract<UiElement, { children: unknown }>;
    expect(gruppe.children.map((el) => el.id)).toEqual(['ctrl_001']);
    // Und nicht doppelt in der root-Liste
    expect(next.uiSchema.elements.some((el) => el.id === 'ctrl_001')).toBe(
      false,
    );
  });
});

describe('reorderInColumnReducer() — Randfälle', () => {
  it('lässt den Zustand unverändert, wenn der Container nicht existiert', () => {
    const state = stateWithFilledColumn();
    const next = reorderInColumnReducer(
      state,
      createReorderInColumnAction('gibt_es_nicht', 0, 'ctrl_001'),
    );
    expect(next.uiSchema.elements).toEqual(state.uiSchema.elements);
  });

  it('lässt den Zustand unverändert, wenn das Element nicht in der Spalte liegt', () => {
    const state = stateWithFilledColumn();
    const next = reorderInColumnReducer(
      state,
      createReorderInColumnAction('col_001', 1, 'ctrl_001'),
    );
    const col = (
      next.uiSchema.elements[0] as Extract<UiElement, { columns: unknown }>
    ).columns;
    expect(col[0].map((el) => el.id)).toEqual(['ctrl_001']);
    expect(col[1]).toHaveLength(0);
  });
});
