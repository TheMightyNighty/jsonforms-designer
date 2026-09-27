/**
 * Default-Katalog: drei Beispiel-Bausteine für Entwicklung und Vorführung —
 * über `EditorConfig.modules.bausteine.service` gegen den echten Katalog
 * einer Behörde austauschbar (ADR 0005).
 *
 * [RÜCKFRAGE AN FABLE: Die fachlichen Inhalte sind nicht abgestimmt. Sie
 * tragen deshalb `istBeispiel: true` und erscheinen in der Palette sichtbar
 * als Beispiel. Welche Felder, Hilfetexte, Pflichtangaben und FIM-Kennungen
 * sollen „Antragsteller", „Anschrift" und „Bankverbindung" tragen — und wer
 * betreibt den Katalog, aus dem sie künftig kommen?]
 */
import { Baustein, BausteinService } from './bausteinService';

/** Kurzform für ein Textfeld im Beispiel-Katalog. */
function text(
  propertyKey: string,
  label: string,
  optionen: { pflicht?: boolean; hilfetext?: string } = {},
): Baustein['felder'][number] {
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

export const BEISPIEL_BAUSTEINE: Baustein[] = [
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

export class MockBausteinService implements BausteinService {
  async getBausteine(): Promise<Baustein[]> {
    return Promise.resolve(BEISPIEL_BAUSTEINE);
  }
}

export const defaultBausteinService = new MockBausteinService();
