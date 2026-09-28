/**
 * Property-Schlüssel eines neuen Feldes (ADR 0007).
 *
 * Der Schlüssel steht im erzeugten JSON Schema und damit in den Daten, die
 * das Formular später liefert. Er wird aus der Beschriftung abgeleitet, die
 * die Redakteurin sieht: Wer ein Feld „Vorname" nennt, bekommt `vorname`,
 * wer es „First name" nennt, `first_name`. Eine feste Tabelle hätte
 * stattdessen die Sprache des Editors festgeschrieben.
 *
 * Strukturelle Elemente tragen keine Antwort und brauchen nur einen
 * Pseudo-Schlüssel zur Auswahl; der kommt aus der Feldtyp-id und beginnt mit
 * einem Unterstrich.
 */
import { FieldTypeDefinition } from './fieldTypes';

/**
 * Umlaute und Akzente werden zu ihrem ASCII-Gegenstück, alles Übrige zu
 * einem Unterstrich. Ein Schlüssel wie `straße` wäre in JSON zulässig, aber
 * in Auswertungen und Schnittstellen eine dauerhafte Fehlerquelle.
 */
export function schluesselAusText(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .normalize('NFD')
      // Kombinierende Akzente entfernen: „é" → „e".
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  );
}

export function feldtypPropertyKey(
  definition: FieldTypeDefinition,
  label: string,
): string {
  if (definition.isStructural) return `_${definition.id.replace(/-/g, '_')}`;
  // Eine Beschriftung, die nur aus Sonderzeichen besteht, ergibt keinen
  // Schlüssel — dann trägt die Feldtyp-id.
  return schluesselAusText(label) || definition.id.replace(/-/g, '_');
}
