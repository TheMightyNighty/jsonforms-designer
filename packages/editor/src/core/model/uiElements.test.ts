/**
 * Tests für die Element-Konverter: Normalisierung loser Eingangsformen,
 * Erhalt von `rule` (bedingte Anzeige) auf allen Pfaden.
 */
import { describe, expect, it } from 'vitest';

import { FlatElement, fromLegacy, toJsonForms, toLegacy } from './uiElements';

const RULE = {
  effect: 'HIDE',
  condition: { scope: '#/properties/x', schema: { const: true } },
};

describe('fromLegacy()', () => {
  it('vergibt fehlende ids und behält vorhandene', () => {
    const ohne = fromLegacy({ type: 'Control', scope: '#/properties/a' });
    expect(ohne.id).toMatch(/^ctrl_/);
    const mit = fromLegacy({
      id: 'meine_id',
      type: 'Control',
      scope: '#/properties/a',
    });
    expect(mit.id).toBe('meine_id');
  });

  it('normalisiert Legacy-Layouts (HorizontalLayout+elements → ColumnContainer)', () => {
    const el = fromLegacy({
      type: 'HorizontalLayout',
      options: { widths: [1, 2] },
      elements: [
        { type: 'Control', scope: '#/properties/a' },
        { type: 'Control', scope: '#/properties/b' },
      ],
    });
    expect(el.type).toBe('ColumnContainer');
    if (el.type === 'ColumnContainer') {
      expect(el.widths).toEqual([1, 2]);
      expect(el.columns[0]).toHaveLength(1);
      expect(el.columns[1]).toHaveLength(1);
    }
  });

  it('behält rule auf allen Element-Typen', () => {
    const flat: FlatElement[] = [
      { type: 'Control', scope: '#/properties/a', rule: RULE },
      { type: 'Label', label: 'Hinweis', rule: RULE },
      { type: 'GroupContainer', label: 'G', children: [], rule: RULE },
      { type: 'ColumnContainer', widths: [1], columns: [[]], rule: RULE },
    ];
    for (const f of flat) {
      expect(fromLegacy(f).rule).toEqual(RULE);
    }
  });

  it('behält den Pseudo-Scope von Labels (Selektion/Tab-Zuordnung)', () => {
    const el = fromLegacy({
      type: 'Label',
      label: 'Überschrift',
      scope: '#/properties/_label',
    });
    expect(el.type === 'Label' && el.scope).toBe('#/properties/_label');
  });
});

describe('toLegacy() Roundtrip', () => {
  it('rule und scope überleben fromLegacy → toLegacy', () => {
    const roundtrip = toLegacy(
      fromLegacy({
        id: 'c1',
        type: 'Control',
        scope: '#/properties/a',
        rule: RULE,
        options: { multi: true },
      }),
    );
    expect(roundtrip).toMatchObject({
      id: 'c1',
      type: 'Control',
      scope: '#/properties/a',
      rule: RULE,
      options: { multi: true },
    });
  });
});

describe('toJsonForms()', () => {
  it('übernimmt rule in die Vorschau (bedingte Anzeige)', () => {
    const control = toJsonForms(
      fromLegacy({ type: 'Control', scope: '#/properties/a', rule: RULE }),
    );
    expect(control).toMatchObject({
      type: 'Control',
      scope: '#/properties/a',
      rule: RULE,
    });

    const group = toJsonForms(
      fromLegacy({
        type: 'GroupContainer',
        label: 'G',
        children: [],
        rule: RULE,
      }),
    );
    expect(group).toMatchObject({ type: 'Group', rule: RULE });
  });

  it('lässt rule weg, wenn keine gesetzt ist', () => {
    const control = toJsonForms(
      fromLegacy({ type: 'Control', scope: '#/properties/a' }),
    ) as Record<string, unknown>;
    expect('rule' in control).toBe(false);
  });
});
