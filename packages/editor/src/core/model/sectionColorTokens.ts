/**
 * Abschnittsfarben als Token (OFM-R-421): `ofm:sectionColor` akzeptiert
 * ausschließlich die Registry-Token — kein Freitext-CSS. Der Editor speichert
 * intern dieselben Token; Alt-Stände mit Hex-Farben werden beim Laden über
 * `legacyColorToToken` migriert.
 */

export const SECTION_COLOR_TOKENS = [
  'blue',
  'green',
  'yellow',
  'red',
  'purple',
  'gray',
] as const;

export type SectionColorToken = (typeof SECTION_COLOR_TOKENS)[number];

export function isSectionColorToken(
  value: unknown,
): value is SectionColorToken {
  return (
    typeof value === 'string' &&
    (SECTION_COLOR_TOKENS as readonly string[]).includes(value)
  );
}

/** Anzeige-Farben der Token im Editor und in der Vorschau (neutral-pastell). */
export const SECTION_COLOR_DISPLAY: Record<SectionColorToken, string> = {
  blue: '#C8D8F0',
  green: '#C8E8C8',
  yellow: '#F5E6A0',
  red: '#F5C8C8',
  purple: '#DFC8F5',
  gray: '#D8D8D8',
};

export const SECTION_COLOR_LABELS: Record<SectionColorToken, string> = {
  blue: 'Blau',
  green: 'Grün',
  yellow: 'Gelb',
  red: 'Rot',
  purple: 'Lila',
  gray: 'Grau',
};

/**
 * Zuordnungstabelle Alt-Farbwähler → Token (nächstliegender Token nach
 * Farbton). Grundlage: die zehn Hex-Swatches des früheren Farbwählers.
 *
 * | Alt-Hex  | Alt-Label  | Token  |
 * |----------|------------|--------|
 * | #C8D8F0  | Blau       | blue   |
 * | #C8E8C8  | Grün       | green  |
 * | #F5E6A0  | Gelb       | yellow |
 * | #F5C8C8  | Rot        | red    |
 * | #DFC8F5  | Lila       | purple |
 * | #C8EAE8  | Türkis     | green  |
 * | #D8D8D8  | Grau       | gray   |
 * | #FFFFFF  | Weiß       | gray   |
 * | #004A99  | Dunkelblau | blue   |
 * | #009EE0  | Hellblau   | blue   |
 */
const LEGACY_HEX_TO_TOKEN: Record<string, SectionColorToken> = {
  '#C8D8F0': 'blue',
  '#C8E8C8': 'green',
  '#F5E6A0': 'yellow',
  '#F5C8C8': 'red',
  '#DFC8F5': 'purple',
  '#C8EAE8': 'green',
  '#D8D8D8': 'gray',
  '#FFFFFF': 'gray',
  '#004A99': 'blue',
  '#009EE0': 'blue',
};

/**
 * Normalisiert einen gespeicherten Farbwert auf ein Token: Token bleiben
 * unverändert, bekannte Alt-Hex-Werte werden gemappt, unbekannte Hex-Werte
 * über den nächstliegenden Farbton aufgelöst.
 */
export function legacyColorToToken(value: string): SectionColorToken {
  if (isSectionColorToken(value)) return value;
  const mapped = LEGACY_HEX_TO_TOKEN[value.toUpperCase()];
  if (mapped) return mapped;
  return nearestTokenByHue(value);
}

function nearestTokenByHue(hex: string): SectionColorToken {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 'gray';
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta < 0.08) return 'gray';
  let hue: number;
  if (max === r) hue = 60 * (((g - b) / delta) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);
  if (hue < 0) hue += 360;
  if (hue < 15 || hue >= 345) return 'red';
  if (hue < 70) return 'yellow';
  if (hue < 170) return 'green';
  if (hue < 260) return 'blue';
  if (hue < 345) return 'purple';
  return 'gray';
}

/** Anzeige-Farbe für einen gespeicherten Wert (Token oder Alt-Hex). */
export function sectionColorDisplay(value: string): string {
  return SECTION_COLOR_DISPLAY[legacyColorToToken(value)];
}
