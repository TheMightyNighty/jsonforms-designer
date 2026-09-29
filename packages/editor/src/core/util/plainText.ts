/**
 * Plain-Text-Garantie (OFM-R-404): Anzeigetexte (Labels, Titel, Hinweise)
 * dürfen kein HTML enthalten. Der Editor unterbindet Markup bei der Eingabe,
 * der Export strippt zusätzlich als zweite Verteidigungslinie.
 */
export function stripHtml(value: string): string {
  let previous: string;
  let current = value;
  do {
    previous = current;
    current = current.replace(/<[^>]*>/g, '');
  } while (current !== previous);
  return current;
}
