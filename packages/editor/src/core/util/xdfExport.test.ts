/**
 * Tests für den XDatenfelder-2.0-Export: Typ-Mapping, Einschränkungen,
 * Codelisten und — sicherheitsrelevant — das XML-Escaping.
 */
import { describe, expect, it } from 'vitest';

import { FieldAwareState } from '../model/addFieldReducer';
import { exportToXdf } from './xdfExport';

function stateWith(
  properties: Record<string, object>,
  schemaExtras: Record<string, unknown> = {},
): FieldAwareState {
  return {
    schema: { type: 'object', properties, ...schemaExtras },
    uiSchema: { type: 'VerticalLayout', elements: [] },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    sectionColors: {},
  } as FieldAwareState;
}

describe('exportToXdf() — Gruppenkopf', () => {
  it('enthält ID, Version, Titel und Beschreibung', () => {
    const xml = exportToXdf(
      stateWith(
        {},
        {
          title: 'Wohngeldantrag',
          description: 'Antrag auf Wohngeld',
          'x-version': '2.1',
          'x-publisher': 'Bundesagentur',
        },
      ),
      { gruppenId: 'G000000042' },
    );
    expect(xml).toContain('<xdf:id>G000000042</xdf:id>');
    expect(xml).toContain('<xdf:version>2.1</xdf:version>');
    expect(xml).toContain(
      '<xdf:bezeichnungEingabe>Wohngeldantrag</xdf:bezeichnungEingabe>',
    );
    expect(xml).toContain(
      '<xdf:beschreibung>Antrag auf Wohngeld</xdf:beschreibung>',
    );
    expect(xml).toContain(
      '<xdf:herausgebendestelle>Bundesagentur</xdf:herausgebendestelle>',
    );
    expect(xml).toContain('urn:xoev-de:fim:standard:xdatenfelder_2');
  });

  it('fällt auf Defaults zurück (G000000001, Version 1.0, Unbenannt)', () => {
    const xml = exportToXdf(stateWith({}));
    expect(xml).toContain('<xdf:id>G000000001</xdf:id>');
    expect(xml).toContain('<xdf:version>1.0</xdf:version>');
    expect(xml).toContain('Unbenanntes Formular');
  });
});

describe('exportToXdf() — Datentyp-/Feldart-Mapping', () => {
  const cases: Array<[string, object, string, string]> = [
    ['string', { type: 'string' }, 'text', 'input'],
    ['date', { type: 'string', format: 'date' }, 'date', 'input'],
    ['datetime', { type: 'string', format: 'date-time' }, 'datetime', 'input'],
    ['integer', { type: 'integer' }, 'num_int', 'input'],
    ['number', { type: 'number' }, 'num_gk', 'input'],
    ['boolean', { type: 'boolean' }, 'bool', 'input'],
    ['file (uri)', { type: 'string', format: 'uri' }, 'file', 'input'],
    ['enum', { type: 'string', enum: ['A', 'B'] }, 'text', 'select'],
  ];

  cases.forEach(([name, fragment, datentyp, feldart]) => {
    it(`${name} → datentyp=${datentyp}, feldart=${feldart}`, () => {
      const xml = exportToXdf(stateWith({ feld: fragment }));
      expect(xml).toContain(`<xdf:datentyp><code>${datentyp}</code>`);
      expect(xml).toContain(`<xdf:feldart><code>${feldart}</code>`);
    });
  });

  it('enum erzeugt eine Codeliste mit allen Werten', () => {
    const xml = exportToXdf(
      stateWith({ anrede: { type: 'string', enum: ['Frau', 'Herr'] } }),
    );
    expect(xml).toContain('<xdf:codeliste>');
    expect(xml).toContain('<xdf:code>Frau</xdf:code>');
    expect(xml).toContain('<xdf:code>Herr</xdf:code>');
  });
});

describe('exportToXdf() — Einschränkungen und IDs', () => {
  it('übernimmt minLength/maxLength/minimum/maximum/pattern', () => {
    const xml = exportToXdf(
      stateWith({
        plz: {
          type: 'string',
          minLength: 5,
          maxLength: 5,
          pattern: '^[0-9]{5}$',
        },
        alter: { type: 'integer', minimum: 0, maximum: 130 },
      }),
    );
    expect(xml).toContain('<xdf:minLength>5</xdf:minLength>');
    expect(xml).toContain('<xdf:maxLength>5</xdf:maxLength>');
    expect(xml).toContain('<xdf:pattern>^[0-9]{5}$</xdf:pattern>');
    expect(xml).toContain('<xdf:minimum>0</xdf:minimum>');
    expect(xml).toContain('<xdf:maximum>130</xdf:maximum>');
  });

  it('nutzt x-fim-id wenn vorhanden, sonst fortlaufende F-IDs', () => {
    const xml = exportToXdf(
      stateWith({
        a: { type: 'string', 'x-fim-id': 'F60000123' },
        b: { type: 'string' },
      }),
    );
    expect(xml).toContain('<xdf:id>F60000123</xdf:id>');
    expect(xml).toContain('<xdf:id>F000000001</xdf:id>');
  });

  it('übernimmt die Rechtsgrundlage als xdf:bezug', () => {
    const xml = exportToXdf(
      stateWith({ a: { type: 'string' } }, { 'x-legal-basis': '§ 16 SGB II' }),
    );
    expect(xml).toContain('<xdf:bezug>§ 16 SGB II</xdf:bezug>');
  });
});

describe('exportToXdf() — XML-Escaping (Injection-Schutz)', () => {
  it('escapt Sonderzeichen in Titel, Feldnamen und Pattern', () => {
    const xml = exportToXdf(
      stateWith(
        {
          feld: {
            type: 'string',
            title: 'A & B <script>"x"</script>',
            pattern: '<&>',
          },
        },
        { title: `Formular <"&'>` },
      ),
    );
    expect(xml).not.toContain('<script>');
    expect(xml).toContain(
      'A &amp; B &lt;script&gt;&quot;x&quot;&lt;/script&gt;',
    );
    expect(xml).toContain('Formular &lt;&quot;&amp;&apos;&gt;');
    expect(xml).toContain('<xdf:pattern>&lt;&amp;&gt;</xdf:pattern>');
  });

  it('escapt Enum-Werte in der Codeliste', () => {
    const xml = exportToXdf(
      stateWith({ f: { type: 'string', enum: ['<böse>&'] } }),
    );
    expect(xml).toContain('&lt;böse&gt;&amp;');
    expect(xml).not.toContain('<böse>');
  });
});
