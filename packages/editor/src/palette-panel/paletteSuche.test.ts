import { describe, expect, it } from 'vitest';

import { BEISPIEL_BAUSTEINE } from '../bausteine';
import { FIELD_TYPE_CATALOG } from '../field-types/fieldTypes';
import { HAEUFIGE_FELDTYP_IDS } from './haeufigeFeldtypen';
import {
  istSuchaktiv,
  normalisiereSuchtext,
  SUCHE_MIN_LAENGE,
  sucheBausteine,
  sucheFeldtypen,
} from './paletteSuche';

describe('normalisiereSuchtext', () => {
  it('vereinheitlicht Groß-/Kleinschreibung, Umlaute und Randleerzeichen', () => {
    expect(normalisiereSuchtext('  Straße ')).toBe('strasse');
    expect(normalisiereSuchtext('ÄÖÜ')).toBe('aeoeue');
  });
});

describe('istSuchaktiv', () => {
  it('springt erst ab der Mindestlänge an', () => {
    expect(istSuchaktiv('')).toBe(false);
    expect(istSuchaktiv('a')).toBe(false);
    expect(istSuchaktiv('  a  ')).toBe(false);
    expect(istSuchaktiv('a'.repeat(SUCHE_MIN_LAENGE))).toBe(true);
  });
});

describe('sucheFeldtypen', () => {
  it('findet einen Feldtyp über einen Namensteil', () => {
    expect(
      sucheFeldtypen(FIELD_TYPE_CATALOG, 'datum').map((f) => f.id),
    ).toEqual(['date', 'datetime']);
  });

  it('ignoriert Groß-/Kleinschreibung', () => {
    expect(sucheFeldtypen(FIELD_TYPE_CATALOG, 'IBAN').map((f) => f.id)).toEqual(
      ['iban'],
    );
  });

  it('liefert ohne aktive Suche nichts', () => {
    expect(sucheFeldtypen(FIELD_TYPE_CATALOG, 'i')).toEqual([]);
  });

  it('liefert bei fehlendem Treffer eine leere Liste', () => {
    expect(sucheFeldtypen(FIELD_TYPE_CATALOG, 'zzzzz')).toEqual([]);
  });
});

describe('sucheBausteine', () => {
  it('findet einen Baustein über seinen Namen', () => {
    expect(
      sucheBausteine(BEISPIEL_BAUSTEINE, 'anschrift').map((b) => b.id),
    ).toEqual(['baustein-anschrift']);
  });

  it('findet einen Baustein über ein enthaltenes Feld', () => {
    expect(sucheBausteine(BEISPIEL_BAUSTEINE, 'iban').map((b) => b.id)).toEqual(
      ['baustein-bankverbindung'],
    );
  });

  it('findet einen Baustein über die Beschreibung', () => {
    expect(
      sucheBausteine(BEISPIEL_BAUSTEINE, 'geburtsdatum').map((b) => b.id),
    ).toEqual(['baustein-antragsteller']);
  });

  it('findet „Straße" auch bei der Eingabe „strasse"', () => {
    expect(
      sucheBausteine(BEISPIEL_BAUSTEINE, 'strasse').map((b) => b.id),
    ).toEqual(['baustein-anschrift']);
  });

  it('liefert ohne aktive Suche nichts', () => {
    expect(sucheBausteine(BEISPIEL_BAUSTEINE, 'a')).toEqual([]);
  });
});

describe('HAEUFIGE_FELDTYP_IDS', () => {
  it('nennt acht Feldtypen', () => {
    expect(HAEUFIGE_FELDTYP_IDS).toHaveLength(8);
  });

  it('verweist ausschließlich auf existierende, nicht strukturelle Feldtypen', () => {
    for (const id of HAEUFIGE_FELDTYP_IDS) {
      const gefunden = FIELD_TYPE_CATALOG.find((ft) => ft.id === id);
      expect(gefunden, `Feldtyp "${id}" fehlt im Katalog`).toBeDefined();
      expect(gefunden?.isStructural).toBeFalsy();
    }
  });

  it('nennt keinen Feldtyp doppelt', () => {
    expect(new Set(HAEUFIGE_FELDTYP_IDS).size).toBe(
      HAEUFIGE_FELDTYP_IDS.length,
    );
  });
});
