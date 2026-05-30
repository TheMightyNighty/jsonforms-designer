
export type OpenCodeBausteinKategorie = 'validator' | 'ui-baustein';

export interface OpenCodeBaustein {
  id: string;
  displayName: string;
  description: string;
  kategorie: OpenCodeBausteinKategorie;
  icon: string;
  parameters?: Record<string, {
    label: string;
    type: 'string' | 'number' | 'boolean';
    default?: unknown;
  }>;
}

export interface OpenCodeService {
  getBausteine(): Promise<OpenCodeBaustein[]>;
  getBausteineByKategorie(kategorie: OpenCodeBausteinKategorie): Promise<OpenCodeBaustein[]>;
}
