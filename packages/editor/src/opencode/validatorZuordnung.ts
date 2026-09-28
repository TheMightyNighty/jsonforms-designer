/**
 * Zuordnung: Welcher OpenCode-Validator passt zu welchem Feldtyp?
 *
 * Ohne diese Zuordnung bietet der Eigenschaften-Bereich jedem Feld jeden
 * Validator an — die Steuer-ID-Prüfung stünde am Geburtsdatum. Die Tabelle
 * ist bewusst explizit und nicht aus Namen abgeleitet, damit sie ohne
 * Codeverständnis lesbar und erweiterbar bleibt.
 *
 * Dass hier deutsche Prüfungen stehen (PLZ, Steuer-ID), ist kein Rückstand
 * des neutralen Kerns: Open CoDE ist eine Plattform der deutschen
 * Verwaltung, und dieses Modul **ist** der regionale Teil. Im Kern steht es
 * nicht, und ohne `modules.openCode.enabled` läuft es gar nicht (ADR 0007).
 *
 * [RÜCKFRAGE AN FABLE: `OpenCodeBaustein` trägt keine Typinformation. Soll das
 * Interface um ein Feld wie `passtZuFeldtypen?: string[]` erweitert werden,
 * damit ein echter OpenCode-Dienst die Zuordnung selbst mitliefert? Bis dahin
 * wird sie hier im Editor gepflegt, und Validatoren ohne Eintrag werden
 * weiterhin überall angeboten — der vorsichtigere Default, weil Verstecken
 * Funktionalität nimmt.]
 */
import { OpenCodeBaustein } from './openCodeService';

/**
 * Validator-id → ids aus `FIELD_TYPE_CATALOG`, an denen der Validator sinnvoll
 * ist. Ein Validator, der hier nicht steht, gilt als universell einsetzbar.
 */
export const VALIDATOR_FELDTYPEN: Record<string, readonly string[]> = {
  'oc-val-email': ['email'],
  'oc-val-iban': ['iban'],
  // Die Postleitzahl wird als einzeiliges Textfeld erfasst; der Katalog kennt
  // keinen eigenen PLZ-Typ.
  'oc-val-plz': ['text-short'],
  'oc-val-phone': ['tel', 'text-short'],
  'oc-val-tax-id': ['text-short'],
};

/**
 * Passt ein Validator zum Feldtyp? Ohne bekannten Feldtyp (z. B. importiertes
 * Fremdschema) und ohne Tabelleneintrag wird nicht gefiltert.
 */
export function passtValidatorZuFeldtyp(
  validatorId: string,
  feldtypId: string | undefined,
): boolean {
  const erlaubt = VALIDATOR_FELDTYPEN[validatorId];
  if (!erlaubt) return true;
  if (!feldtypId) return true;
  return erlaubt.includes(feldtypId);
}

/** Die zum Feldtyp passenden Validatoren in unveränderter Reihenfolge. */
export function filtereValidatoren<T extends Pick<OpenCodeBaustein, 'id'>>(
  validatoren: readonly T[],
  feldtypId: string | undefined,
): T[] {
  return validatoren.filter((v) => passtValidatorZuFeldtyp(v.id, feldtypId));
}
