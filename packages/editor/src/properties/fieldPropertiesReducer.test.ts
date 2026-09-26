/**
 * F-4: Tests für fieldPropertiesReducer und fieldPropertiesActions
 */

import { JsonSchema7 } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';

import { FieldAwareState } from '../core/model/addFieldReducer';
import { emptyManifestMeta } from '../core/model/manifestMeta';
import { kompatibleFeldtypen } from '../field-types/feldtypErkennung';
import {
  createChangeFieldTypeAction,
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
    typvorschlagIgnoriert: {},
    sectionColors: {},
    manifestMeta: { ...emptyManifestMeta },
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
      typvorschlagIgnoriert: {},
      sectionColors: {},
      manifestMeta: { ...emptyManifestMeta },
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

// ---------------------------------------------------------------------------
// CHANGE_FIELD_TYPE — Wechsel der Art des Feldes
// ---------------------------------------------------------------------------

describe('fieldPropertiesReducer — CHANGE_FIELD_TYPE', () => {
  const scope = '#/properties/vorname';

  function feldSchema(state: FieldAwareState) {
    return state.schema.properties?.['vorname'] as JsonSchema7 & {
      title?: string;
      description?: string;
    };
  }
  function controlOptionen(state: FieldAwareState) {
    return state.uiSchema.elements[0].options ?? {};
  }

  it('wechselt Text zu E-Mail und behält die Bezeichnung', () => {
    const next = fieldPropertiesReducer(
      stateWithField(),
      createChangeFieldTypeAction(scope, 'email'),
    );
    expect(feldSchema(next).format).toBe('email');
    expect(feldSchema(next).title).toBe('Vorname');
  });

  it('übernimmt die UI-Optionen des neuen Feldtyps', () => {
    const next = fieldPropertiesReducer(
      stateWithField(),
      createChangeFieldTypeAction(scope, 'email'),
    );
    expect(controlOptionen(next).placeholder).toBe('name@behoerde.de');
  });

  it('behält einen selbst gesetzten Platzhalter', () => {
    const start = stateWithField();
    start.uiSchema.elements[0].options = { placeholder: 'Bitte eintragen' };
    const next = fieldPropertiesReducer(
      start,
      createChangeFieldTypeAction(scope, 'email'),
    );
    expect(controlOptionen(next).placeholder).toBe('Bitte eintragen');
  });

  it('behält den Hilfetext', () => {
    const start = stateWithField();
    start.schema.properties!['vorname'].description = 'Bitte ausfüllen';
    const next = fieldPropertiesReducer(
      start,
      createChangeFieldTypeAction(scope, 'tel'),
    );
    expect(feldSchema(next).description).toBe('Bitte ausfüllen');
  });

  it('lässt scope und Property-Schlüssel unberührt', () => {
    const next = fieldPropertiesReducer(
      stateWithField(),
      createChangeFieldTypeAction(scope, 'date'),
    );
    expect(Object.keys(next.schema.properties ?? {})).toEqual(['vorname']);
    const control = next.uiSchema.elements[0];
    expect('scope' in control && control.scope).toBe(scope);
  });

  it('lehnt einen Wechsel über Basistypgrenzen hinweg ab', () => {
    const start = stateWithField();
    // Text → Ja/Nein: unterschiedlicher JSON-Basistyp
    const next = fieldPropertiesReducer(
      start,
      createChangeFieldTypeAction(scope, 'checkbox'),
    );
    expect(next).toBe(start);
  });

  it('lehnt einen Wechsel auf ein Strukturelement ab', () => {
    const start = stateWithField();
    const next = fieldPropertiesReducer(
      start,
      createChangeFieldTypeAction(scope, 'label-heading'),
    );
    expect(next).toBe(start);
  });

  it('lässt den Zustand unverändert, wenn das Feld nicht existiert', () => {
    const start = stateWithField();
    const next = fieldPropertiesReducer(
      start,
      createChangeFieldTypeAction('#/properties/gibtesnicht', 'email'),
    );
    expect(next).toBe(start);
  });

  it('bietet als Alternativen nur Feldtypen mit gleichem Basistyp an', () => {
    const ids = kompatibleFeldtypen('email').map((f) => f.id);
    expect(ids).toContain('text-short');
    expect(ids).toContain('date');
    expect(ids).not.toContain('checkbox');
    expect(ids).not.toContain('integer');
  });
});
