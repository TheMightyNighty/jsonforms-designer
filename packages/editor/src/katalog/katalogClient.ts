/**
 * HTTP-Client für die Redaktions-API eines Formularkatalogs
 * (VSP: `/api/v1/katalog`). Der Host liefert das Zugriffstoken; der
 * Editor selbst kennt kein OIDC.
 */

export interface KatalogRechte {
  lesen: boolean;
  redaktion: boolean;
  freigabe: boolean;
}

export interface KatalogEntwurfStand {
  version: number;
  bearbeitet_von: string;
  bearbeitet_am: string;
}

export interface KatalogUebersicht {
  kennung: string;
  titel: string;
  bereich_id: string | null;
  aktuelle_version: number | null;
  entwurf: KatalogEntwurfStand | null;
  rechte: KatalogRechte;
}

export interface KatalogIch {
  sub: string;
  name: string;
  mandant: string;
  mandanten_admin: boolean;
}

export interface KatalogInhalt {
  schema: object;
  uischema: object;
  data?: object;
  editor_state?: unknown;
}

export interface KatalogVersion extends KatalogInhalt {
  version: number;
  status: 'entwurf' | 'freigegeben' | 'ausser_kraft';
  bearbeitet_von: string;
  bearbeitet_am: string;
}

/** Fehler der Redaktions-API mit HTTP-Status und Meldung des Servers. */
export class KatalogFehler extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details: string[] = [],
  ) {
    super(message);
    this.name = 'KatalogFehler';
  }
}

export interface KatalogClientOptionen {
  /** Basisadresse der Redaktions-API, z. B. `/katalog-api`. */
  basisUrl: string;
  /** Liefert ein gültiges Zugriffstoken (Bearer). */
  token: () => Promise<string>;
  fetchFn?: typeof fetch;
}

export class KatalogClient {
  constructor(private readonly optionen: KatalogClientOptionen) {}

  ich(): Promise<KatalogIch> {
    return this.anfrage('GET', '/ich');
  }

  async liste(): Promise<KatalogUebersicht[]> {
    const antwort = await this.anfrage<{ formulare: KatalogUebersicht[] }>(
      'GET',
      '/formulare',
    );
    return antwort.formulare;
  }

  anlegen(kennung: string, titel: string): Promise<unknown> {
    return this.anfrage('POST', '/formulare', { kennung, titel });
  }

  entwurf(kennung: string): Promise<KatalogVersion> {
    return this.anfrage('GET', `${this.pfad(kennung)}/entwurf`);
  }

  version(kennung: string, version: number): Promise<KatalogVersion> {
    return this.anfrage('GET', `${this.pfad(kennung)}/versionen/${version}`);
  }

  entwurfSpeichern(
    kennung: string,
    inhalt: KatalogInhalt,
  ): Promise<{ version: number }> {
    return this.anfrage('PUT', `${this.pfad(kennung)}/entwurf`, inhalt);
  }

  freigeben(
    kennung: string,
    gueltigAb?: Date,
  ): Promise<{ version: number; gueltig_ab: string }> {
    return this.anfrage(
      'POST',
      `${this.pfad(kennung)}/entwurf/freigeben`,
      gueltigAb ? { gueltig_ab: gueltigAb.toISOString() } : {},
    );
  }

  private pfad(kennung: string): string {
    return `/formulare/${encodeURIComponent(kennung)}`;
  }

  private async anfrage<T>(
    methode: string,
    pfad: string,
    body?: unknown,
  ): Promise<T> {
    const fetchFn = this.optionen.fetchFn ?? fetch;
    const token = await this.optionen.token();
    const res = await fetchFn(this.optionen.basisUrl + pfad, {
      method: methode,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const json = text ? (JSON.parse(text) as unknown) : undefined;
    if (!res.ok) {
      const fehler = json as { error?: string; details?: string[] } | undefined;
      throw new KatalogFehler(
        res.status,
        fehler?.error ?? `HTTP ${res.status}`,
        fehler?.details ?? [],
      );
    }
    return json as T;
  }
}
