/**
 * F-2: Tests für addFieldReducer und Hilfsfunktionen
 */

import { describe, expect, it } from 'vitest';

import { getFieldType } from '../../field-types/fieldTypes';
import {
  createAddFieldAction,
  createAddTabAction,
  createRemoveFieldAction,
  createRemoveTabAction,
  createRenameTabAction,
  createReorderElementAction,
  createSetActiveTabAction,
} from './addFieldActions';
import {
  addFieldReducer,
  FieldAwareState,
  insertControl,
  removeFieldReducer,
  reorderElementReducer,
  resolveKey,
  tabReducer,
} from './addFieldReducer';
import { UiElement } from './uiElements';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function emptyState(): FieldAwareState {
  return {
    schema: {
      type: 'object',
      properties: {},
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [],
    },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    sectionColors: {},
  };
}

// ---------------------------------------------------------------------------
// resolveKey
// ---------------------------------------------------------------------------

describe('resolveKey()', () => {
  it('gibt den Key unverändert zurück wenn er frei ist', () => {
    expect(resolveKey('vorname', [])).toBe('vorname');
    expect(resolveKey('vorname', ['nachname'])).toBe('vorname');
  });

  it('hängt _1 an bei einfacher Kollision', () => {
    expect(resolveKey('vorname', ['vorname'])).toBe('vorname_1');
  });

  it('zählt weiter hoch bei mehrfacher Kollision', () => {
    expect(resolveKey('feld', ['feld', 'feld_1', 'feld_2'])).toBe('feld_3');
  });
});

// ---------------------------------------------------------------------------
// insertControl
// ---------------------------------------------------------------------------

describe('insertControl()', () => {
  const a: UiElement = { id: 'a', type: 'Control', scope: '#/properties/a' };
  const b: UiElement = { id: 'b', type: 'Control', scope: '#/properties/b' };
  const neu: UiElement = {
    id: 'neu',
    type: 'Control',
    scope: '#/properties/neu',
  };

  it('hängt ans Ende wenn kein insertAfterScope', () => {
    const result = insertControl([a, b], neu);
    expect(result).toEqual([a, b, neu]);
  });

  it('fügt nach dem angegebenen Element ein', () => {
    const result = insertControl([a, b], neu, '#/properties/a');
    expect(result).toEqual([a, neu, b]);
  });

  it('hängt ans Ende wenn insertAfterScope nicht gefunden', () => {
    const result = insertControl([a, b], neu, '#/properties/x');
    expect(result).toEqual([a, b, neu]);
  });

  it('fügt am Ende ein wenn insertAfterScope das letzte Element ist', () => {
    const result = insertControl([a, b], neu, '#/properties/b');
    expect(result).toEqual([a, b, neu]);
  });
});

// ---------------------------------------------------------------------------
// addFieldReducer — Grundverhalten
// ---------------------------------------------------------------------------

describe('addFieldReducer()', () => {
  it('fügt eine Schema-Property ein', () => {
    const state = emptyState();
    const action = createAddFieldAction(getFieldType('text-short'), 'vorname');
    const next = addFieldReducer(state, action);

    expect(next.schema.properties).toHaveProperty('vorname');
    expect(next.schema.properties!['vorname'].type).toBe('string');
  });

  it('setzt title aus defaults.label', () => {
    const state = emptyState();
    const action = createAddFieldAction(getFieldType('text-short'), 'vorname');
    const next = addFieldReducer(state, action);

    expect(next.schema.properties!['vorname'].title).toBe('Textfeld');
  });

  it('fügt ein Control ins UI Schema ein', () => {
    const state = emptyState();
    const action = createAddFieldAction(getFieldType('text-short'), 'vorname');
    const next = addFieldReducer(state, action);

    expect(next.uiSchema.elements).toHaveLength(1);
    const first = next.uiSchema.elements[0];
    expect(first.type === 'Control' && first.scope).toBe(
      '#/properties/vorname',
    );
    expect(next.uiSchema.elements[0].type).toBe('Control');
  });

  it('überträgt uiSchema.options (z.B. multi: true bei text-long)', () => {
    const state = emptyState();
    const action = createAddFieldAction(
      getFieldType('text-long'),
      'beschreibung',
    );
    const next = addFieldReducer(state, action);

    expect(next.uiSchema.elements[0].options).toMatchObject({ multi: true });
  });

  it('überträgt format: "radio" bei radio-Typ', () => {
    const state = emptyState();
    const action = createAddFieldAction(getFieldType('radio'), 'geschlecht');
    const next = addFieldReducer(state, action);

    expect(next.uiSchema.elements[0].options).toMatchObject({
      format: 'radio',
    });
  });

  it('ist immutabel — der Original-State bleibt unverändert', () => {
    const state = emptyState();
    const action = createAddFieldAction(getFieldType('number'), 'alter');
    addFieldReducer(state, action);

    expect(state.schema.properties).toEqual({});
    expect(state.uiSchema.elements).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// addFieldReducer — Kollisionserkennung
// ---------------------------------------------------------------------------

describe('addFieldReducer() — Kollisionserkennung', () => {
  it('benennt den Key um bei Kollision', () => {
    let state = emptyState();
    const action1 = createAddFieldAction(getFieldType('text-short'), 'feld');
    const action2 = createAddFieldAction(getFieldType('text-short'), 'feld');

    state = addFieldReducer(state, action1);
    state = addFieldReducer(state, action2);

    expect(state.schema.properties).toHaveProperty('feld');
    expect(state.schema.properties).toHaveProperty('feld_1');
    expect(state.uiSchema.elements).toHaveLength(2);
  });

  it('zählt korrekt hoch bei mehrfacher Kollision', () => {
    let state = emptyState();
    for (let i = 0; i < 3; i++) {
      const action = createAddFieldAction(getFieldType('text-short'), 'feld');
      state = addFieldReducer(state, action);
    }

    expect(Object.keys(state.schema.properties!)).toEqual([
      'feld',
      'feld_1',
      'feld_2',
    ]);
  });
});

// ---------------------------------------------------------------------------
// addFieldReducer — insertAfterScope
// ---------------------------------------------------------------------------

describe('addFieldReducer() — Einfügeposition', () => {
  it('fügt nach einem vorhandenen Control ein', () => {
    let state = emptyState();
    state = addFieldReducer(
      state,
      createAddFieldAction(getFieldType('text-short'), 'a'),
    );
    state = addFieldReducer(
      state,
      createAddFieldAction(getFieldType('text-short'), 'b'),
    );

    const action = createAddFieldAction(
      getFieldType('text-short'),
      'zwischen',
      '#/properties/a', // insertAfterScope
    );
    state = addFieldReducer(state, action);

    const scopes = state.uiSchema.elements.map((e) =>
      'scope' in e ? e.scope : undefined,
    );
    expect(scopes).toEqual([
      '#/properties/a',
      '#/properties/zwischen',
      '#/properties/b',
    ]);
  });
});

// ---------------------------------------------------------------------------
// addFieldReducer — alle Feldtypen durchlaufen
// ---------------------------------------------------------------------------

describe('addFieldReducer() — alle Katalog-Feldtypen', () => {
  const fieldTypeIds = [
    'text-short',
    'text-long',
    'number',
    'date',
    'checkbox',
    'dropdown',
    'radio',
    'group',
  ];

  fieldTypeIds.forEach((id) => {
    it(`verarbeitet Feldtyp "${id}" ohne Fehler`, () => {
      const fieldType = getFieldType(id);
      const state = emptyState();
      const action = createAddFieldAction(fieldType, id.replace('-', '_'));
      const next = addFieldReducer(state, action);

      // Strukturelle Elemente (z. B. "group") erzeugen keine schema.property,
      // nur ein uiSchema-Element.
      const expectedProperties = fieldType.isStructural ? 0 : 1;
      expect(Object.keys(next.schema.properties!).length).toBe(
        expectedProperties,
      );
      expect(next.uiSchema.elements.length).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// tabReducer Tests
// ---------------------------------------------------------------------------

describe('tabReducer()', () => {
  it('fügt einen Tab hinzu und setzt activeTabIndex', () => {
    const state = emptyState();
    const next = tabReducer(state, createAddTabAction('Seite 1'));
    expect(next.tabs).toHaveLength(1);
    expect(next.tabs[0].label).toBe('Seite 1');
    expect(next.activeTabIndex).toBe(0);
  });

  it('fügt zweiten Tab hinzu und aktivisiert ihn', () => {
    let state = tabReducer(emptyState(), createAddTabAction('A'));
    state = tabReducer(state, createAddTabAction('B'));
    expect(state.tabs).toHaveLength(2);
    expect(state.activeTabIndex).toBe(1);
  });

  it('benennt Tab um', () => {
    let state = tabReducer(emptyState(), createAddTabAction('Alt'));
    state = tabReducer(state, createRenameTabAction(0, 'Neu'));
    expect(state.tabs[0].label).toBe('Neu');
  });

  it('löscht Tab nicht wenn nur noch einer da ist', () => {
    const state = tabReducer(emptyState(), createAddTabAction('Einzig'));
    const next = tabReducer(state, createRemoveTabAction(0));
    expect(next.tabs).toHaveLength(1);
  });

  it('setzt activeTabIndex', () => {
    let state = tabReducer(emptyState(), createAddTabAction('A'));
    state = tabReducer(state, createAddTabAction('B'));
    state = tabReducer(state, createSetActiveTabAction(0));
    expect(state.activeTabIndex).toBe(0);
  });
});

describe('removeFieldReducer()', () => {
  it('entfernt Schema-Property und UI-Element', () => {
    const base = emptyState();
    // Erst ein Feld hinzufügen
    const withField: typeof base = {
      ...base,
      schema: { type: 'object', properties: { name: { type: 'string' } } },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          { id: 'ctrl_name', type: 'Control', scope: '#/properties/name' },
        ],
      },
    };
    const next = removeFieldReducer(
      withField,
      createRemoveFieldAction('#/properties/name'),
    );
    expect(next.schema.properties?.['name']).toBeUndefined();
    expect(next.uiSchema.elements).toHaveLength(0);
  });

  it('entfernt required-Eintrag beim Löschen', () => {
    const base = emptyState();
    const withField: typeof base = {
      ...base,
      schema: {
        type: 'object',
        properties: { email: { type: 'string' } },
        required: ['email'],
      },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          { id: 'ctrl_email', type: 'Control', scope: '#/properties/email' },
        ],
      },
    };
    const next = removeFieldReducer(
      withField,
      createRemoveFieldAction('#/properties/email'),
    );
    expect(next.schema.required).not.toContain('email');
  });
});

// ---------------------------------------------------------------------------
// reorderElementReducer
// ---------------------------------------------------------------------------

describe('insertControl() — Einfügen hinter Containern', () => {
  it('matcht Container über ihre id (nicht nur scope)', () => {
    const container: UiElement = {
      id: 'col_1',
      type: 'ColumnContainer',
      widths: [1, 1],
      columns: [[], []],
    };
    const ctrl: UiElement = {
      id: 'b',
      type: 'Control',
      scope: '#/properties/b',
    };
    const neu: UiElement = {
      id: 'n',
      type: 'Control',
      scope: '#/properties/n',
    };
    const result = insertControl([container, ctrl], neu, 'col_1');
    expect(result.map((e) => e.id)).toEqual(['col_1', 'n', 'b']);
  });
});

describe('reorderElementReducer()', () => {
  function threeFields(): FieldAwareState {
    let state = emptyState();
    for (const key of ['a', 'b', 'c']) {
      state = addFieldReducer(
        state,
        createAddFieldAction(getFieldType('text-short'), key),
      );
    }
    return state;
  }
  const scopes = (s: FieldAwareState) =>
    s.uiSchema.elements.map((e) => ('scope' in e ? e.scope : undefined));

  it('ohne insertAfterKey → an den ANFANG (Bugfix: vorher Ende)', () => {
    const state = threeFields();
    const next = reorderElementReducer(
      state,
      createReorderElementAction('#/properties/c', undefined),
    );
    expect(scopes(next)).toEqual([
      '#/properties/c',
      '#/properties/a',
      '#/properties/b',
    ]);
  });

  it('mit insertAfterKey → direkt dahinter', () => {
    const state = threeFields();
    const next = reorderElementReducer(
      state,
      createReorderElementAction('#/properties/a', '#/properties/b'),
    );
    expect(scopes(next)).toEqual([
      '#/properties/b',
      '#/properties/a',
      '#/properties/c',
    ]);
  });

  it('unbekannter insertAfterKey → ans Ende (Fallback)', () => {
    const state = threeFields();
    const next = reorderElementReducer(
      state,
      createReorderElementAction('#/properties/a', '#/properties/nix'),
    );
    expect(scopes(next)).toEqual([
      '#/properties/b',
      '#/properties/c',
      '#/properties/a',
    ]);
  });

  it('unbekanntes Element → State unverändert', () => {
    const state = threeFields();
    const next = reorderElementReducer(
      state,
      createReorderElementAction('#/properties/nix', undefined),
    );
    expect(next).toBe(state);
  });
});
