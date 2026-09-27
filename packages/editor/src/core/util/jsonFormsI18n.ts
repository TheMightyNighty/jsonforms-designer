/**
 * Deutschsprachige Fehlermeldungen für die gerenderten Formulare.
 *
 * JSONForms validiert mit AJV, und AJV meldet auf Englisch: „is a required
 * property", „must NOT have fewer than 1 characters". Im Testmodus stand
 * das mitten im deutschen Formular.
 *
 * Statt `ajv-i18n` als neue Laufzeit-Abhängigkeit aufzunehmen (ADR 0002/V5)
 * übersetzt diese Datei die Schlüsselwörter selbst, die der Feldtyp-Katalog
 * überhaupt erzeugen kann. Sie wird über die `i18n`-Prop von `<JsonForms>`
 * übergeben und gilt damit für Arbeitsfläche und Vorschau gleichermaßen.
 *
 * [RÜCKFRAGE AN FABLE: Die Meldungen sind an der Verwaltungssprache
 * orientiert formuliert („Bitte füllen Sie dieses Feld aus"). Falls es dafür
 * eine hausinterne Vorgabe gibt, gehören die Texte dorthin.]
 */

/** Ausschnitt eines AJV-Fehlers, den wir tatsächlich auswerten. */
export interface ValidierungsFehler {
  keyword?: string;
  message?: string;
  params?: Record<string, unknown>;
}

type Texte = Record<string, (params: Record<string, unknown>) => string>;

const DE: Texte = {
  required: () => 'Bitte füllen Sie dieses Feld aus.',
  minLength: (p) => `Bitte mindestens ${p.limit} Zeichen eingeben.`,
  maxLength: (p) => `Bitte höchstens ${p.limit} Zeichen eingeben.`,
  minimum: (p) => `Der Wert muss mindestens ${p.limit} betragen.`,
  maximum: (p) => `Der Wert darf höchstens ${p.limit} betragen.`,
  exclusiveMinimum: (p) => `Der Wert muss größer als ${p.limit} sein.`,
  exclusiveMaximum: (p) => `Der Wert muss kleiner als ${p.limit} sein.`,
  multipleOf: (p) => `Der Wert muss ein Vielfaches von ${p.multipleOf} sein.`,
  pattern: () => 'Die Eingabe hat nicht das erwartete Format.',
  enum: () => 'Bitte einen der angebotenen Werte wählen.',
  const: () => 'Bitte den vorgegebenen Wert verwenden.',
  type: () => 'Die Eingabe passt nicht zu dieser Art von Feld.',
  uniqueItems: () => 'Jeder Eintrag darf nur einmal vorkommen.',
  minItems: (p) => `Bitte mindestens ${p.limit} Einträge angeben.`,
  maxItems: (p) => `Bitte höchstens ${p.limit} Einträge angeben.`,
  format: (p) => FORMATE_DE[String(p.format)] ?? 'Die Eingabe ist ungültig.',
};

const FORMATE_DE: Record<string, string> = {
  email: 'Bitte eine gültige E-Mail-Adresse eingeben.',
  date: 'Bitte ein gültiges Datum eingeben.',
  time: 'Bitte eine gültige Uhrzeit eingeben.',
  'date-time': 'Bitte Datum und Uhrzeit gültig eingeben.',
  uri: 'Bitte eine gültige Adresse eingeben (mit https://).',
};

const EN: Texte = {
  required: () => 'Please fill in this field.',
  minLength: (p) => `Please enter at least ${p.limit} characters.`,
  maxLength: (p) => `Please enter no more than ${p.limit} characters.`,
  minimum: (p) => `The value must be at least ${p.limit}.`,
  maximum: (p) => `The value must be at most ${p.limit}.`,
  exclusiveMinimum: (p) => `The value must be greater than ${p.limit}.`,
  exclusiveMaximum: (p) => `The value must be less than ${p.limit}.`,
  multipleOf: (p) => `The value must be a multiple of ${p.multipleOf}.`,
  pattern: () => 'The input does not have the expected format.',
  enum: () => 'Please choose one of the offered values.',
  const: () => 'Please use the given value.',
  type: () => 'The input does not match this kind of field.',
  uniqueItems: () => 'Each entry may appear only once.',
  minItems: (p) => `Please provide at least ${p.limit} entries.`,
  maxItems: (p) => `Please provide no more than ${p.limit} entries.`,
  format: (p) => FORMATE_EN[String(p.format)] ?? 'The input is invalid.',
};

const FORMATE_EN: Record<string, string> = {
  email: 'Please enter a valid email address.',
  date: 'Please enter a valid date.',
  time: 'Please enter a valid time.',
  'date-time': 'Please enter a valid date and time.',
  uri: 'Please enter a valid address (including https://).',
};

/**
 * Übersetzt einen Validierungsfehler. Für unbekannte Schlüsselwörter bleibt
 * die Originalmeldung stehen — eine englische Meldung ist immer noch
 * besser als gar keine.
 */
export function uebersetzeValidierungsFehler(
  fehler: ValidierungsFehler | undefined,
  locale: string,
): string | undefined {
  if (!fehler) return undefined;
  const texte = locale.startsWith('de') ? DE : EN;
  const bauer = fehler.keyword ? texte[fehler.keyword] : undefined;
  return bauer ? bauer(fehler.params ?? {}) : fehler.message;
}

/**
 * Fertige `i18n`-Prop für `<JsonForms>`. `translate` bleibt bewusst
 * unbesetzt: Die Beschriftungen kommen aus dem UI-Schema des Formulars,
 * nicht aus einem Übersetzungskatalog des Editors.
 */
export function jsonFormsI18n(locale: string) {
  return {
    locale: locale.startsWith('de') ? 'de-DE' : 'en-GB',
    translateError: (fehler: ValidierungsFehler) =>
      uebersetzeValidierungsFehler(fehler, locale) ?? '',
  };
}
