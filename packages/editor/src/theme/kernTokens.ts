/**
 * KERN-Design-Token — GENERIERT, nicht von Hand ändern.
 *
 * Quelle: @kern-ux/native@2.8.2 (EUPL-1.2), helles Theme.
 * Erzeugt von scripts/vendor-kern.mjs; dort steht auch, warum KERN
 * vendored und nicht als Laufzeit-Abhängigkeit geführt wird (ADR 0004).
 *
 * KERN definiert seine Farben in oklch. Die Werte sind hier einmalig nach
 * sRGB-Hex umgerechnet, weil MUI intern mit Farben rechnet (alpha, darken)
 * und oklch nicht versteht.
 */

export const KERN_FARBEN = {
  aktion: '#2044AA',
  aufAktion: '#FFFFFF',
  fokus: '#454B6B',
  besucht: '#7E01A8',
  hintergrund: '#FFFFFF',
  hintergrundGetoent: '#F3F4F7',
  flaeche: '#F3F4F7',
  text: '#131525',
  textGedaempft: '#51577A',
  textInvers: '#F3F4F7',
  rahmen: '#6E7597',
  rahmenDekorativ: '#C0C3D5',
  feldHintergrund: '#F3F4F7',
  feldRahmen: '#1D2034',
  gefahr: '#C31C13',
  gefahrHintergrund: '#FEE4E0',
  warnung: '#925400',
  warnungHintergrund: '#FFE7B6',
  erfolg: '#007155',
  erfolgHintergrund: '#CDF2E4',
  info: '#006B8C',
  infoHintergrund: '#C0F3FF',
} as const;

/** Abstands-Skala in Pixeln (KERN metric-space). */
export const KERN_ABSTAND = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
} as const;

/** Eckenradien in Pixeln (KERN metric-border-radius). */
export const KERN_RADIUS = {
  klein: 2,
  standard: 4,
  gross: 8,
} as const;

/** Rahmenbreiten in Pixeln (KERN metric-border-width). */
export const KERN_RAHMENBREITE = {
  leicht: 1,
  standard: 2,
} as const;

/** Typografie (KERN typography, statische Stufen). */
export const KERN_SCHRIFT = {
  familie: '"Fira Sans", sans-serif',
  gewichtRegulaer: 400,
  gewichtMittel: 500,
  gewichtHalbfett: 600,
  groesseKlein: 16,
  groesseMittel: 18,
  groesseGross: 21,
  zeilenhoeheMittel: 24,
  zeilenhoeheGross: 32,
} as const;

/** Primitive Schriftgrößen in Pixeln (KERN font-size-Skala). */
export const KERN_SCHRIFTGROESSEN = {
  g12: 12,
  g14: 14,
  g16: 16,
  g18: 18,
  g20: 20,
  g21: 21,
  g24: 24,
  g26: 26,
  g32: 32,
  g40: 40,
  g48: 48,
  g56: 56,
  g72: 72,
  g80: 80,
} as const;

/** Version des Pakets, aus dem diese Token stammen. */
export const KERN_VERSION = '2.8.2';
