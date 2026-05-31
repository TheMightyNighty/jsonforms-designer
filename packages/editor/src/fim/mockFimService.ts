import { FimDatenfeld, FimDatenfeldgruppe, FimService } from './fimService';

const GESCHLECHT_WERTE = [
  { code: 'M', name: 'männlich' },
  { code: 'W', name: 'weiblich' },
  { code: 'D', name: 'divers' },
  { code: 'U', name: 'unbekannt' },
];

const STAAT_WERTE = [
  { code: 'DE', name: 'Deutschland' },
  { code: 'AT', name: 'Österreich' },
  { code: 'CH', name: 'Schweiz' },
  { code: 'FR', name: 'Frankreich' },
  { code: 'IT', name: 'Italien' },
  { code: 'NL', name: 'Niederlande' },
  { code: 'PL', name: 'Polen' },
  { code: 'ES', name: 'Spanien' },
  { code: 'XX', name: 'Sonstiger Staat' },
];

// ---------------------------------------------------------------------------
// Datenfelder
// ---------------------------------------------------------------------------

export const MOCK_DATENFELDER: FimDatenfeld[] = [
  {
    identifier: 'F60000004',
    name: 'Familienname',
    beschreibung: 'Familienname (Nachname) einer natürlichen Person',
    datentyp: 'text',
    einschraenkungen: { minLength: 1, maxLength: 120 },
  },
  {
    identifier: 'F60000006',
    name: 'Vorname',
    beschreibung: 'Alle Vornamen einer natürlichen Person, durch Leerzeichen getrennt',
    datentyp: 'text',
    einschraenkungen: { minLength: 1, maxLength: 120 },
  },
  {
    identifier: 'F60000007',
    name: 'Geburtsname',
    beschreibung: 'Geburtsname (Familienname vor erster Heirat), sofern abweichend',
    datentyp: 'text',
    einschraenkungen: { maxLength: 120 },
  },
  {
    identifier: 'F60000010',
    name: 'Geburtsdatum',
    beschreibung: 'Datum der Geburt einer natürlichen Person (ISO 8601)',
    datentyp: 'datum',
  },
  {
    identifier: 'F60000016',
    name: 'Geburtsort',
    beschreibung: 'Ort, an dem die Person geboren wurde',
    datentyp: 'text',
    einschraenkungen: { maxLength: 100 },
  },
  {
    identifier: 'F60000028',
    name: 'Staatsangehörigkeit',
    beschreibung: 'Staatsangehörigkeit gemäß ISO 3166-1 Alpha-2',
    datentyp: 'codeliste',
    codelisteWerte: STAAT_WERTE,
  },
  {
    identifier: 'F60000059',
    name: 'Geschlecht',
    beschreibung: 'Geschlecht einer natürlichen Person',
    datentyp: 'codeliste',
    codelisteWerte: GESCHLECHT_WERTE,
  },
  {
    identifier: 'F60000072',
    name: 'Steueridentifikationsnummer',
    beschreibung: 'Steuerliche Identifikationsnummer (11-stellig, vergeben durch das BZSt)',
    datentyp: 'text',
    einschraenkungen: { minLength: 11, maxLength: 11, pattern: '^[0-9]{11}$' },
  },
  {
    identifier: 'F60000081',
    name: 'Straße',
    beschreibung: 'Straßenname der Postanschrift ohne Hausnummer',
    datentyp: 'text',
    einschraenkungen: { maxLength: 120 },
  },
  {
    identifier: 'F60000082',
    name: 'Hausnummer',
    beschreibung: 'Hausnummer einschließlich Zusatz (z. B. „12a")',
    datentyp: 'text',
    einschraenkungen: { maxLength: 10 },
  },
  {
    identifier: 'F60000083',
    name: 'Postleitzahl',
    beschreibung: 'Deutsche Postleitzahl (5-stellig)',
    datentyp: 'text',
    einschraenkungen: { minLength: 5, maxLength: 5, pattern: '^[0-9]{5}$' },
  },
  {
    identifier: 'F60000084',
    name: 'Ort',
    beschreibung: 'Ortsname der Postanschrift',
    datentyp: 'text',
    einschraenkungen: { maxLength: 80 },
  },
  {
    identifier: 'F60000085',
    name: 'Staat',
    beschreibung: 'Staat der Anschrift gemäß ISO 3166-1 Alpha-2',
    datentyp: 'codeliste',
    codelisteWerte: STAAT_WERTE,
  },
  {
    identifier: 'F60000090',
    name: 'E-Mail-Adresse',
    beschreibung: 'Elektronische Postadresse (RFC 5321)',
    datentyp: 'text',
    einschraenkungen: { maxLength: 255 },
  },
  {
    identifier: 'F60000091',
    name: 'Telefonnummer',
    beschreibung: 'Rufnummer in internationaler Schreibweise (E.164-Format empfohlen)',
    datentyp: 'text',
    einschraenkungen: { maxLength: 25, pattern: '^[+0-9 ()\\-\\/]+$' },
  },
  {
    identifier: 'F60000100',
    name: 'IBAN',
    beschreibung: 'Internationale Bankkontonummer (ISO 13616)',
    datentyp: 'text',
    einschraenkungen: { minLength: 15, maxLength: 34, pattern: '^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$' },
  },
  {
    identifier: 'F60000101',
    name: 'BIC',
    beschreibung: 'Bank Identifier Code (ISO 9362)',
    datentyp: 'text',
    einschraenkungen: { minLength: 8, maxLength: 11, pattern: '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$' },
  },
  {
    identifier: 'F60000105',
    name: 'Geldbetrag',
    beschreibung: 'Geldbetrag in Euro (nicht-negativ, 2 Dezimalstellen)',
    datentyp: 'dezimalzahl',
    einschraenkungen: { minimum: 0 },
  },
  {
    identifier: 'F60000110',
    name: 'Aktenzeichen',
    beschreibung: 'Behördeninternes Aktenzeichen zur Vorgangsidentifikation',
    datentyp: 'text',
    einschraenkungen: { maxLength: 50 },
  },
  {
    identifier: 'F60000115',
    name: 'Freitext',
    beschreibung: 'Unstrukturierter Freitext (z. B. Begründungen, Anmerkungen)',
    datentyp: 'text',
    einschraenkungen: { maxLength: 5000 },
  },
];

// ---------------------------------------------------------------------------
// Datenfeldgruppen
// ---------------------------------------------------------------------------

function byId(...ids: string[]): FimDatenfeld[] {
  return ids.map((id) => {
    const f = MOCK_DATENFELDER.find((d) => d.identifier === id);
    if (!f) throw new Error(`Mock: Datenfeld ${id} nicht gefunden`);
    return f;
  });
}

export const MOCK_DATENFELDGRUPPEN: FimDatenfeldgruppe[] = [
  {
    identifier: 'G60000001',
    name: 'Natürliche Person',
    beschreibung: 'Personenidentifizierende Daten einer natürlichen Person',
    felder: byId('F60000004', 'F60000006', 'F60000007', 'F60000010', 'F60000059', 'F60000028'),
  },
  {
    identifier: 'G60000002',
    name: 'Inlandsanschrift',
    beschreibung: 'Vollständige Postanschrift innerhalb Deutschlands',
    felder: byId('F60000081', 'F60000082', 'F60000083', 'F60000084'),
  },
  {
    identifier: 'G60000003',
    name: 'Bankverbindung',
    beschreibung: 'SEPA-Bankverbindung (IBAN + BIC)',
    felder: byId('F60000100', 'F60000101'),
  },
  {
    identifier: 'G60000004',
    name: 'Kontaktdaten',
    beschreibung: 'Elektronische Erreichbarkeit (E-Mail und Telefon)',
    felder: byId('F60000090', 'F60000091'),
  },
];

// ---------------------------------------------------------------------------
// Mock-Service
// ---------------------------------------------------------------------------

function matchesSuche(text: string, suchbegriff: string): boolean {
  return text.toLowerCase().includes(suchbegriff.toLowerCase());
}

export class MockFimService implements FimService {
  readonly serverSideSearch = false;

  async getDatenfelder(suchbegriff = ''): Promise<FimDatenfeld[]> {
    if (!suchbegriff.trim()) return MOCK_DATENFELDER;
    return MOCK_DATENFELDER.filter(
      (f) =>
        matchesSuche(f.name, suchbegriff) ||
        matchesSuche(f.identifier, suchbegriff) ||
        matchesSuche(f.beschreibung, suchbegriff)
    );
  }

  async getDatenfeldgruppen(suchbegriff = ''): Promise<FimDatenfeldgruppe[]> {
    if (!suchbegriff.trim()) return MOCK_DATENFELDGRUPPEN;
    return MOCK_DATENFELDGRUPPEN.filter(
      (g) =>
        matchesSuche(g.name, suchbegriff) ||
        matchesSuche(g.identifier, suchbegriff) ||
        g.felder.some((f) => matchesSuche(f.name, suchbegriff))
    );
  }
}

export const defaultMockFimService = new MockFimService();
