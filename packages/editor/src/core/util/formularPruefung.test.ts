import { describe, expect, it } from 'vitest';

import { FieldAwareState } from '../model/addFieldReducer';
import { emptyManifestMeta } from '../model/manifestMeta';
import { UiElement } from '../model/uiElements';
import {
  Hinweis,
  MAX_LABEL_LAENGE,
  pruefeFormular,
  zaehleHinweise,
} from './formularPruefung';

// ---------------------------------------------------------------------------
// Fixture: ein Formular ohne jeden Befund
// ---------------------------------------------------------------------------

function sauberesFormular(): FieldAwareState {
  return {
    schema: {
      type: 'object',
      title: 'Antrag auf Wohngeld',
      properties: {
        nachname: {
          type: 'string',
          title: 'Nachname',
          description: 'Wie im Ausweis',
        },
      },
      required: ['nachname'],
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        { id: 'c1', type: 'Control', scope: '#/properties/nachname' },
      ] as UiElement[],
    },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    sectionColors: {},
    manifestMeta: { ...emptyManifestMeta, legalBasis: '§ 1 WoGG' },
    typvorschlagIgnoriert: {},
  };
}

const ids = (hinweise: Hinweis[]) => hinweise.map((h) => h.id);
const mitId = (hinweise: Hinweis[], id: string) =>
  hinweise.filter((h) => h.id === id);

describe('pruefeFormular — sauberes Formular', () => {
  it('meldet nichts', () => {
    expect(pruefeFormular(sauberesFormular())).toEqual([]);
  });
});

describe('pruefeFormular — Felder', () => {
  it('meldet ein Feld ohne Bezeichnung als Fehler', () => {
    const state = sauberesFormular();
    state.schema.properties!['nachname'].title = '';
    const treffer = mitId(pruefeFormular(state), 'feld-ohne-label');
    expect(treffer).toHaveLength(1);
    expect(treffer[0].schwere).toBe('fehler');
    expect(treffer[0].feldScope).toBe('#/properties/nachname');
  });

  it('wertet eine Bezeichnung aus Leerzeichen als fehlend', () => {
    const state = sauberesFormular();
    state.schema.properties!['nachname'].title = '   ';
    expect(ids(pruefeFormular(state))).toContain('feld-ohne-label');
  });

  it('meldet ein Pflichtfeld ohne Hilfetext als Hinweis', () => {
    const state = sauberesFormular();
    state.schema.properties!['nachname'].description = '';
    const treffer = mitId(pruefeFormular(state), 'pflichtfeld-ohne-hilfetext');
    expect(treffer).toHaveLength(1);
    expect(treffer[0].schwere).toBe('hinweis');
  });

  it('meldet ein optionales Feld ohne Hilfetext nicht', () => {
    const state = sauberesFormular();
    state.schema.required = [];
    state.schema.properties!['nachname'].description = '';
    expect(ids(pruefeFormular(state))).not.toContain(
      'pflichtfeld-ohne-hilfetext',
    );
  });

  it('meldet eine zu lange Bezeichnung als Hinweis', () => {
    const state = sauberesFormular();
    state.schema.properties!['nachname'].title = 'A'.repeat(
      MAX_LABEL_LAENGE + 1,
    );
    expect(ids(pruefeFormular(state))).toContain('label-zu-lang');
  });

  it('meldet eine Bezeichnung genau an der Schwelle nicht', () => {
    const state = sauberesFormular();
    state.schema.properties!['nachname'].title = 'A'.repeat(MAX_LABEL_LAENGE);
    expect(ids(pruefeFormular(state))).not.toContain('label-zu-lang');
  });
});

describe('pruefeFormular — doppelte Bezeichnungen', () => {
  function zweiGleicheFelder(): FieldAwareState {
    const state = sauberesFormular();
    state.schema.properties!['nachname2'] = {
      type: 'string',
      title: 'Nachname',
      description: 'Zweites Feld',
    };
    state.uiSchema.elements = [
      ...state.uiSchema.elements,
      { id: 'c2', type: 'Control', scope: '#/properties/nachname2' },
    ] as UiElement[];
    return state;
  }

  it('meldet jedes betroffene Feld einzeln, damit der Klick hinführt', () => {
    const treffer = mitId(
      pruefeFormular(zweiGleicheFelder()),
      'doppeltes-label',
    );
    expect(treffer).toHaveLength(2);
    expect(treffer.map((h) => h.feldScope)).toEqual([
      '#/properties/nachname',
      '#/properties/nachname2',
    ]);
  });

  it('erkennt Dopplungen unabhängig von der Groß-/Kleinschreibung', () => {
    const state = zweiGleicheFelder();
    state.schema.properties!['nachname2'].title = 'NACHNAME';
    expect(mitId(pruefeFormular(state), 'doppeltes-label')).toHaveLength(2);
  });

  it('zählt leere Bezeichnungen nicht als Dopplung', () => {
    const state = zweiGleicheFelder();
    state.schema.properties!['nachname'].title = '';
    state.schema.properties!['nachname2'].title = '';
    const befunde = pruefeFormular(state);
    expect(mitId(befunde, 'doppeltes-label')).toHaveLength(0);
    expect(mitId(befunde, 'feld-ohne-label')).toHaveLength(2);
  });
});

describe('pruefeFormular — Bedingungen', () => {
  it('meldet eine Bedingung auf ein gelöschtes Feld als Fehler', () => {
    const state = sauberesFormular();
    state.uiSchema.elements = [
      {
        id: 'c1',
        type: 'Control',
        scope: '#/properties/nachname',
        rule: {
          effect: 'SHOW',
          condition: {
            scope: '#/properties/geloescht',
            schema: { const: 'ja' },
          },
        },
      },
    ] as UiElement[];
    const treffer = mitId(pruefeFormular(state), 'bedingung-ohne-feld');
    expect(treffer).toHaveLength(1);
    expect(treffer[0].schwere).toBe('fehler');
    expect(treffer[0].feldScope).toBe('#/properties/nachname');
  });

  it('meldet eine Bedingung auf ein vorhandenes Feld nicht', () => {
    const state = sauberesFormular();
    state.schema.properties!['land'] = { type: 'string', title: 'Land' };
    state.uiSchema.elements = [
      { id: 'c0', type: 'Control', scope: '#/properties/land' },
      {
        id: 'c1',
        type: 'Control',
        scope: '#/properties/nachname',
        rule: {
          effect: 'SHOW',
          condition: { scope: '#/properties/land', schema: { const: 'DE' } },
        },
      },
    ] as UiElement[];
    expect(ids(pruefeFormular(state))).not.toContain('bedingung-ohne-feld');
  });
});

describe('pruefeFormular — Metadaten', () => {
  it('meldet ein Formular ohne Titel als Fehler', () => {
    const state = sauberesFormular();
    state.schema.title = '';
    expect(ids(pruefeFormular(state))).toContain('formular-ohne-titel');
  });

  it('meldet fehlende Rechtsgrundlage als Fehler', () => {
    const state = sauberesFormular();
    state.manifestMeta = { ...emptyManifestMeta };
    expect(ids(pruefeFormular(state))).toContain(
      'formular-ohne-rechtsgrundlage',
    );
  });
});

describe('pruefeFormular — leeres Formular', () => {
  function ganzLeer(): FieldAwareState {
    const state = sauberesFormular();
    state.schema = { type: 'object', properties: {} };
    state.uiSchema = { type: 'VerticalLayout', elements: [] };
    state.manifestMeta = { ...emptyManifestMeta };
    return state;
  }

  it('mahnt am ganz leeren Formular keine Metadaten an', () => {
    // Ein frisches Formular mit zwei roten Fehlern zu begrüßen, ist
    // entmutigend statt hilfreich.
    expect(pruefeFormular(ganzLeer())).toEqual([]);
  });

  it('mahnt sie an, sobald das Formular ein Feld hat', () => {
    const state = ganzLeer();
    state.schema.properties = { a: { type: 'string', title: 'A' } };
    state.uiSchema.elements = [
      { id: 'c1', type: 'Control', scope: '#/properties/a' },
    ] as UiElement[];
    const befunde = ids(pruefeFormular(state));
    expect(befunde).toContain('formular-ohne-titel');
    expect(befunde).toContain('formular-ohne-rechtsgrundlage');
  });

  it('mahnt sie auch bei einem Formular aus reinen Strukturelementen an', () => {
    const state = ganzLeer();
    state.uiSchema.elements = [
      { id: 'lbl', type: 'Label', label: 'Überschrift', variant: 'text' },
    ] as UiElement[];
    expect(ids(pruefeFormular(state))).toContain('formular-ohne-titel');
  });
});

describe('pruefeFormular — offener Typvorschlag', () => {
  function geburtsdatumAlsText(): FieldAwareState {
    const state = sauberesFormular();
    state.schema.properties!['geburtsdatum'] = {
      type: 'string',
      title: 'Geburtsdatum',
    };
    state.uiSchema.elements = [
      ...state.uiSchema.elements,
      { id: 'c2', type: 'Control', scope: '#/properties/geburtsdatum' },
    ] as UiElement[];
    return state;
  }

  it('meldet einen abweichenden Typvorschlag als Hinweis', () => {
    const treffer = mitId(
      pruefeFormular(geburtsdatumAlsText()),
      'offener-typvorschlag',
    );
    expect(treffer).toHaveLength(1);
    expect(treffer[0].schwere).toBe('hinweis');
    expect(treffer[0].text).toContain('Datum');
  });

  it('schweigt, wenn der Vorschlag für das Feld ignoriert wurde', () => {
    const state = geburtsdatumAlsText();
    state.typvorschlagIgnoriert = { '#/properties/geburtsdatum': true };
    expect(ids(pruefeFormular(state))).not.toContain('offener-typvorschlag');
  });
});

describe('pruefeFormular — Struktur der Ausgabe', () => {
  it('findet auch Felder in Spalten und Gruppen', () => {
    const state = sauberesFormular();
    state.schema.properties!['inSpalte'] = { type: 'string', title: '' };
    state.schema.properties!['inGruppe'] = { type: 'string', title: '' };
    state.uiSchema.elements = [
      {
        id: 'col',
        type: 'ColumnContainer',
        widths: [1, 1],
        columns: [
          [{ id: 'cs', type: 'Control', scope: '#/properties/inSpalte' }],
          [],
        ],
      },
      {
        id: 'grp',
        type: 'GroupContainer',
        label: 'Gruppe',
        children: [
          { id: 'cg', type: 'Control', scope: '#/properties/inGruppe' },
        ],
      },
    ] as UiElement[];
    expect(mitId(pruefeFormular(state), 'feld-ohne-label')).toHaveLength(2);
  });

  it('stellt Fehler vor Hinweise', () => {
    const state = sauberesFormular();
    state.schema.title = ''; // Fehler
    state.schema.properties!['nachname'].description = ''; // Hinweis
    const schweren = pruefeFormular(state).map((h) => h.schwere);
    expect(schweren.indexOf('fehler')).toBeLessThan(
      schweren.indexOf('hinweis'),
    );
  });

  it('ist rein — derselbe Zustand liefert dasselbe Ergebnis', () => {
    const state = sauberesFormular();
    state.schema.title = '';
    expect(pruefeFormular(state)).toEqual(pruefeFormular(state));
  });
});

describe('zaehleHinweise', () => {
  it('zählt getrennt nach Schwere', () => {
    const state = sauberesFormular();
    state.schema.title = '';
    state.schema.properties!['nachname'].description = '';
    expect(zaehleHinweise(pruefeFormular(state))).toEqual({
      fehler: 1,
      hinweise: 1,
    });
  });

  it('zählt eine leere Liste als null', () => {
    expect(zaehleHinweise([])).toEqual({ fehler: 0, hinweise: 0 });
  });
});
