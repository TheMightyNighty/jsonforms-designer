/**
 * Suche über die Palette.
 *
 * Das Suchfeld steht über allen Reitern und durchsucht Bausteine und
 * Einzelfelder gemeinsam. FIM-Einträge kommen aus einem entfernten Dienst und
 * haben ihre eigene (debouncte) Suche im FIM-Reiter — das Suchfeld oben
 * verweist darauf, statt eine zweite Abfrage zu starten.
 *
 * Die Filterlogik liegt hier als reine Funktion, damit sie ohne Oberfläche
 * testbar ist.
 */
import { Baustein } from '../bausteine';
import { FieldTypeDefinition } from '../field-types/fieldTypes';

/** Mindestlänge, ab der gesucht wird — darunter bleibt die normale Ansicht. */
export const SUCHE_MIN_LAENGE = 2;

/**
 * Vereinheitlicht Groß-/Kleinschreibung und Umlaute, damit „strasse" auch
 * „Straße" findet und umgekehrt.
 */
export function normalisiereSuchtext(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .trim();
}

function enthaelt(heuhaufen: string, nadel: string): boolean {
  return normalisiereSuchtext(heuhaufen).includes(nadel);
}

export function istSuchaktiv(suchtext: string): boolean {
  return suchtext.trim().length >= SUCHE_MIN_LAENGE;
}

/**
 * Feldtypen, deren Name auf den Suchtext passt. Die Namen kommen von außen:
 * Gesucht wird in der Sprache, in der die Palette beschriftet ist, und die
 * kennt der Katalog nicht (ADR 0007).
 */
export function sucheFeldtypen(
  feldtypen: readonly FieldTypeDefinition[],
  suchtext: string,
  name: (feldtypId: string) => string,
): FieldTypeDefinition[] {
  if (!istSuchaktiv(suchtext)) return [];
  const nadel = normalisiereSuchtext(suchtext);
  return feldtypen.filter((ft) => enthaelt(name(ft.id), nadel));
}

/**
 * Bausteine, deren Name, Beschreibung oder ein enthaltenes Feld auf den
 * Suchtext passt — „IBAN" findet so auch den Baustein „Bankverbindung".
 */
export function sucheBausteine(
  bausteine: readonly Baustein[],
  suchtext: string,
): Baustein[] {
  if (!istSuchaktiv(suchtext)) return [];
  const nadel = normalisiereSuchtext(suchtext);
  return bausteine.filter(
    (b) =>
      enthaelt(b.name, nadel) ||
      enthaelt(b.beschreibung, nadel) ||
      b.felder.some((f) => enthaelt(f.label, nadel)),
  );
}
