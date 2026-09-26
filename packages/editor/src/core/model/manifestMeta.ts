/**
 * Manifest-Datenhalter (OFM Kapitel 2): Formular-Metadaten leben im Manifest,
 * nicht im schema.json (OFM-R-205/OFM-R-304). `title` und `description`
 * bleiben in schema.json (dort strukturell erlaubt); das Manifest übernimmt
 * den Titel beim Export aus schema.title.
 */

export interface FormManifestMeta {
  /** Stabile Formular-ID als URN (OFM-R-202). */
  id: string;
  /** Fachliche Formularversion in SemVer (OFM-R-201). */
  version: string;
  publisher: string;
  legalBasis: string;
  /** ISO-Datum (YYYY-MM-DD). */
  validFrom: string;
  /** BCP-47-Basissprache, z. B. "de". */
  language: string;
}

export const emptyManifestMeta: FormManifestMeta = {
  id: '',
  version: '',
  publisher: '',
  legalBasis: '',
  validFrom: '',
  language: 'de',
};

/**
 * Muster für das URN-Feld im Metadaten-Dialog. Verlangt zusätzlich zum
 * Namensraum mindestens ein Zeichen Rest, damit die URN auch das strengere
 * Manifest-Meta-Schema (^urn:[a-zA-Z0-9][a-zA-Z0-9-]{1,31}:.+$) erfüllt.
 */
export const FORM_URN_PATTERN = /^urn:[a-z0-9][a-z0-9-]{1,31}:.+$/;

export function isValidFormUrn(value: string): boolean {
  return FORM_URN_PATTERN.test(value);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Vorschlags-Generator: URN aus Herausgeber + Titel (slugifiziert). */
export function suggestFormUrn(publisher: string, title: string): string {
  const ns = slugify(publisher).slice(0, 32) || 'behoerde';
  const rest = slugify(title) || 'formular';
  return `urn:de:${ns}:formular:${rest}`;
}
