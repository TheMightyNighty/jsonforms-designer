/**
 * F-4: Tests für fieldPropertiesReducer und fieldPropertiesActions
 */

import { describe, expect, it } from 'vitest';

import { FieldAwareState } from '../core/model/addFieldReducer';
import {
  createUpdateFieldPropertyAction,
  propertyKeyFromScope,
} from './fieldPropertiesActions';
import { fieldPropertiesReducer } from './fieldPropertiesReducer';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

function stateWithField(): FieldAwareState {
  return {
    schema: {
      type: 'object',
      properties: {
        vorname: { type: 'string', title: 'Vorname', description: '' },
      },
      required: [],
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          id: 'ctrl_v',
          type: 'Control',
          scope: '#/properties/vorname',
          options: { placeholder: '' },
        },
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
// propertyKeyFromScope
// ---------------------------------------------------------------------------

describe('propertyKeyFromScope()', () => {
  it('extrahiert den Key korrekt', () => {
    expect(propertyKeyFromScope('#/properties/vorname')).toBe('vorname');
    expect(propertyKeyFromScope('#/properties/mein_feld')).toBe('mein_feld');
  });

  it('wirft bei ungültigem scope', () => {
    expect(() => propertyKeyFromScope('properties/vorname')).toThrow();
    expect(() => propertyKeyFromScope('')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// label
// ---------------------------------------------------------------------------

describe('UPDATE_FIELD_PROPERTY label', () => {
  it('setzt schema.properties[key].title', () => {
    const state = stateWithField();
    const action = createUpdateFieldPropertyAction(
      '#/properties/vorname',
      'label',
      'Ihr Vorname',
    );
    const next = fieldPropertiesReducer(state, action);
    expect(next.schema.properties!['vorname'].title).toBe('Ihr Vorname');
  });

  it('lässt andere Felder unberührt', () => {
    const state = stateWithField();
    const action = createUpdateFieldPropertyAction(
      '#/properties/vorname',
      'label',
      'X',
    );
    const next = fieldPropertiesReducer(state, action);
    expect(next.uiSchema).toEqual(state.uiSchema);
  });

  it('ist immutabel', () => {
    const state = stateWithField();
    const action = createUpdateFieldPropertyAction(
      '#/properties/vorname',
      'label',
      'Neu',
    );
    fieldPropertiesReducer(state, action);
    expect(state.schema.properties!['vorname'].title).toBe('Vorname');
  });
});

// ---------------------------------------------------------------------------
// description
// ---------------------------------------------------------------------------

describe('UPDATE_FIELD_PROPERTY description', () => {
  it('setzt schema.properties[key].description', () => {
    const state = stateWithField();
    const action = createUpdateFieldPropertyAction(
      '#/properties/vorname',
      'description',
      'Bitte geben Sie Ihren Vornamen ein.',
    );
    const next = fieldPropertiesReducer(state, action);
    expect(next.schema.properties!['vorname'].description).toBe(
      'Bitte geben Sie Ihren Vornamen ein.',
    );
  });
});

// ---------------------------------------------------------------------------
// placeholder
// ---------------------------------------------------------------------------

describe('UPDATE_FIELD_PROPERTY placeholder', () => {
  it('setzt uiSchema options.placeholder', () => {
    const state = stateWithField();
    const action = createUpdateFieldPropertyAction(
      '#/properties/vorname',
      'placeholder',
      'z. B. Max',
    );
    const next = fieldPropertiesReducer(state, action);
    const control = next.uiSchema.elements.find(
      (el) => 'scope' in el && el.scope === '#/properties/vorname',
    );
    expect(control?.options?.['placeholder']).toBe('z. B. Max');
  });

  it('legt options an wenn noch nicht vorhanden', () => {
    const state: FieldAwareState = {
      schema: {
        type: 'object',
        properties: { x: { type: 'string' } },
      },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [{ id: 'ctrl_x', type: 'Control', scope: '#/properties/x' }],
      },
      tabs: [],
      activeTabIndex: 0,
      tabAssignments: {},
      lineNumbersEnabled: false,
      sectionColors: {},
    };
    const action = createUpdateFieldPropertyAction(
      '#/properties/x',
      'placeholder',
      'Beispiel',
    );
    const next = fieldPropertiesReducer(state, action);
    expect(next.uiSchema.elements[0].options?.['placeholder']).toBe('Beispiel');
  });
});

// ---------------------------------------------------------------------------
// required
// ---------------------------------------------------------------------------

describe('UPDATE_FIELD_PROPERTY required', () => {
  it('fügt Key zu schema.required hinzu', () => {
    const state = stateWithField();
    const action = createUpdateFieldPropertyAction(
      '#/properties/vorname',
      'required',
      true,
    );
    const next = fieldPropertiesReducer(state, action);
    expect(next.schema.required).toContain('vorname');
  });

  it('entfernt Key aus schema.required', () => {
    const state: FieldAwareState = {
      ...stateWithField(),
      schema: {
        ...stateWithField().schema,
        required: ['vorname'],
      },
    };
    const action = createUpdateFieldPropertyAction(
      '#/properties/vorname',
      'required',
      false,
    );
    const next = fieldPropertiesReducer(state, action);
    expect(next.schema.required).not.toContain('vorname');
  });

  it('fügt nicht doppelt hinzu bei wiederholtem true', () => {
    const state: FieldAwareState = {
      ...stateWithField(),
      schema: { ...stateWithField().schema, required: ['vorname'] },
    };
    const action = createUpdateFieldPropertyAction(
      '#/properties/vorname',
      'required',
      true,
    );
    const next = fieldPropertiesReducer(state, action);
    expect(next.schema.required!.filter((k) => k === 'vorname').length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Unbekannter scope — kein Crash
// ---------------------------------------------------------------------------

describe('fieldPropertiesReducer() — Robustheit', () => {
  it('gibt State unverändert zurück wenn scope nicht im Schema', () => {
    const state = stateWithField();
    // propertyKeyFromScope wirft — daher hier direkt einen schlechten scope
    // über den Action-Creator umgehen und die Raw-Action testen
    const rawAction = {
      type: 'UPDATE_FIELD_PROPERTY' as const,
      payload: {
        scope: '#/properties/nichtvorhanden',
        property: 'label' as const,
        value: 'X',
      },
    };
    const next = fieldPropertiesReducer(state, rawAction);
    // kein Crash, Properties unverändert
    expect(next.schema.properties).toEqual(state.schema.properties);
  });
});
