import { describe, expect, it } from 'vitest';

import { flexBasisFor, ofmWidthOf } from './layoutWidth';

describe('flexBasisFor', () => {
  it('rechnet eine Rasterbreite auf Prozent um', () => {
    expect(flexBasisFor(6, 2)).toBe('50%');
    expect(flexBasisFor(12, 3)).toBe('100%');
    expect(flexBasisFor(1, 4)).toBe(`${(1 / 12) * 100}%`);
  });

  it('verteilt ohne Breitenangabe gleichmäßig', () => {
    expect(flexBasisFor(undefined, 2)).toBe('50%');
    expect(flexBasisFor(undefined, 4)).toBe('25%');
  });

  it('ignoriert Werte außerhalb des 12er-Rasters', () => {
    expect(flexBasisFor(0, 2)).toBe('50%');
    expect(flexBasisFor(13, 2)).toBe('50%');
    expect(flexBasisFor('6', 2)).toBe('50%');
  });

  it('nimmt volle Breite, wenn es kein Geschwisterelement gibt', () => {
    expect(flexBasisFor(undefined, 0)).toBe('100%');
  });
});

describe('ofmWidthOf', () => {
  it('liest die Breitenangabe aus den Optionen', () => {
    expect(ofmWidthOf({ 'ofm:width': 4 })).toBe(4);
  });

  it('liefert undefined ohne Optionen oder ohne Angabe', () => {
    expect(ofmWidthOf(undefined)).toBeUndefined();
    expect(ofmWidthOf({})).toBeUndefined();
  });
});
