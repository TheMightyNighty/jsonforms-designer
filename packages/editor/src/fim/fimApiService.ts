import {
  FimDatenfeld,
  FimDatenfeldgruppe,
  FimDatentyp,
  FimQueryOptions,
  FimService,
} from './fimService';

// ---------------------------------------------------------------------------
// Datentyp-Mapping: FIM-Portal API → internes Modell
//
// Quellen: XDatenfelder-Standard 3.0.0 / fimportal.de API-Beobachtung
// ---------------------------------------------------------------------------

const DATENTYP_MAP: Record<string, FimDatentyp> = {
  // Datumstypen
  date:          'datum',
  datetime:      'datumZeit',
  date_time:     'datumZeit',
  // Numerische Typen
  integer:       'ganzzahl',
  num_int:       'ganzzahl',
  decimal:       'dezimalzahl',
  num_gk:        'dezimalzahl',
  number:        'dezimalzahl',
  // Bool
  boolean:       'boolean',
  bool:          'boolean',
  // Codeliste / Auswahl
  select:        'codeliste',
  codeliste:     'codeliste',
  code_list:     'codeliste',
  // Text (Fallback)
  text:          'text',
  string:        'text',
};

function mapDatentyp(apiValue: string | null | undefined, codeListId?: string | null): FimDatentyp {
  if (codeListId) return 'codeliste';
  if (!apiValue) return 'text';
  return DATENTYP_MAP[apiValue.toLowerCase()] ?? 'text';
}

// ---------------------------------------------------------------------------
// Response-Typen der FIM-Portal API (fimportal.de/api/v1)
// ---------------------------------------------------------------------------

interface FimPortalField {
  fim_id: string;
  fim_version: string;
  name: string;
  beschreibung?: string;
  definition?: string;
  datentyp?: string;
  feldart?: string;
  code_list_id?: string | null;
  freigabe_status?: number;
  freigabe_status_label?: string;
  is_latest?: boolean;
  [key: string]: unknown;
}

interface FimPortalGroup {
  fim_id: string;
  fim_version: string;
  name: string;
  beschreibung?: string;
  definition?: string;
  freigabe_status?: number;
  freigabe_status_label?: string;
  is_latest?: boolean;
  [key: string]: unknown;
}

interface FimPortalListResponse<T> {
  items: T[];
  offset: number;
  limit: number;
  count: number;
  total_count: number;
}

// ---------------------------------------------------------------------------
// Standard-Normalisierer für fimportal.de/api/v1
// ---------------------------------------------------------------------------

function normalizeFimPortalField(raw: FimPortalField): FimDatenfeld {
  return {
    identifier:   raw.fim_id,
    name:         raw.name ?? raw.fim_id,
    beschreibung: raw.beschreibung ?? raw.definition ?? '',
    datentyp:     mapDatentyp(raw.datentyp, raw.code_list_id),
    // Einschränkungen und Codelisten-Werte sind im List-Endpoint nicht enthalten.
    // Sie können via /fields/{fim_id}/{version} nachgeladen werden.
  };
}

function normalizeFimPortalGroup(raw: FimPortalGroup): FimDatenfeldgruppe {
  return {
    identifier:   raw.fim_id,
    name:         raw.name ?? raw.fim_id,
    beschreibung: raw.beschreibung ?? raw.definition ?? '',
    felder:       [],   // Felder werden bei Bedarf nachgeladen
  };
}

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------

export interface FimApiEndpoints {
  /** Default: '/fields' */
  datenfelder?: string;
  /** Default: '/groups' */
  datenfeldgruppen?: string;
}

export interface FimApiOptions {
  /**
   * Basis-URL der FIM-Portal API.
   * Default: 'https://fimportal.de/api/v1'
   */
  baseUrl?: string;
  endpoints?: FimApiEndpoints;
  /** HTTP-Header (z. B. Authorization). */
  headers?: Record<string, string>;
  /**
   * Query-Parameter für die Textsuche.
   * Default: 'name' (fimportal.de-Verhalten)
   */
  searchParam?: string;
  /**
   * Maximale Anzahl Ergebnisse pro Request.
   * Default: 100
   */
  pageSize?: number;
  /** Custom Normalisierer für Datenfelder */
  normalizeDatenfeld?: (raw: Record<string, unknown>) => FimDatenfeld;
  /** Custom Normalisierer für Datenfeldgruppen */
  normalizeDatenfeldgruppe?: (raw: Record<string, unknown>) => FimDatenfeldgruppe;
}

// ---------------------------------------------------------------------------
// FimApiService
// ---------------------------------------------------------------------------

export class FimApiService implements FimService {
  readonly serverSideSearch = true;

  private readonly baseUrl: string;
  private readonly endpoints: Required<FimApiEndpoints>;
  private readonly headers: Record<string, string>;
  private readonly searchParam: string;
  private readonly pageSize: number;
  private readonly normFeld: (raw: Record<string, unknown>) => FimDatenfeld;
  private readonly normGruppe: (raw: Record<string, unknown>) => FimDatenfeldgruppe;

  constructor(options: FimApiOptions = {}) {
    // SECURITY: `baseUrl` and `headers` must come from trusted configuration
    // only. `headers` (e.g. an Authorization token) is sent with every request
    // to `baseUrl`; deriving either from untrusted/user-controlled input would
    // allow SSRF and credential exfiltration to an attacker-chosen host.
    this.baseUrl     = (options.baseUrl ?? 'https://fimportal.de/api/v1').replace(/\/$/, '');
    this.endpoints   = {
      datenfelder:      options.endpoints?.datenfelder      ?? '/fields',
      datenfeldgruppen: options.endpoints?.datenfeldgruppen ?? '/groups',
    };
    this.headers     = { 'Accept': 'application/json', ...options.headers };
    this.searchParam = options.searchParam ?? 'name';
    this.pageSize    = options.pageSize    ?? 100;
    this.normFeld    = (options.normalizeDatenfeld   as any) ?? ((r: Record<string, unknown>) => normalizeFimPortalField(r as FimPortalField));
    this.normGruppe  = (options.normalizeDatenfeldgruppe as any) ?? ((r: Record<string, unknown>) => normalizeFimPortalGroup(r as FimPortalGroup));
  }

  async getDatenfelder(suchbegriff = '', options?: FimQueryOptions): Promise<FimDatenfeld[]> {
    const url = this.buildUrl(this.endpoints.datenfelder, suchbegriff, options);
    const data = await this.fetchJson<FimPortalListResponse<FimPortalField>>(url);
    return this.extractItems(data).map((r) => this.normFeld(r as Record<string, unknown>));
  }

  async getDatenfeldgruppen(suchbegriff = '', options?: FimQueryOptions): Promise<FimDatenfeldgruppe[]> {
    const url = this.buildUrl(this.endpoints.datenfeldgruppen, suchbegriff, options);
    const data = await this.fetchJson<FimPortalListResponse<FimPortalGroup>>(url);
    return this.extractItems(data).map((r) => this.normGruppe(r as Record<string, unknown>));
  }

  private buildUrl(path: string, q: string, options?: FimQueryOptions): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (q.trim()) url.searchParams.set(this.searchParam, q.trim());
    url.searchParams.set('limit',  String(options?.limit  ?? this.pageSize));
    url.searchParams.set('offset', String(options?.offset ?? 0));
    return url.toString();
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`FIM API ${res.status}: ${res.statusText} (${url})`);
    return res.json() as Promise<T>;
  }

  private extractItems<T>(data: FimPortalListResponse<T> | T[] | unknown): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      if (Array.isArray(d['items'])) return d['items'] as T[];
      if (Array.isArray(d['data']))  return d['data']  as T[];
    }
    return [];
  }
}

// ---------------------------------------------------------------------------
// Vorkonfigurierte Instanz für fimportal.de
// ---------------------------------------------------------------------------

/** Direkte Anbindung an das öffentliche FIM-Portal ohne weitere Konfiguration. */
export const fimPortalService = new FimApiService();
