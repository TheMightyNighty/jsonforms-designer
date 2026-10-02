const UMLAUTE: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
};

/**
 * Leitet aus einem Formulartitel eine Kennung ab, wie der Katalog sie
 * verlangt: a-z, 0-9 und Bindestrich, höchstens 64 Zeichen.
 */
export function kennungAusTitel(titel: string): string {
  const kennung = titel
    .toLowerCase()
    .replace(/[äöüß]/g, (z) => UMLAUTE[z])
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '');
  return kennung || 'formular';
}

/** Kennung mit Zähler für den Fall, dass die Grundform schon vergeben ist. */
export function kennungMitZaehler(basis: string, zaehler: number): string {
  if (zaehler < 2) return basis;
  const suffix = `-${zaehler}`;
  return basis.slice(0, 64 - suffix.length).replace(/-+$/g, '') + suffix;
}
