/**
 * OFM-Export: Manifest, Schema-Whitelist, uiSchema-Profil (Token, ofm:width,
 * Plain-Text) und Hash-Berechnung über die serialisierten Dateien.
 */
import { describe, expect, it } from 'vitest';

import { FieldAwareState } from '../model/addFieldReducer';
import { emptyManifestMeta } from '../model/manifestMeta';
import {
  buildOfmSchema,
  buildOfmUiSchema,
  serializeOfmExport,
  widthsToGrid,
} from './ofmExport';

function baseState(): FieldAwareState {
  return {
    schema: {
      type: 'object',
      title: 'Testformular',
      properties: {
        vorname: {
          type: 'string',
          title: 'Vorname',
          minLength: 1,
          'x-fim-id': 'F00000001',
          'x-opencode-validators': ['oc-val-iban'],
        } as never,
        alter: { type: 'integer', minimum: 0 } as never,
      },
      required: ['vorname'],
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        { id: 'ctrl_1', type: 'Control', scope: '#/properties/vorname' },
        { id: 'ctrl_2', type: 'Control', scope: '#/properties/alter' },
      ],
    },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    sectionColors: {},
    manifestMeta: {
      ...emptyManifestMeta,
      id: 'urn:de:test:formular:demo',
      version: '1.0.0',
      publisher: 'Testamt',
    },
  };
}

describe('buildOfmSchema', () => {
  it('erzeugt Root mit additionalProperties:false und behält registrierte x-Schlüssel', () => {
    const schema = buildOfmSchema(baseState()) as Record<string, never>;
    expect(schema['additionalProperties']).toBe(false);
    const vorname = (schema['properties'] as Record<string, never>)[
      'vorname'
    ] as Record<string, unknown>;
    expect(vorname['x-fim-id']).toBe('F00000001');
    expect(vorname['x-opencode-validators']).toBeUndefined();
    expect(schema['required']).toEqual(['vorname']);
  });

  it('strippt HTML aus Titeln und entfernt unzulässige format-Werte', () => {
    const state = baseState();
    state.schema = {
      type: 'object',
      title: '<b>Titel</b>',
      properties: {
        feld: { type: 'string', title: 'A<script>x</script>B', format: 'iban' },
      } as never,
    };
    const schema = buildOfmSchema(state) as Record<string, unknown>;
    expect(schema.title).toBe('Titel');
    const feld = (schema.properties as Record<string, never>)['feld'] as Record<
      string,
      unknown
    >;
    expect(feld.title).toBe('AxB');
    expect(feld.format).toBeUndefined();
  });
});

describe('buildOfmUiSchema', () => {
  it('exportiert Controls ohne Editor-interne Optionen, behält multi', () => {
    const state = baseState();
    state.uiSchema.elements = [
      {
        id: 'ctrl_1',
        type: 'Control',
        scope: '#/properties/vorname',
        options: { multi: true, placeholder: 'Hier tippen' },
      },
    ];
    const ui = buildOfmUiSchema(state) as {
      elements: Array<Record<string, unknown>>;
    };
    expect(ui.elements[0].options).toEqual({ multi: true });
  });

  it('schreibt sectionColor-Token an Gruppen und ofm:width an Spaltenkinder', () => {
    const state = baseState();
    state.sectionColors = { grp_1: 'blue' };
    state.uiSchema.elements = [
      {
        id: 'grp_1',
        type: 'GroupContainer',
        label: 'Antragsteller',
        children: [
          { id: 'ctrl_1', type: 'Control', scope: '#/properties/vorname' },
        ],
      },
      {
        id: 'col_1',
        type: 'ColumnContainer',
        widths: [1, 2],
        columns: [
          [{ id: 'c1', type: 'Control', scope: '#/properties/vorname' }],
          [{ id: 'c2', type: 'Control', scope: '#/properties/alter' }],
        ],
      },
    ];
    const ui = buildOfmUiSchema(state) as {
      elements: Array<Record<string, never>>;
    };
    expect(ui.elements[0]['options']).toEqual({ 'ofm:sectionColor': 'blue' });
    const hl = ui.elements[1] as unknown as {
      type: string;
      elements: Array<Record<string, never>>;
    };
    expect(hl.type).toBe('HorizontalLayout');
    expect(hl.elements[0]['options']).toEqual({ 'ofm:width': 4 });
    expect(hl.elements[1]['options']).toEqual({ 'ofm:width': 8 });
  });

  it('exportiert Labels als reinen Text ohne rule/options', () => {
    const state = baseState();
    state.uiSchema.elements = [
      {
        id: 'lbl_1',
        type: 'Label',
        label: 'Hinweis <img src=x onerror=alert(1)>',
        options: { variant: 'info' },
        rule: { effect: 'HIDE', condition: {} },
      },
    ];
    const ui = buildOfmUiSchema(state) as {
      elements: Array<Record<string, unknown>>;
    };
    expect(ui.elements[0]).toEqual({ type: 'Label', text: 'Hinweis ' });
  });

  it('bildet Tabs als Categorization ab', () => {
    const state = baseState();
    state.tabs = [{ label: 'Schritt 1' }, { label: 'Schritt 2' }];
    state.tabAssignments = {
      '#/properties/vorname': 0,
      '#/properties/alter': 1,
    };
    const ui = buildOfmUiSchema(state) as {
      type: string;
      elements: Array<{ type: string; label: string }>;
    };
    expect(ui.type).toBe('Categorization');
    expect(ui.elements.map((e) => e.type)).toEqual(['Category', 'Category']);
  });
});

describe('widthsToGrid', () => {
  it('verteilt Verhältnisse auf 12 Spalten (Summe 12, min 1)', () => {
    expect(widthsToGrid([1, 1])).toEqual([6, 6]);
    expect(widthsToGrid([1, 2])).toEqual([4, 8]);
    expect(widthsToGrid([1, 1, 1])).toEqual([4, 4, 4]);
    expect(widthsToGrid([1, 2, 1])).toEqual([3, 6, 3]);
    const grid = widthsToGrid([5, 1, 1]);
    expect(grid.reduce((a, b) => a + b, 0)).toBe(12);
    expect(Math.min(...grid)).toBeGreaterThanOrEqual(1);
  });
});

describe('serializeOfmExport', () => {
  it('erzeugt Manifest mit korrekten SHA-256-Hashes der exportierten Dateien', async () => {
    const { files, manifest } = await serializeOfmExport(baseState());
    const names = files.map((f) => f.name);
    expect(names).toEqual([
      'form.manifest.json',
      'schema.json',
      'uischema.json',
    ]);

    const m = manifest as {
      formatVersion: string;
      conformanceClass: string;
      form: Record<string, unknown>;
      artifacts: Record<string, { path: string; sha256: string }>;
    };
    expect(m.formatVersion).toBe('1.0.0');
    expect(m.conformanceClass).toBe('A');
    expect(m.form.id).toBe('urn:de:test:formular:demo');
    expect(m.form.title).toBe('Testformular');
    expect(m.form.language).toBe('de');

    const schemaFile = files.find((f) => f.name === 'schema.json')!;
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(schemaFile.content),
    );
    const hex = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    expect(m.artifacts.schema.sha256).toBe(hex);
  });
});
