/**
 * Gemeinsame Layout-Mathematik für `ofm:width` (Kapitel 4, Options-Registry):
 * ein Kind eines HorizontalLayout mit `options["ofm:width"]` (1–12) erhält
 * die entsprechende Breite auf dem 12er-Raster; Kinder ohne Option
 * degradieren definiert zur Gleichverteilung (Spec: „Gleichverteilung").
 *
 * Diese Funktion ist die einzige Stelle, die alle drei Renderer-Sets für
 * die Breitenberechnung verwenden — Layout-Mathematik ist die eine erlaubte
 * Ausnahme von „keine gemeinsame Rendering-Logik" (AUFTRAG 2.3, Punkt 1).
 */
export function flexBasisFor(width: unknown, siblingCount: number): string {
  if (typeof width === 'number' && width >= 1 && width <= 12) {
    return `${(width / 12) * 100}%`;
  }
  const share = siblingCount > 0 ? 100 / siblingCount : 100;
  return `${share}%`;
}

export function ofmWidthOf(
  options: Record<string, unknown> | undefined,
): unknown {
  return options?.['ofm:width'];
}
