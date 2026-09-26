import { describe, expect, it } from 'vitest';

import {
  erstelleKernVorschauTheme,
  erstelleKernWerkzeugTheme,
} from './kernTheme';
import { KERN_FARBEN, KERN_SCHRIFT, KERN_VERSION } from './kernTokens';

// ---------------------------------------------------------------------------
// Kontrast (ADR 0002/V4: Text erfüllt 4,5:1)
// ---------------------------------------------------------------------------

/** Relative Leuchtdichte nach WCAG 2.1 für einen Hex-Farbwert. */
function leuchtdichte(hex: string): number {
  const kanaele = [1, 3, 5].map((i) => {
    const anteil = parseInt(hex.slice(i, i + 2), 16) / 255;
    return anteil <= 0.03928
      ? anteil / 12.92
      : ((anteil + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * kanaele[0] + 0.7152 * kanaele[1] + 0.0722 * kanaele[2];
}

export function kontrast(vordergrund: string, hintergrund: string): number {
  const a = leuchtdichte(vordergrund);
  const b = leuchtdichte(hintergrund);
  const [hell, dunkel] = a > b ? [a, b] : [b, a];
  return (hell + 0.05) / (dunkel + 0.05);
}

describe('Kontrast der KERN-Token', () => {
  const flaechen = [
    ['weiße Fläche', KERN_FARBEN.hintergrund],
    ['getönte Fläche (Seitenleisten)', KERN_FARBEN.flaeche],
  ] as const;

  it.each(flaechen)('Fließtext auf %s erfüllt 4,5:1', (_name, flaeche) => {
    expect(kontrast(KERN_FARBEN.text, flaeche)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(flaechen)(
    'gedämpfter Text auf %s erfüllt 4,5:1',
    (_name, flaeche) => {
      expect(
        kontrast(KERN_FARBEN.textGedaempft, flaeche),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(flaechen)('Aktionsfarbe auf %s erfüllt 4,5:1', (_name, flaeche) => {
    expect(kontrast(KERN_FARBEN.aktion, flaeche)).toBeGreaterThanOrEqual(4.5);
  });

  it('Text auf der Aktionsfarbe (gefüllte Schaltfläche) erfüllt 4,5:1', () => {
    expect(
      kontrast(KERN_FARBEN.aufAktion, KERN_FARBEN.aktion),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['Fehler', KERN_FARBEN.gefahr],
    ['Warnung', KERN_FARBEN.warnung],
    ['Erfolg', KERN_FARBEN.erfolg],
    ['Hinweis', KERN_FARBEN.info],
  ])('Rückmeldung „%s" erfüllt 4,5:1 auf weißer Fläche', (_name, farbe) => {
    expect(kontrast(farbe, KERN_FARBEN.hintergrund)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it('Fokusindikator erfüllt 3:1 gegen beide Flächen (WCAG 2.4.11)', () => {
    for (const [, flaeche] of flaechen) {
      expect(kontrast(KERN_FARBEN.fokus, flaeche)).toBeGreaterThanOrEqual(3);
    }
  });

  it('Feldrahmen erfüllt 3:1 gegen den Feldhintergrund (WCAG 1.4.11)', () => {
    expect(
      kontrast(KERN_FARBEN.feldRahmen, KERN_FARBEN.feldHintergrund),
    ).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Theme-Aufbau
// ---------------------------------------------------------------------------

describe('erstelleKernWerkzeugTheme', () => {
  const theme = erstelleKernWerkzeugTheme();

  it('übernimmt die KERN-Aktionsfarbe als Primärfarbe', () => {
    expect(theme.palette.primary.main).toBe(KERN_FARBEN.aktion);
  });

  it('setzt Fira Sans als erste Schriftfamilie', () => {
    expect(theme.typography.fontFamily).toContain('Fira Sans');
  });

  it('nutzt die KERN-Basisgröße für den Fließtext', () => {
    expect(theme.typography.body1.fontSize).toBe(
      `${KERN_SCHRIFT.groesseKlein}px`,
    );
  });

  it('nutzt den KERN-Standardradius', () => {
    expect(theme.shape.borderRadius).toBe(4);
  });

  it('behält die 8px-Spacing-Basis, auf der die Oberfläche aufbaut', () => {
    expect(theme.spacing(1)).toBe('8px');
    expect(theme.spacing(2)).toBe('16px');
  });
});

describe('erstelleKernVorschauTheme', () => {
  it('teilt Farben und Schrift mit dem Werkzeug-Theme', () => {
    const vorschau = erstelleKernVorschauTheme();
    const werkzeug = erstelleKernWerkzeugTheme();
    expect(vorschau.palette.primary.main).toBe(werkzeug.palette.primary.main);
    expect(vorschau.typography.fontFamily).toBe(werkzeug.typography.fontFamily);
  });
});

describe('kernTokens', () => {
  it('nennt die Paketversion, aus der die Token stammen', () => {
    expect(KERN_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('enthält ausschließlich Hex-Farben (MUI rechnet nicht in oklch)', () => {
    for (const [name, wert] of Object.entries(KERN_FARBEN)) {
      expect(wert, `${name} ist kein Hex-Wert`).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
