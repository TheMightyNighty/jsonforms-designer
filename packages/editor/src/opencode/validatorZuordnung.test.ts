import { describe, expect, it } from 'vitest';

import { getFieldType } from '../field-types/fieldTypes';
import { MockOpenCodeService } from './mockOpenCodeService';
import {
  filtereValidatoren,
  passtValidatorZuFeldtyp,
  VALIDATOR_FELDTYPEN,
} from './validatorZuordnung';

describe('passtValidatorZuFeldtyp', () => {
  it('bietet die IBAN-Prüfung am IBAN-Feld an', () => {
    expect(passtValidatorZuFeldtyp('oc-val-iban', 'iban')).toBe(true);
  });

  it('bietet die Steuer-ID nicht am Geburtsdatum an', () => {
    expect(passtValidatorZuFeldtyp('oc-val-tax-id', 'date')).toBe(false);
  });

  it('bietet die E-Mail-Prüfung nicht am Ja/Nein-Feld an', () => {
    expect(passtValidatorZuFeldtyp('oc-val-email', 'checkbox')).toBe(false);
  });

  it('bietet die Telefon-Prüfung an Telefon- und Textfeldern an', () => {
    expect(passtValidatorZuFeldtyp('oc-val-phone', 'tel')).toBe(true);
    expect(passtValidatorZuFeldtyp('oc-val-phone', 'text-short')).toBe(true);
    expect(passtValidatorZuFeldtyp('oc-val-phone', 'text-long')).toBe(false);
  });

  it('bietet einen Validator ohne Tabelleneintrag überall an', () => {
    expect(passtValidatorZuFeldtyp('oc-val-unbekannt', 'date')).toBe(true);
  });

  it('filtert nicht, solange der Feldtyp unbekannt ist', () => {
    expect(passtValidatorZuFeldtyp('oc-val-tax-id', undefined)).toBe(true);
  });
});

describe('filtereValidatoren', () => {
  it('lässt am Datumsfeld keinen der typgebundenen Validatoren übrig', async () => {
    const alle = await new MockOpenCodeService().getBausteineByKategorie(
      'validator',
    );
    expect(filtereValidatoren(alle, 'date')).toEqual([]);
  });

  it('lässt am E-Mail-Feld genau die E-Mail-Prüfung übrig', async () => {
    const alle = await new MockOpenCodeService().getBausteineByKategorie(
      'validator',
    );
    expect(filtereValidatoren(alle, 'email').map((v) => v.id)).toEqual([
      'oc-val-email',
    ]);
  });

  it('erhält die Reihenfolge der Ausgangsliste', () => {
    const alle = [{ id: 'a' }, { id: 'oc-val-plz' }, { id: 'b' }];
    expect(filtereValidatoren(alle, 'text-short').map((v) => v.id)).toEqual([
      'a',
      'oc-val-plz',
      'b',
    ]);
  });
});

describe('VALIDATOR_FELDTYPEN', () => {
  it('verweist ausschließlich auf existierende Katalog-Feldtypen', () => {
    for (const feldtypIds of Object.values(VALIDATOR_FELDTYPEN)) {
      for (const id of feldtypIds) {
        expect(() => getFieldType(id)).not.toThrow();
      }
    }
  });

  it('deckt alle Validatoren des Mock-Dienstes ab', async () => {
    const alle = await new MockOpenCodeService().getBausteineByKategorie(
      'validator',
    );
    for (const validator of alle) {
      expect(VALIDATOR_FELDTYPEN).toHaveProperty(validator.id);
    }
  });
});
