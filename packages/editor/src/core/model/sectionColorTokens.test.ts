import { describe, expect, it } from 'vitest';

import {
  isSectionColorToken,
  legacyColorToToken,
  SECTION_COLOR_DISPLAY,
  SECTION_COLOR_LABELS,
  SECTION_COLOR_TOKENS,
  sectionColorDisplay,
} from './sectionColorTokens';

describe('isSectionColorToken', () => {
  it('erkennt alle Registry-Token', () => {
    for (const token of SECTION_COLOR_TOKENS) {
      expect(isSectionColorToken(token)).toBe(true);
    }
  });

  it('weist Freitext, Hex-Werte und Nicht-Strings ab', () => {
    expect(isSectionColorToken('türkis')).toBe(false);
    expect(isSectionColorToken('#C8D8F0')).toBe(false);
    expect(isSectionColorToken(undefined)).toBe(false);
    expect(isSectionColorToken(42)).toBe(false);
  });
});

describe('legacyColorToToken', () => {
  it('lässt bereits normalisierte Token unverändert', () => {
    expect(legacyColorToToken('green')).toBe('green');
  });

  it('migriert die Hex-Swatches des alten Farbwählers', () => {
    expect(legacyColorToToken('#C8D8F0')).toBe('blue');
    expect(legacyColorToToken('#C8E8C8')).toBe('green');
    expect(legacyColorToToken('#F5E6A0')).toBe('yellow');
    expect(legacyColorToToken('#F5C8C8')).toBe('red');
    expect(legacyColorToToken('#DFC8F5')).toBe('purple');
    // Türkis und Weiß haben keinen eigenen Token
    expect(legacyColorToToken('#C8EAE8')).toBe('green');
    expect(legacyColorToToken('#FFFFFF')).toBe('gray');
  });

  it('erkennt die Alt-Hex-Werte auch in Kleinschreibung', () => {
    expect(legacyColorToToken('#c8d8f0')).toBe('blue');
  });

  it('löst unbekannte Hex-Werte über den Farbton auf', () => {
    expect(legacyColorToToken('#FF0000')).toBe('red');
    expect(legacyColorToToken('#FFD400')).toBe('yellow');
    expect(legacyColorToToken('#00FF00')).toBe('green');
    expect(legacyColorToToken('#0000FF')).toBe('blue');
    expect(legacyColorToToken('#8000FF')).toBe('purple');
    // Rot über den Nullpunkt des Farbkreises hinaus
    expect(legacyColorToToken('#FF0010')).toBe('red');
    // Magenta liegt noch im Lila-Bereich
    expect(legacyColorToToken('#FF0080')).toBe('purple');
  });

  it('behandelt unbunte Werte als Grau', () => {
    expect(legacyColorToToken('#777777')).toBe('gray');
    expect(legacyColorToToken('#000000')).toBe('gray');
  });

  it('fällt bei unlesbaren Werten auf Grau zurück', () => {
    expect(legacyColorToToken('rgb(1,2,3)')).toBe('gray');
    expect(legacyColorToToken('')).toBe('gray');
    expect(legacyColorToToken('#FFF')).toBe('gray');
  });

  it('akzeptiert Hex-Werte mit Leerraum und ohne Doppelkreuz', () => {
    expect(legacyColorToToken('  00ff00 ')).toBe('green');
  });
});

describe('sectionColorDisplay', () => {
  it('liefert für jeden Token eine Anzeigefarbe', () => {
    for (const token of SECTION_COLOR_TOKENS) {
      expect(sectionColorDisplay(token)).toBe(SECTION_COLOR_DISPLAY[token]);
      expect(SECTION_COLOR_LABELS[token]).toBeTruthy();
    }
  });

  it('liefert auch für einen Alt-Hex-Wert die Token-Anzeigefarbe', () => {
    expect(sectionColorDisplay('#C8EAE8')).toBe(SECTION_COLOR_DISPLAY.green);
  });
});
