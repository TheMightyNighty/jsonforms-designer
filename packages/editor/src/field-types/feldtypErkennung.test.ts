import { describe, expect, it } from 'vitest';

import { ermittleFeldtyp, FeldSchema } from './feldtypErkennung';
import { FIELD_TYPE_CATALOG, FieldTypeDefinition } from './fieldTypes';

/**
 * Wichtigster Test: Jeder Feldtyp, den die Palette anbietet, muss nach dem
 * Anlegen auch wieder als genau dieser Feldtyp erkannt werden. Der Test läuft
 * über den Katalog, damit ein neuer Feldtyp ohne Erkennungsregel sofort
 * auffällt.
 */
describe('ermittleFeldtyp — Rundlauf über den Katalog', () => {
  const eingabefelder = FIELD_TYPE_CATALOG.filter((f) => !f.isStructural);

  it.each(eingabefelder.map((f): [string, FieldTypeDefinition] => [f.id, f]))(
    'erkennt „%s" aus Schema und UI-Optionen zurück',
    (_id, definition) => {
      const erkannt = ermittleFeldtyp(
        definition.schema as FeldSchema,
        definition.uiSchema.options,
      );
      expect(erkannt?.id).toBe(definition.id);
    },
  );
});

describe('ermittleFeldtyp — Abgrenzung der ähnlichen Typen', () => {
  it('unterscheidet Datei-Upload von Website-URL (beide format: uri)', () => {
    const schema: FeldSchema = { type: 'string', format: 'uri' };
    expect(ermittleFeldtyp(schema, { accept: '.pdf' })?.id).toBe('file-upload');
    expect(ermittleFeldtyp(schema, { placeholder: 'https://' })?.id).toBe(
      'url',
    );
  });

  it('erkennt ein Datumsfeld als Datum, nicht als Text', () => {
    expect(ermittleFeldtyp({ type: 'string', format: 'date' })?.id).toBe(
      'date',
    );
  });

  it('unterscheidet Datum und Datum + Uhrzeit', () => {
    expect(ermittleFeldtyp({ type: 'string', format: 'date-time' })?.id).toBe(
      'datetime',
    );
  });

  it('unterscheidet Radio-Gruppe und Dropdown an der UI-Option', () => {
    const schema: FeldSchema = { type: 'string', enum: ['a', 'b'] };
    expect(ermittleFeldtyp(schema, { format: 'radio' })?.id).toBe('radio');
    expect(ermittleFeldtyp(schema)?.id).toBe('dropdown');
  });

  it('unterscheidet Mehrfachauswahl und Wiederholungsgruppe am items-Schema', () => {
    expect(
      ermittleFeldtyp({
        type: 'array',
        items: { type: 'string', enum: ['a'] },
      } as FeldSchema)?.id,
    ).toBe('checkbox-group');
    expect(
      ermittleFeldtyp({
        type: 'array',
        items: { type: 'object', properties: {} },
      } as FeldSchema)?.id,
    ).toBe('repeat-group');
  });

  it('erkennt einen Betrag vor der allgemeinen Dezimalzahl', () => {
    expect(
      ermittleFeldtyp({ type: 'number', 'x-format': 'currency' })?.id,
    ).toBe('currency');
    expect(ermittleFeldtyp({ type: 'number' })?.id).toBe('number');
  });

  it('erkennt einen Schieberegler nur mit slider-Option', () => {
    expect(ermittleFeldtyp({ type: 'integer' }, { slider: true })?.id).toBe(
      'slider',
    );
    expect(ermittleFeldtyp({ type: 'integer' })?.id).toBe('integer');
  });

  it('unterscheidet ein- und mehrzeiliges Textfeld an der multi-Option', () => {
    expect(ermittleFeldtyp({ type: 'string' }, { multi: true })?.id).toBe(
      'text-long',
    );
    expect(ermittleFeldtyp({ type: 'string' })?.id).toBe('text-short');
  });

  it('erkennt Passwort vor dem allgemeinen Textfeld', () => {
    expect(
      ermittleFeldtyp({ type: 'string', minLength: 8 }, { format: 'password' })
        ?.id,
    ).toBe('password');
  });
});

describe('ermittleFeldtyp — Negativfälle', () => {
  it('liefert undefined ohne Schema', () => {
    expect(ermittleFeldtyp(undefined)).toBeUndefined();
  });

  it('liefert undefined für ein Objekt-Schema aus einem Fremdimport', () => {
    expect(
      ermittleFeldtyp({ type: 'object', properties: {} } as FeldSchema),
    ).toBeUndefined();
  });

  it('liefert undefined für ein Schema ohne Typangabe', () => {
    expect(ermittleFeldtyp({} as FeldSchema)).toBeUndefined();
  });

  it('verwechselt ein fremdes Muster nicht mit IBAN oder Telefonnummer', () => {
    const erkannt = ermittleFeldtyp({ type: 'string', pattern: '^[0-9]{5}$' });
    expect(erkannt?.id).toBe('text-short');
  });
});
