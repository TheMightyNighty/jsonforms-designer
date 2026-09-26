import { describe, expect, it } from 'vitest';

import { ADD_FIM_GRUPPE } from '../core/model/addFieldActions';
import {
  FieldAwareState,
  fimGruppeReducer,
} from '../core/model/addFieldReducer';
import { emptyManifestMeta } from '../core/model/manifestMeta';
import {
  BAUSTEIN_KATALOG,
  createBausteinAction,
  getBaustein,
} from './bausteine';

function leererZustand(): FieldAwareState {
  return {
    schema: { type: 'object', properties: {} },
    uiSchema: { type: 'VerticalLayout', elements: [] },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    sectionColors: {},
    manifestMeta: { ...emptyManifestMeta },
  };
}

describe('BAUSTEIN_KATALOG', () => {
  it('enthält die drei Beispiel-Bausteine', () => {
    expect(BAUSTEIN_KATALOG.map((b) => b.name)).toEqual([
      'Antragsteller',
      'Anschrift',
      'Bankverbindung',
    ]);
  });

  it('kennzeichnet alle Bausteine als noch nicht abgestimmt', () => {
    // Fällt auf, sobald ein fachlich abgestimmter Baustein dazukommt oder
    // die Kennzeichnung entfernt wird — dann gehört die Rückfrage im
    // Modulkopf geschlossen.
    expect(BAUSTEIN_KATALOG.every((b) => b.istBeispiel)).toBe(true);
  });

  it('hat je Baustein eindeutige Property-Schlüssel', () => {
    for (const baustein of BAUSTEIN_KATALOG) {
      const keys = baustein.felder.map((f) => f.propertyKey);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('beschriftet jedes Feld und gibt ihm ein Schema', () => {
    for (const baustein of BAUSTEIN_KATALOG) {
      expect(baustein.felder.length).toBeGreaterThan(0);
      for (const feld of baustein.felder) {
        expect(feld.label).toBeTruthy();
        expect(feld.schemaFragment.type).toBeTruthy();
      }
    }
  });
});

describe('getBaustein', () => {
  it('findet einen Baustein über seine id', () => {
    expect(getBaustein('baustein-anschrift').name).toBe('Anschrift');
  });

  it('wirft bei unbekannter id', () => {
    expect(() => getBaustein('gibt-es-nicht')).toThrow(/Unbekannter Baustein/);
  });
});

describe('createBausteinAction', () => {
  it('nutzt dieselbe Action wie FIM-Datenfeldgruppen', () => {
    const action = createBausteinAction(getBaustein('baustein-anschrift'));
    expect(action.type).toBe(ADD_FIM_GRUPPE);
    expect(action.payload.gruppenName).toBe('Anschrift');
    expect(action.payload.felder.map((f) => f.propertyKey)).toEqual([
      'strasse',
      'hausnummer',
      'plz',
      'ort',
    ]);
  });

  it('reicht Einfügeposition und Tab durch', () => {
    const action = createBausteinAction(
      getBaustein('baustein-antragsteller'),
      '#/properties/vorhanden',
      2,
    );
    expect(action.payload.insertAfterScope).toBe('#/properties/vorhanden');
    expect(action.payload.tabIndex).toBe(2);
  });

  it('legt über den Reducer eine benannte Gruppe mit allen Feldern an', () => {
    const baustein = getBaustein('baustein-bankverbindung');
    const next = fimGruppeReducer(
      leererZustand(),
      createBausteinAction(baustein),
    );

    expect(Object.keys(next.schema.properties ?? {})).toEqual([
      'kontoinhaber',
      'iban',
    ]);
    expect(next.schema.properties?.['iban']?.title).toBe('IBAN');
    // Ein Element im UI-Schema — die Gruppe
    expect(next.uiSchema.elements).toHaveLength(1);
  });

  it('löst Schlüsselkonflikte auf, wenn derselbe Baustein zweimal kommt', () => {
    const baustein = getBaustein('baustein-anschrift');
    let zustand = fimGruppeReducer(
      leererZustand(),
      createBausteinAction(baustein),
    );
    zustand = fimGruppeReducer(zustand, createBausteinAction(baustein));

    const keys = Object.keys(zustand.schema.properties ?? {});
    expect(keys).toHaveLength(8);
    expect(new Set(keys).size).toBe(8);
  });
});
