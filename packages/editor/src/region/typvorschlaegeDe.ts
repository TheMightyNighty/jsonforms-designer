import { Vorschlagsregel } from '../field-types/feldtypVorschlag';

/**
 * Deutsche Stichwörter für den Typvorschlag (ADR 0007).
 *
 * Sie stehen hier und nicht im Kern, weil sie an der Sprache hängen:
 * „Geburtsdatum" hilft nur, wer auf Deutsch arbeitet.
 *
 * Reihenfolge = Priorität: Die erste passende Regel gewinnt. Spezifische
 * Stichwörter stehen vor allgemeinen — „geburtsdatum" vor „datum", sonst
 * gewänne bei „Geburtsdatum" nicht die speziellere Regel.
 *
 * Neue Stichwörter werden hier eingeordnet, nicht angehängt.
 */
export const TYPVORSCHLAEGE_DE: readonly Vorschlagsregel[] = [
  // ── Zeitangaben ─────────────────────────────────────────────────────────
  {
    feldtypId: 'datetime',
    modus: 'teil',
    stichwoerter: ['zeitpunkt', 'datum und uhrzeit', 'datum/uhrzeit'],
  },
  {
    feldtypId: 'date',
    modus: 'teil',
    stichwoerter: [
      'geburtsdatum',
      'geburtstag',
      'datum',
      'stichtag',
      'frist',
      'einzugsdatum',
      'auszugsdatum',
      'antragsdatum',
      'gueltig ab',
      'gültig ab',
    ],
  },
  { feldtypId: 'time', modus: 'teil', stichwoerter: ['uhrzeit'] },

  // ── Kontakt ─────────────────────────────────────────────────────────────
  {
    feldtypId: 'email',
    modus: 'teil',
    stichwoerter: ['e-mail', 'email', 'mailadresse', 'e-mail-adresse'],
  },
  {
    feldtypId: 'tel',
    modus: 'teil',
    stichwoerter: ['telefon', 'telefonnummer', 'mobilnummer', 'handynummer'],
  },
  {
    feldtypId: 'url',
    modus: 'teil',
    stichwoerter: ['webseite', 'website', 'internetadresse', 'homepage'],
  },

  // ── Datei ───────────────────────────────────────────────────────────────
  // Vor Bank und Geld: „Nachweis über das Einkommen" ist ein Dokument, kein
  // Betrag — das Wort „Nachweis" ist das stärkere Signal.
  {
    feldtypId: 'file-upload',
    modus: 'teil',
    stichwoerter: ['upload', 'nachweis', 'anlage', 'dokument', 'bescheinigung'],
  },

  // ── Bank und Geld ───────────────────────────────────────────────────────
  {
    feldtypId: 'iban',
    modus: 'teil',
    stichwoerter: ['iban', 'kontonummer'],
  },
  {
    feldtypId: 'currency',
    modus: 'teil',
    stichwoerter: [
      'betrag',
      'einkommen',
      'gehalt',
      'miete',
      'kosten',
      'summe',
      'entgelt',
    ],
  },

  // ── Adresse ─────────────────────────────────────────────────────────────
  {
    feldtypId: 'text-short',
    modus: 'teil',
    stichwoerter: ['postleitzahl', 'plz'],
    validatorId: 'oc-val-plz',
  },

  // ── Zahlen ──────────────────────────────────────────────────────────────
  {
    feldtypId: 'integer',
    modus: 'wort',
    stichwoerter: ['anzahl', 'stueckzahl', 'stückzahl', 'alter', 'kinderzahl'],
  },

  // ── Ja/Nein ─────────────────────────────────────────────────────────────
  {
    feldtypId: 'checkbox',
    modus: 'wort',
    stichwoerter: ['einverstanden', 'zustimmung', 'einwilligung', 'gelesen'],
  },

  // ── Längerer Text ───────────────────────────────────────────────────────
  {
    feldtypId: 'text-long',
    modus: 'teil',
    stichwoerter: [
      'begruendung',
      'begründung',
      'bemerkung',
      'anmerkung',
      'erlaeuterung',
      'erläuterung',
      'beschreibung',
      'freitext',
      'mitteilung',
    ],
  },
] as const;
