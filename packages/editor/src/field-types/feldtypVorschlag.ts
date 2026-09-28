/**
 * Typvorschlag aus der Feldbezeichnung.
 *
 * Wer ein Feld „Geburtsdatum" nennt, meint ein Datumsfeld — legt aber oft ein
 * Textfeld an, weil die Palette zuerst ein Textfeld anbietet. Diese Funktion
 * liest die Bezeichnung und schlägt den passenden Feldtyp vor. Der Vorschlag
 * ist ein Hinweis, keine Korrektur: Die Oberfläche zeigt ihn nicht blockierend
 * an, mit „Übernehmen" und „Ignorieren" (ADR 0002, Arbeitspaket 5).
 *
 * Bewusst eine Stichwortliste und kein Sprachmodell: Die Zuordnung muss im
 * Fachbereich nachvollziehbar und ohne Codeverständnis erweiterbar sein.
 */
import { FIELD_TYPE_CATALOG } from './fieldTypes';

/**
 * Wie eine Bezeichnung auf ein Stichwort trifft.
 *
 * - `wort`: eigenständiges Wort in der Bezeichnung („Datum der Geburt")
 * - `teil`: beliebige Teilzeichenkette („Geburtsdatum")
 *
 * `teil` ist scharf und trifft auch in zusammengesetzten Wörtern — genau
 * deshalb gehören dort nur Stichwörter hin, die kaum anders vorkommen
 * („iban", „telefon"). Alles Mehrdeutige („ort", „land") gehört zu `wort`,
 * sonst schlägt „Geburtsort" ein Auswahlfeld vor.
 */
export type Treffermodus = 'wort' | 'teil';

export interface Vorschlagsregel {
  /** id eines Eintrags aus FIELD_TYPE_CATALOG */
  feldtypId: string;
  modus: Treffermodus;
  stichwoerter: readonly string[];
  /**
   * Zusätzlicher Validator, der zum Vorschlag gehört (OpenCode-Baustein-id).
   * Der Katalog kennt keinen eigenen PLZ-Typ; die Postleitzahl ist ein
   * Textfeld mit PLZ-Prüfung.
   */
  validatorId?: string;
}

export interface Feldtypvorschlag {
  /** id aus FIELD_TYPE_CATALOG */
  feldtypId: string;
  /** Das Stichwort, das den Vorschlag ausgelöst hat — erklärt den Hinweis. */
  ausloeser: string;
  /** Optionaler Validator, der zum Vorschlag gehört. */
  validatorId?: string;
}

/**
 * Vereinheitlicht Groß-/Kleinschreibung und Umlaute, damit „Straße" und
 * „strasse" gleich behandelt werden. Bindestriche werden zu Leerzeichen,
 * damit „E-Mail-Adresse" auch als Wortfolge trifft.
 */
function normalisiere(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .trim();
}

function trifft(
  bezeichnung: string,
  stichwort: string,
  modus: Treffermodus,
): boolean {
  const heu = normalisiere(bezeichnung);
  const nadel = normalisiere(stichwort);
  if (modus === 'teil') return heu.includes(nadel);
  // Wortgrenze: nur als eigenständiges Wort, damit „Ort" nicht in
  // „Geburtsort" trifft. Trennzeichen sind alles außer Buchstaben/Ziffern.
  return new RegExp(`(^|[^a-z0-9])${nadel}([^a-z0-9]|$)`).test(heu);
}

/**
 * Schlägt einen Feldtyp zur Bezeichnung vor, oder `undefined`, wenn kein
 * Stichwort passt. Eine leere oder sehr kurze Bezeichnung liefert nie einen
 * Vorschlag — beim Tippen soll kein Hinweis aufblitzen.
 */
export function vorschlagFeldtyp(
  label: string,
  regeln: readonly Vorschlagsregel[] = [],
): Feldtypvorschlag | undefined {
  if (normalisiere(label).length < 3) return undefined;

  for (const regel of regeln) {
    const ausloeser = regel.stichwoerter.find((w) =>
      trifft(label, w, regel.modus),
    );
    if (!ausloeser) continue;
    if (!FIELD_TYPE_CATALOG.some((f) => f.id === regel.feldtypId)) continue;
    return {
      feldtypId: regel.feldtypId,
      ausloeser,
      validatorId: regel.validatorId,
    };
  }
  return undefined;
}

/**
 * Weicht der gewählte Feldtyp vom Vorschlag ab? Ohne erkennbaren Feldtyp
 * (Fremdimport) wird nichts vorgeschlagen — dort wäre der Hinweis nur Lärm.
 */
export function vorschlagWeichtAb(
  label: string,
  aktuellerFeldtypId: string | undefined,
  regeln: readonly Vorschlagsregel[] = [],
): Feldtypvorschlag | undefined {
  if (!aktuellerFeldtypId) return undefined;
  const vorschlag = vorschlagFeldtyp(label, regeln);
  if (!vorschlag || vorschlag.feldtypId === aktuellerFeldtypId)
    return undefined;
  return vorschlag;
}
