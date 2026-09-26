import { describe, expect, it } from 'vitest';

import {
  VORSCHLAG_STICHWOERTER,
  vorschlagFeldtyp,
  vorschlagWeichtAb,
} from './feldtypVorschlag';
import { getFieldType } from './fieldTypes';

/** Kurzform: nur die id des Vorschlags. */
const id = (label: string) => vorschlagFeldtyp(label)?.feldtypId;

describe('vorschlagFeldtyp — Zeitangaben', () => {
  it.each([
    ['Geburtsdatum', 'date'],
    ['Geburtstag', 'date'],
    ['Datum der Antragstellung', 'date'],
    ['Stichtag', 'date'],
    ['Frist zur Rückmeldung', 'date'],
    ['Gültig ab', 'date'],
    ['Uhrzeit des Termins', 'time'],
    ['Zeitpunkt der Abgabe', 'datetime'],
  ])('„%s" → %s', (label, erwartet) => {
    expect(id(label)).toBe(erwartet);
  });

  it('schlägt bei „Geburtsdatum" Datum vor, nicht Datum + Uhrzeit', () => {
    // Spezifischere Regel muss vor der allgemeinen greifen.
    expect(id('Geburtsdatum')).toBe('date');
  });
});

describe('vorschlagFeldtyp — Kontakt', () => {
  it.each([
    ['E-Mail', 'email'],
    ['E-Mail-Adresse', 'email'],
    ['Email der Ansprechperson', 'email'],
    ['Telefon', 'tel'],
    ['Telefonnummer (tagsüber)', 'tel'],
    ['Mobilnummer', 'tel'],
    ['Webseite der Einrichtung', 'url'],
  ])('„%s" → %s', (label, erwartet) => {
    expect(id(label)).toBe(erwartet);
  });
});

describe('vorschlagFeldtyp — Bank, Geld, Adresse', () => {
  it.each([
    ['IBAN', 'iban'],
    ['IBAN des Kontos', 'iban'],
    ['Kontonummer', 'iban'],
    ['Monatliche Miete', 'currency'],
    ['Einkommen brutto', 'currency'],
    ['Betrag in Euro', 'currency'],
    ['Postleitzahl', 'text-short'],
    ['PLZ', 'text-short'],
  ])('„%s" → %s', (label, erwartet) => {
    expect(id(label)).toBe(erwartet);
  });

  it('gibt zur Postleitzahl den passenden Validator mit', () => {
    expect(vorschlagFeldtyp('Postleitzahl')?.validatorId).toBe('oc-val-plz');
  });

  it('gibt ohne zugehörigen Validator keinen mit', () => {
    expect(vorschlagFeldtyp('Geburtsdatum')?.validatorId).toBeUndefined();
  });
});

describe('vorschlagFeldtyp — Zahlen, Ja/Nein, Freitext, Datei', () => {
  it.each([
    ['Anzahl der Kinder', 'integer'],
    ['Alter', 'integer'],
    ['Datenschutzerklärung gelesen', 'checkbox'],
    ['Einwilligung', 'checkbox'],
    ['Begründung des Antrags', 'text-long'],
    ['Bemerkung', 'text-long'],
    ['Erläuterung', 'text-long'],
    ['Nachweis über das Einkommen', 'file-upload'],
    ['Dokument hochladen', 'file-upload'],
  ])('„%s" → %s', (label, erwartet) => {
    expect(id(label)).toBe(erwartet);
  });
});

describe('vorschlagFeldtyp — Schreibweisen', () => {
  it('ist unabhängig von Groß- und Kleinschreibung', () => {
    expect(id('GEBURTSDATUM')).toBe('date');
    expect(id('geburtsdatum')).toBe('date');
  });

  it('behandelt Umlaute und ihre Umschrift gleich', () => {
    expect(id('Begründung')).toBe('text-long');
    expect(id('Begruendung')).toBe('text-long');
    expect(id('Gültig ab')).toBe('date');
    expect(id('Gueltig ab')).toBe('date');
  });

  it('ignoriert Rand-Leerzeichen', () => {
    expect(id('   IBAN   ')).toBe('iban');
  });
});

describe('vorschlagFeldtyp — Negativfälle', () => {
  it('schlägt bei leerer oder sehr kurzer Bezeichnung nichts vor', () => {
    expect(vorschlagFeldtyp('')).toBeUndefined();
    expect(vorschlagFeldtyp('  ')).toBeUndefined();
    expect(vorschlagFeldtyp('Ab')).toBeUndefined();
  });

  it.each([
    'Vorname',
    'Nachname',
    'Familienname',
    'Aktenzeichen',
    'Bezeichnung der Maßnahme',
    'Sonstiges',
  ])('schlägt bei „%s" nichts vor', (label) => {
    expect(vorschlagFeldtyp(label)).toBeUndefined();
  });

  it('trifft mehrdeutige Stichwörter nur als eigenständiges Wort', () => {
    // „alter" steckt in „Verwalter", darf dort aber nicht greifen.
    expect(id('Verwalter')).toBeUndefined();
    expect(id('Alter')).toBe('integer');
    expect(id('Alter der Person')).toBe('integer');
  });

  it('verwechselt „Anzahl" nicht mit einem Textfeld', () => {
    expect(id('Anzahl')).toBe('integer');
  });
});

describe('vorschlagWeichtAb', () => {
  it('meldet nichts, wenn der gewählte Typ schon passt', () => {
    expect(vorschlagWeichtAb('Geburtsdatum', 'date')).toBeUndefined();
  });

  it('meldet den Vorschlag, wenn der gewählte Typ abweicht', () => {
    const vorschlag = vorschlagWeichtAb('Geburtsdatum', 'text-short');
    expect(vorschlag?.feldtypId).toBe('date');
    expect(vorschlag?.ausloeser).toBe('geburtsdatum');
  });

  it('meldet nichts, wenn es zur Bezeichnung keinen Vorschlag gibt', () => {
    expect(vorschlagWeichtAb('Aktenzeichen', 'text-short')).toBeUndefined();
  });

  it('meldet nichts ohne erkennbaren Feldtyp (Fremdimport)', () => {
    expect(vorschlagWeichtAb('Geburtsdatum', undefined)).toBeUndefined();
  });
});

describe('VORSCHLAG_STICHWOERTER', () => {
  it('verweist ausschließlich auf existierende Katalog-Feldtypen', () => {
    for (const regel of VORSCHLAG_STICHWOERTER) {
      expect(() => getFieldType(regel.feldtypId)).not.toThrow();
    }
  });

  it('nennt kein Stichwort doppelt', () => {
    const alle = VORSCHLAG_STICHWOERTER.flatMap((r) => r.stichwoerter);
    expect(new Set(alle).size).toBe(alle.length);
  });

  it('hat zu jeder Regel mindestens ein Stichwort', () => {
    for (const regel of VORSCHLAG_STICHWOERTER) {
      expect(regel.stichwoerter.length).toBeGreaterThan(0);
    }
  });
});
