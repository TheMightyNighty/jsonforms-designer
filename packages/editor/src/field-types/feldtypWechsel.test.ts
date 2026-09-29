import { describe, expect, it } from 'vitest';

import { FieldAwareState } from '../core/model/addFieldReducer';
import { emptyManifestMeta } from '../core/model/manifestMeta';
import { UiElement } from '../core/model/uiElements';
import { wechselFolgen } from './feldtypWechsel';

const SCOPE = '#/properties/feld';

/** Ein Formular mit einem Textfeld „Feld". */
function mitTextfeld(): FieldAwareState {
  return {
    schema: {
      type: 'object',
      title: 'Antrag',
      properties: { feld: { type: 'string', title: 'Feld' } },
      required: [],
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [{ id: 'c1', type: 'Control', scope: SCOPE }] as UiElement[],
    },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    sectionColors: {},
    manifestMeta: { ...emptyManifestMeta },
    typvorschlagIgnoriert: {},
  };
}

describe('wechselFolgen — verlustfreie Wechsel', () => {
  it('meldet einen Wechsel innerhalb desselben Basistyps als verlustfrei', () => {
    const folgen = wechselFolgen(mitTextfeld(), SCOPE, 'email');
    expect(folgen.istVerlustfrei).toBe(true);
    expect(folgen.basistypWechsel).toBe(false);
  });

  it('meldet den Wechsel auf den bereits gewählten Typ als verlustfrei', () => {
    expect(
      wechselFolgen(mitTextfeld(), SCOPE, 'text-short').istVerlustfrei,
    ).toBe(true);
  });
});

describe('wechselFolgen — Basistypwechsel', () => {
  it('erkennt den Wechsel der Art der Antwort', () => {
    const folgen = wechselFolgen(mitTextfeld(), SCOPE, 'checkbox');
    expect(folgen.basistypWechsel).toBe(true);
    expect(folgen.istVerlustfrei).toBe(false);
  });

  it('erkennt Text → Ganzzahl als Basistypwechsel', () => {
    expect(wechselFolgen(mitTextfeld(), SCOPE, 'integer').basistypWechsel).toBe(
      true,
    );
  });
});

describe('wechselFolgen — Auswahloptionen', () => {
  function mitDropdown(): FieldAwareState {
    const state = mitTextfeld();
    state.schema.properties!['feld'] = {
      type: 'string',
      title: 'Feld',
      enum: ['Ja', 'Nein', 'Vielleicht'],
    };
    return state;
  }

  it('meldet die Optionen, die der neue Typ nicht mehr kennt', () => {
    const folgen = wechselFolgen(mitDropdown(), SCOPE, 'text-short');
    expect(folgen.verlierteOptionen).toEqual(['Ja', 'Nein', 'Vielleicht']);
    expect(folgen.istVerlustfrei).toBe(false);
  });

  it('meldet keine Optionen, wenn der neue Typ ebenfalls welche kennt', () => {
    expect(
      wechselFolgen(mitDropdown(), SCOPE, 'radio').verlierteOptionen,
    ).toEqual([]);
  });

  it('meldet keine Optionen, wenn das Feld keine hat', () => {
    expect(
      wechselFolgen(mitTextfeld(), SCOPE, 'checkbox').verlierteOptionen,
    ).toEqual([]);
  });
});

describe('wechselFolgen — Prüfungen', () => {
  function mitPruefungen(ids: string[]): FieldAwareState {
    const state = mitTextfeld();
    (
      state.schema.properties!['feld'] as { 'x-opencode-validators'?: string[] }
    )['x-opencode-validators'] = ids;
    return state;
  }

  it('meldet Prüfungen, die zum neuen Typ nicht mehr passen', () => {
    const folgen = wechselFolgen(mitPruefungen(['oc-val-plz']), SCOPE, 'date');
    expect(folgen.verlierteePruefungen).toEqual(['plz']);
  });

  it('meldet Prüfungen nicht, die weiterhin passen', () => {
    const folgen = wechselFolgen(mitPruefungen(['oc-val-phone']), SCOPE, 'tel');
    expect(folgen.verlierteePruefungen).toEqual([]);
  });

  it('macht einen Wechsel allein durch eine wegfallende Prüfung verlustbehaftet', () => {
    // text-short → text-long ist derselbe Basistyp, die PLZ-Prüfung passt
    // trotzdem nicht mehr.
    const folgen = wechselFolgen(
      mitPruefungen(['oc-val-plz']),
      SCOPE,
      'text-long',
    );
    expect(folgen.basistypWechsel).toBe(false);
    expect(folgen.istVerlustfrei).toBe(false);
  });
});

describe('wechselFolgen — betroffene Bedingungen', () => {
  function mitBedingungAufFeld(): FieldAwareState {
    const state = mitTextfeld();
    state.schema.properties!['grund'] = { type: 'string', title: 'Begründung' };
    state.uiSchema.elements = [
      ...state.uiSchema.elements,
      {
        id: 'c2',
        type: 'Control',
        scope: '#/properties/grund',
        rule: {
          effect: 'SHOW',
          condition: { scope: SCOPE, schema: { const: 'ja' } },
        },
      },
    ] as UiElement[];
    return state;
  }

  it('nennt die Felder, deren Bedingung auf dieses Feld zeigt', () => {
    const folgen = wechselFolgen(mitBedingungAufFeld(), SCOPE, 'checkbox');
    expect(folgen.betroffeneBedingungen).toEqual(['Begründung']);
  });

  it('nennt sie nicht bei einem Wechsel innerhalb desselben Basistyps', () => {
    // Der Vergleichswert bleibt gültig, die Bedingung trifft weiterhin.
    expect(
      wechselFolgen(mitBedingungAufFeld(), SCOPE, 'email')
        .betroffeneBedingungen,
    ).toEqual([]);
  });

  it('nennt keine Bedingungen, die auf andere Felder zeigen', () => {
    const state = mitBedingungAufFeld();
    state.uiSchema.elements = state.uiSchema.elements.map((el) =>
      el.id === 'c2'
        ? {
            ...el,
            rule: {
              effect: 'SHOW',
              condition: {
                scope: '#/properties/anderes',
                schema: { const: 'x' },
              },
            },
          }
        : el,
    ) as UiElement[];
    expect(
      wechselFolgen(state, SCOPE, 'checkbox').betroffeneBedingungen,
    ).toEqual([]);
  });
});

describe('wechselFolgen — Randfälle', () => {
  it('gilt als verlustfrei, wenn es das Feld nicht gibt', () => {
    expect(
      wechselFolgen(mitTextfeld(), '#/properties/weg', 'checkbox')
        .istVerlustfrei,
    ).toBe(true);
  });

  it('gilt als verlustfrei bei unbekannter Feldtyp-id', () => {
    expect(
      wechselFolgen(mitTextfeld(), SCOPE, 'gibt-es-nicht').istVerlustfrei,
    ).toBe(true);
  });

  it('gilt als verlustfrei bei einem Strukturelement als Ziel', () => {
    expect(
      wechselFolgen(mitTextfeld(), SCOPE, 'label-heading').istVerlustfrei,
    ).toBe(true);
  });

  it('findet auch Felder in Gruppen', () => {
    const state = mitTextfeld();
    state.uiSchema.elements = [
      {
        id: 'grp',
        type: 'GroupContainer',
        label: 'Gruppe',
        children: [{ id: 'c1', type: 'Control', scope: SCOPE }],
      },
    ] as UiElement[];
    expect(wechselFolgen(state, SCOPE, 'checkbox').basistypWechsel).toBe(true);
  });
});
