/**
 * Ableitung des fachlichen Feldtyps aus einem gespeicherten Feld.
 *
 * Der Katalog-Eintrag, mit dem ein Feld angelegt wurde, wird nicht persistiert
 * (`jfd_fieldState_v1` speichert nur JSON Schema + UI Schema, siehe ADR 0002/V2).
 * Der Feldtyp muss deshalb aus der Form des Feldes zurückgewonnen werden.
 *
 * Diese Ableitung ist die einzige Quelle für fachsprachliche Feldtyp-Angaben in
 * der Oberfläche. Sie ersetzt die frühere Anzeige des JSON-Basistyps, bei der
 * ein Datumsfeld („string" mit „format: date") als „Text" und ein Ja/Nein-Feld
 * als „Bool" erschien.
 *
 * Die Regeln stehen bewusst als explizite, geordnete Liste: Die erste passende
 * Regel gewinnt, spezifische Regeln stehen vor allgemeinen. So ist ohne
 * Codeverständnis nachvollziehbar, warum ein Feld als Datum und nicht als Text
 * erkannt wird.
 */
import { JsonSchema7 } from '@jsonforms/core';

import {
  FIELD_TYPE_CATALOG,
  FieldTypeDefinition,
  getFieldType,
} from './fieldTypes';

/** Anzeigetext, wenn kein Katalog-Feldtyp passt — fachsprachlich, nie „string". */
export const FELDTYP_FALLBACK_LABEL = 'Feld';

/** Schema-Ausschnitt eines Feldes, angereichert um die x-Zusätze des Katalogs. */
export type FeldSchema = JsonSchema7 & {
  'x-format'?: string;
  format?: string;
  pattern?: string;
};

type UiOptionen = Record<string, unknown> | undefined;

interface Erkennungsregel {
  /** id eines Eintrags aus FIELD_TYPE_CATALOG */
  feldtypId: string;
  passt: (schema: FeldSchema, optionen: UiOptionen) => boolean;
}

const istArray = (s: FeldSchema) => s.type === 'array';
const items = (s: FeldSchema): FeldSchema | undefined =>
  s.items && !Array.isArray(s.items) ? (s.items as FeldSchema) : undefined;

// Die beiden Muster stammen aus dem Katalog und werden dort gepflegt; sie
// werden hier ausgelesen statt dupliziert, damit eine Änderung am Katalog die
// Erkennung nicht stillschweigend aushebelt.
const IBAN_PATTERN = (getFieldType('iban').schema as FeldSchema).pattern;
const TEL_PATTERN = (getFieldType('tel').schema as FeldSchema).pattern;

/**
 * Reihenfolge = Priorität. Neue Feldtypen werden hier eingeordnet, nicht
 * angehängt: Ein Eintrag darf nur dann weiter unten stehen, wenn keine der
 * darüberliegenden Regeln ebenfalls greifen würde.
 */
const ERKENNUNGSREGELN: Erkennungsregel[] = [
  // ── Zeichenketten mit Sonderbedeutung (vor dem allgemeinen Text) ─────────
  // Datei-Upload und URL teilen sich `format: uri`; der Upload ist an der
  // accept-Option erkennbar und muss deshalb zuerst geprüft werden.
  {
    feldtypId: 'file-upload',
    passt: (s, o) => s.format === 'uri' && o?.accept !== undefined,
  },
  { feldtypId: 'url', passt: (s) => s.format === 'uri' },
  { feldtypId: 'email', passt: (s) => s.format === 'email' },
  { feldtypId: 'datetime', passt: (s) => s.format === 'date-time' },
  { feldtypId: 'date', passt: (s) => s.format === 'date' },
  { feldtypId: 'time', passt: (s) => s.format === 'time' },
  {
    feldtypId: 'password',
    passt: (s, o) => s.type === 'string' && o?.format === 'password',
  },
  {
    feldtypId: 'iban',
    passt: (s) => s.type === 'string' && s.pattern === IBAN_PATTERN,
  },
  {
    feldtypId: 'tel',
    passt: (s) => s.type === 'string' && s.pattern === TEL_PATTERN,
  },

  // ── Auswahl aus festen Werten ───────────────────────────────────────────
  {
    feldtypId: 'radio',
    passt: (s, o) =>
      s.type === 'string' &&
      Array.isArray(s.enum) &&
      (o?.format === 'radio' || o?.radio === true),
  },
  {
    feldtypId: 'dropdown',
    passt: (s) => s.type === 'string' && Array.isArray(s.enum),
  },
  {
    feldtypId: 'checkbox-group',
    passt: (s) => istArray(s) && Array.isArray(items(s)?.enum),
  },
  { feldtypId: 'repeat-group', passt: (s) => istArray(s) },

  // ── Zahlen ───────────────────────────────────────────────────────────────
  { feldtypId: 'currency', passt: (s) => s['x-format'] === 'currency' },
  {
    feldtypId: 'slider',
    passt: (s, o) =>
      (s.type === 'integer' || s.type === 'number') && o?.slider === true,
  },
  { feldtypId: 'integer', passt: (s) => s.type === 'integer' },
  { feldtypId: 'number', passt: (s) => s.type === 'number' },

  // ── Ja/Nein ──────────────────────────────────────────────────────────────
  { feldtypId: 'checkbox', passt: (s) => s.type === 'boolean' },

  // ── Text (allgemeinster Fall, deshalb zuletzt) ──────────────────────────
  {
    feldtypId: 'text-long',
    passt: (s, o) => s.type === 'string' && o?.multi === true,
  },
  { feldtypId: 'text-short', passt: (s) => s.type === 'string' },
];

/**
 * Liefert den Katalog-Feldtyp eines gespeicherten Feldes oder `undefined`,
 * wenn keine Regel greift (z. B. ein extern importiertes Schema mit
 * `type: 'object'`).
 */
export function ermittleFeldtyp(
  schema: FeldSchema | undefined,
  uiOptionen?: Record<string, unknown>,
): FieldTypeDefinition | undefined {
  if (!schema) return undefined;
  const regel = ERKENNUNGSREGELN.find((r) => r.passt(schema, uiOptionen));
  return regel ? getFieldType(regel.feldtypId) : undefined;
}

/**
 * Fachsprachliches Label eines gespeicherten Feldes für die Anzeige in der
 * Standardansicht — nie der JSON-Basistyp.
 */
export function feldtypLabel(
  schema: FeldSchema | undefined,
  uiOptionen?: Record<string, unknown>,
): string {
  return (
    ermittleFeldtyp(schema, uiOptionen)?.displayName ?? FELDTYP_FALLBACK_LABEL
  );
}

/**
 * Feldtypen, in die ein Feld **ohne Verlust** gewechselt werden kann:
 * gleicher JSON-Basistyp wie der Ausgangstyp (Text ↔ E-Mail ↔ Datum).
 *
 * Wechsel darüber hinaus sind nicht verboten, nur nicht verlustfrei — die
 * Oberfläche bietet sie getrennt an und fragt vorher nach, was dabei
 * wegfällt (siehe `wechselFolgen`).
 */
export function kompatibleFeldtypen(feldtypId: string): FieldTypeDefinition[] {
  const basis = getFieldType(feldtypId).schema.type;
  return FIELD_TYPE_CATALOG.filter(
    (ft) => !ft.isStructural && ft.schema.type === basis,
  );
}
