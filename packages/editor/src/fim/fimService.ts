export type FimDatentyp =
  | 'text'
  | 'ganzzahl'
  | 'dezimalzahl'
  | 'datum'
  | 'datumZeit'
  | 'boolean'
  | 'codeliste';

export interface FimEinschraenkungen {
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

export interface FimCodelisteWert {
  code: string;
  name: string;
}

export interface FimDatenfeld {
  identifier: string;
  name: string;
  beschreibung: string;
  datentyp: FimDatentyp;
  einschraenkungen?: FimEinschraenkungen;
  codelisteWerte?: FimCodelisteWert[];
}

export interface FimDatenfeldgruppe {
  identifier: string;
  name: string;
  beschreibung: string;
  felder: FimDatenfeld[];
}

export interface FimQueryOptions {
  limit?: number;
  offset?: number;
}

export interface FimService {
  getDatenfelder(suchbegriff?: string, options?: FimQueryOptions): Promise<FimDatenfeld[]>;
  getDatenfeldgruppen(suchbegriff?: string, options?: FimQueryOptions): Promise<FimDatenfeldgruppe[]>;
  /**
   * Liefert true wenn der Service server-seitige Suche nutzt.
   * Die Palette zeigt dann "Bitte suchen" statt alle Felder zu laden.
   */
  readonly serverSideSearch?: boolean;
}
