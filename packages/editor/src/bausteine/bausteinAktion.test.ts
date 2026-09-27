import { describe, expect, it } from 'vitest';

import { ADD_FIM_GRUPPE } from '../core/model/addFieldActions';
import {
  FieldAwareState,
  fimGruppeReducer,
} from '../core/model/addFieldReducer';
import { emptyManifestMeta } from '../core/model/manifestMeta';
import { createBausteinAction } from './bausteinAktion';
import { Baustein } from './bausteinService';
import { BEISPIEL_BAUSTEINE, MockBausteinService } from './mockBausteinService';

function leererZustand(): FieldAwareState {
  return {
    schema: { type: 'object', properties: {} },
    uiSchema: { type: 'VerticalLayout', elements: [] },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    typvorschlagIgnoriert: {},
    sectionColors: {},
    manifestMeta: { ...emptyManifestMeta },
  };
}

const beispiel = (id: string): Baustein => {
  const gefunden = BEISPIEL_BAUSTEINE.find((b) => b.id === id);
  if (!gefunden) throw new Error(`Testfixture fehlt: ${id}`);
  return gefunden;
};

describe('MockBausteinService', () => {
  it('liefert die drei Beispiel-Bausteine', async () => {
    const katalog = await new MockBausteinService().getBausteine();
    expect(katalog.map((b) => b.name)).toEqual([
      'Antragsteller',
      'Anschrift',
      'Bankverbindung',
    ]);
  });

  it('kennzeichnet alle als noch nicht abgestimmt', () => {
    // Fällt auf, sobald ein fachlich abgestimmter Baustein dazukommt — dann
    // gehört die Rückfrage im Modulkopf geschlossen.
    expect(BEISPIEL_BAUSTEINE.every((b) => b.istBeispiel)).toBe(true);
  });

  it('hat je Baustein eindeutige Property-Schlüssel und beschriftete Felder', () => {
    for (const baustein of BEISPIEL_BAUSTEINE) {
      const keys = baustein.felder.map((f) => f.propertyKey);
      expect(new Set(keys).size).toBe(keys.length);
      expect(baustein.felder.length).toBeGreaterThan(0);
      for (const feld of baustein.felder) {
        expect(feld.label).toBeTruthy();
        expect(feld.schemaFragment.type).toBeTruthy();
      }
    }
  });

  it('vergibt eindeutige ids', () => {
    const ids = BEISPIEL_BAUSTEINE.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('createBausteinAction', () => {
  it('nutzt dieselbe Action wie FIM-Datenfeldgruppen', () => {
    const action = createBausteinAction(beispiel('baustein-anschrift'));
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
      beispiel('baustein-antragsteller'),
      '#/properties/vorhanden',
      2,
    );
    expect(action.payload.insertAfterScope).toBe('#/properties/vorhanden');
    expect(action.payload.tabIndex).toBe(2);
  });

  it('funktioniert mit einem Baustein aus einem fremden Katalog', () => {
    // Der Einfügepfad kennt keinen festen Katalog mehr — er nimmt den
    // Baustein entgegen, egal woher er stammt.
    const fremd: Baustein = {
      id: 'x-eigener',
      name: 'Eigener Baustein',
      beschreibung: '',
      icon: 'components',
      istBeispiel: false,
      felder: [
        {
          propertyKey: 'aktenzeichen',
          label: 'Aktenzeichen',
          schemaFragment: { type: 'string', title: 'Aktenzeichen' },
        },
      ],
    };
    const next = fimGruppeReducer(leererZustand(), createBausteinAction(fremd));
    expect(Object.keys(next.schema.properties ?? {})).toEqual(['aktenzeichen']);
    expect(next.uiSchema.elements).toHaveLength(1);
  });

  it('legt über den Reducer eine benannte Gruppe mit allen Feldern an', () => {
    const next = fimGruppeReducer(
      leererZustand(),
      createBausteinAction(beispiel('baustein-bankverbindung')),
    );
    expect(Object.keys(next.schema.properties ?? {})).toEqual([
      'kontoinhaber',
      'iban',
    ]);
    expect(next.schema.properties?.['iban']?.title).toBe('IBAN');
    expect(next.uiSchema.elements).toHaveLength(1);
  });

  it('löst Schlüsselkonflikte auf, wenn derselbe Baustein zweimal kommt', () => {
    const baustein = beispiel('baustein-anschrift');
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
