import { describe, expect, it } from 'vitest';

import { jsonFormsI18n, uebersetzeValidierungsFehler } from './jsonFormsI18n';

describe('uebersetzeValidierungsFehler — Deutsch', () => {
  it('übersetzt das Pflichtfeld', () => {
    expect(
      uebersetzeValidierungsFehler(
        { keyword: 'required', message: 'is a required property' },
        'de',
      ),
    ).toBe('Bitte füllen Sie dieses Feld aus.');
  });

  it('nennt die Grenze bei Längen und Zahlen', () => {
    expect(
      uebersetzeValidierungsFehler(
        { keyword: 'minLength', params: { limit: 5 } },
        'de',
      ),
    ).toBe('Bitte mindestens 5 Zeichen eingeben.');
    expect(
      uebersetzeValidierungsFehler(
        { keyword: 'maximum', params: { limit: 100 } },
        'de',
      ),
    ).toBe('Der Wert darf höchstens 100 betragen.');
  });

  it('übersetzt die Formate, die der Katalog erzeugt', () => {
    expect(
      uebersetzeValidierungsFehler(
        { keyword: 'format', params: { format: 'email' } },
        'de',
      ),
    ).toBe('Bitte eine gültige E-Mail-Adresse eingeben.');
    expect(
      uebersetzeValidierungsFehler(
        { keyword: 'format', params: { format: 'date' } },
        'de',
      ),
    ).toBe('Bitte ein gültiges Datum eingeben.');
  });

  it('hat für ein unbekanntes Format eine allgemeine Meldung', () => {
    expect(
      uebersetzeValidierungsFehler(
        { keyword: 'format', params: { format: 'ipv6' } },
        'de',
      ),
    ).toBe('Die Eingabe ist ungültig.');
  });

  it('enthält kein Englisch mehr in den abgedeckten Fällen', () => {
    for (const keyword of [
      'required',
      'minLength',
      'maxLength',
      'minimum',
      'maximum',
      'pattern',
      'enum',
      'type',
      'uniqueItems',
    ]) {
      const text = uebersetzeValidierungsFehler(
        { keyword, params: { limit: 1 }, message: 'must be something' },
        'de',
      );
      expect(text, keyword).toBeDefined();
      expect(text, keyword).not.toBe('must be something');
    }
  });
});

describe('uebersetzeValidierungsFehler — Englisch', () => {
  it('liefert die englische Fassung', () => {
    expect(uebersetzeValidierungsFehler({ keyword: 'required' }, 'en')).toBe(
      'Please fill in this field.',
    );
  });
});

describe('uebersetzeValidierungsFehler — Randfälle', () => {
  it('liefert undefined ohne Fehler', () => {
    expect(uebersetzeValidierungsFehler(undefined, 'de')).toBeUndefined();
  });

  it('behält die Originalmeldung bei unbekanntem Schlüsselwort', () => {
    // Eine englische Meldung ist immer noch besser als gar keine.
    expect(
      uebersetzeValidierungsFehler(
        { keyword: 'gibtEsNicht', message: 'original message' },
        'de',
      ),
    ).toBe('original message');
  });

  it('kommt ohne Parameter zurecht', () => {
    expect(
      uebersetzeValidierungsFehler({ keyword: 'minLength' }, 'de'),
    ).toContain('undefined');
  });
});

describe('jsonFormsI18n', () => {
  it('setzt die passende Locale für JSONForms', () => {
    expect(jsonFormsI18n('de').locale).toBe('de-DE');
    expect(jsonFormsI18n('en').locale).toBe('en-GB');
  });

  it('liefert eine Übersetzerfunktion, die nie undefined zurückgibt', () => {
    const { translateError } = jsonFormsI18n('de');
    expect(translateError({ keyword: 'required' })).toBe(
      'Bitte füllen Sie dieses Feld aus.',
    );
    expect(translateError({})).toBe('');
  });
});
