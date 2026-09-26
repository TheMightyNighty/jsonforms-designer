/**
 * Bausteine: vorgefertigte Feldgruppen, die als benannte Gruppe in einem
 * Schritt eingefügt werden.
 *
 * Die Formularredakteurin denkt nicht in Feldtypen, sondern in Abschnitten
 * („Antragsteller", „Anschrift"). Ein Baustein ist genau das: ein benannter
 * Container mit mehreren Feldern samt Hilfetexten und Pflichtangaben,
 * optional mit `x-fim-id` an den Feldern.
 *
 * Eingefügt werden Bausteine über dieselbe Action wie FIM-Datenfeldgruppen
 * (`ADD_FIM_GRUPPE`) — es gibt bewusst keinen zweiten Einfügepfad.
 *
 * [RÜCKFRAGE AN FABLE: Die fachlichen Inhalte der drei Bausteine sind nicht
 * abgestimmt. Sie sind deshalb als „Beispiel" gekennzeichnet (`istBeispiel`)
 * und in der Palette sichtbar so markiert. Welche Felder, Hilfetexte,
 * Pflichtangaben und FIM-Kennungen sollen die Bausteine „Antragsteller",
 * „Anschrift" und „Bankverbindung" tragen? Und soll der Katalog fest im
 * Editor liegen oder wie FIM/OpenCode über einen Dienst kommen?]
 */
import { JsonSchema7 } from '@jsonforms/core';

import {
  AddFimGruppeAction,
  createAddFimGruppeAction,
} from '../core/model/addFieldActions';

/** DnD-Typ der Baustein-Palette — getrennt von FIELD_TYPE und FIM. */
export const BAUSTEIN_DND_TYPE = 'BAUSTEIN' as const;

export interface BausteinDragItem {
  dndType: typeof BAUSTEIN_DND_TYPE;
  bausteinId: string;
}

export interface BausteinFeld {
  /** Property-Schlüssel-Vorschlag; Konflikte löst der Reducer auf. */
  propertyKey: string;
  label: string;
  schemaFragment: JsonSchema7 & { title?: string; description?: string };
  uiSchemaOptions?: Record<string, unknown>;
}

export interface Baustein {
  id: string;
  name: string;
  beschreibung: string;
  /** Tabler-Symbolname ohne `ti-`-Präfix. */
  icon: string;
  /**
   * true, solange die fachlichen Inhalte nicht abgestimmt sind. Die Palette
   * kennzeichnet solche Bausteine sichtbar als Beispiel.
   */
  istBeispiel: boolean;
  felder: BausteinFeld[];
}

/** Kurzform für ein Pflicht-Textfeld im Baustein-Katalog. */
function text(
  propertyKey: string,
  label: string,
  optionen: { pflicht?: boolean; hilfetext?: string } = {},
): BausteinFeld {
  return {
    propertyKey,
    label,
    schemaFragment: {
      type: 'string',
      title: label,
      ...(optionen.hilfetext ? { description: optionen.hilfetext } : {}),
    },
    uiSchemaOptions: optionen.pflicht ? { required: true } : undefined,
  };
}

export const BAUSTEIN_KATALOG: Baustein[] = [
  {
    id: 'baustein-antragsteller',
    name: 'Antragsteller',
    beschreibung: 'Name und Geburtsdatum der antragstellenden Person',
    icon: 'user',
    istBeispiel: true,
    felder: [
      text('anrede', 'Anrede'),
      text('vorname', 'Vorname', { pflicht: true }),
      text('nachname', 'Nachname', { pflicht: true }),
      {
        propertyKey: 'geburtsdatum',
        label: 'Geburtsdatum',
        schemaFragment: {
          type: 'string',
          format: 'date',
          title: 'Geburtsdatum',
        },
      },
    ],
  },
  {
    id: 'baustein-anschrift',
    name: 'Anschrift',
    beschreibung: 'Straße, Hausnummer, Postleitzahl und Ort',
    icon: 'home',
    istBeispiel: true,
    felder: [
      text('strasse', 'Straße', { pflicht: true }),
      text('hausnummer', 'Hausnummer', { pflicht: true }),
      {
        propertyKey: 'plz',
        label: 'Postleitzahl',
        schemaFragment: {
          type: 'string',
          title: 'Postleitzahl',
          pattern: '^[0-9]{5}$',
          description: 'Fünfstellig',
        },
      },
      text('ort', 'Ort', { pflicht: true }),
    ],
  },
  {
    id: 'baustein-bankverbindung',
    name: 'Bankverbindung',
    beschreibung: 'Kontoinhaberin oder Kontoinhaber und IBAN',
    icon: 'building-bank',
    istBeispiel: true,
    felder: [
      text('kontoinhaber', 'Kontoinhaberin / Kontoinhaber', { pflicht: true }),
      {
        propertyKey: 'iban',
        label: 'IBAN',
        schemaFragment: {
          type: 'string',
          title: 'IBAN',
          pattern: '^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$',
          description: 'Internationale Bankkontonummer',
        },
        uiSchemaOptions: { placeholder: 'DE89 3704 0044 0532 0130 00' },
      },
    ],
  },
];

export function getBaustein(id: string): Baustein {
  const gefunden = BAUSTEIN_KATALOG.find((b) => b.id === id);
  if (!gefunden) throw new Error(`Unbekannter Baustein: "${id}"`);
  return gefunden;
}

/**
 * Action zum Einfügen eines Bausteins — gemeinsame Logik für den Drop-Pfad
 * (Maus) und den Tastatur-Pfad (Enter/Leertaste). Nutzt dieselbe Action wie
 * FIM-Datenfeldgruppen.
 */
export function createBausteinAction(
  baustein: Baustein,
  insertAfterScope?: string,
  tabIndex?: number,
): AddFimGruppeAction {
  return createAddFimGruppeAction({
    gruppenName: baustein.name,
    insertAfterScope,
    tabIndex,
    felder: baustein.felder.map((feld) => ({
      propertyKey: feld.propertyKey,
      schemaFragment: feld.schemaFragment,
      uiSchemaOptions: feld.uiSchemaOptions,
      label: feld.label,
    })),
  });
}
