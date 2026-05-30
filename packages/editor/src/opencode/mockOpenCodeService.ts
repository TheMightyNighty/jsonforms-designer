/** Hardcoded example components for development — swap via dependency injection in production. */
import { OpenCodeBaustein, OpenCodeBausteinKategorie, OpenCodeService } from './openCodeService';

const MOCK_BAUSTEINE: OpenCodeBaustein[] = [
  // ── Validatoren ──────────────────────────────────────────────────────────
  {
    id: 'oc-val-email',
    displayName: 'E-Mail validieren',
    description: 'Prüft Syntax und MX-Record der E-Mail-Adresse',
    kategorie: 'validator',
    icon: 'mail-check',
  },
  {
    id: 'oc-val-iban',
    displayName: 'IBAN prüfen',
    description: 'Prüft Prüfziffer und Länderformat der IBAN',
    kategorie: 'validator',
    icon: 'building-bank',
  },
  {
    id: 'oc-val-plz',
    displayName: 'Postleitzahl D',
    description: 'Validiert 5-stellige deutsche Postleitzahl',
    kategorie: 'validator',
    icon: 'map-pin',
  },
  {
    id: 'oc-val-phone',
    displayName: 'Telefonnummer',
    description: 'Internationale Telefonnummer (E.164)',
    kategorie: 'validator',
    icon: 'phone',
  },
  {
    id: 'oc-val-tax-id',
    displayName: 'Steuer-ID',
    description: 'Deutsche Steueridentifikationsnummer (11 Stellen)',
    kategorie: 'validator',
    icon: 'receipt-tax',
  },
  // ── UI-Bausteine ─────────────────────────────────────────────────────────
  {
    id: 'oc-ui-personen',
    displayName: 'Personen hinzufügen',
    description: 'Dynamische Liste von Personen mit Plus/Minus-Steuerung',
    kategorie: 'ui-baustein',
    icon: 'users',
    parameters: {
      minItems: { label: 'Mindestanzahl', type: 'number', default: 1 },
      maxItems: { label: 'Maximalanzahl', type: 'number', default: 10 },
    },
  },
  {
    id: 'oc-ui-adresse',
    displayName: 'Adress-Widget',
    description: 'Vollständige Adresserfassung mit PLZ-Lookup',
    kategorie: 'ui-baustein',
    icon: 'home',
  },
  {
    id: 'oc-ui-dateiupload',
    displayName: 'Datei-Upload',
    description: 'Upload mit Dateityp-Prüfung und Größenlimit',
    kategorie: 'ui-baustein',
    icon: 'upload',
    parameters: {
      acceptedTypes: { label: 'Erlaubte Typen', type: 'string', default: '.pdf,.jpg,.png' },
      maxSizeMb: { label: 'Max. Größe (MB)', type: 'number', default: 10 },
    },
  },
  {
    id: 'oc-ui-signatur',
    displayName: 'Unterschrifts-Feld',
    description: 'Touch/Mouse-Signatur mit Base64-Ausgabe',
    kategorie: 'ui-baustein',
    icon: 'signature',
  },
];

export class MockOpenCodeService implements OpenCodeService {
  async getBausteine(): Promise<OpenCodeBaustein[]> {
    // Simuliert async API-Aufruf
    return Promise.resolve(MOCK_BAUSTEINE);
  }

  async getBausteineByKategorie(
    kategorie: OpenCodeBausteinKategorie
  ): Promise<OpenCodeBaustein[]> {
    return Promise.resolve(MOCK_BAUSTEINE.filter((b) => b.kategorie === kategorie));
  }
}

export const defaultOpenCodeService = new MockOpenCodeService();
