/**
 * Anzeigetexte und regionale Vorgaben zu einem Feldtyp (ADR 0007).
 *
 * Der Katalog in `fieldTypes.ts` kennt nur Struktur. Wer einen Feldtyp
 * anzeigt oder einfügt, holt Name, Vorgabe-Label und Erläuterung hier — die
 * Texte kommen aus i18n, der Platzhalter aus dem Regionsprofil.
 */
import { EditorTranslations } from '../i18n/types';
import { Regionsprofil } from '../region/regionsprofil';
import { FieldTypeDefinition } from './fieldTypes';

export interface FeldtypTexte {
  name: string;
  label: string;
  beschreibung: string;
}

/**
 * Fehlt die Übersetzung, steht die id da. Absichtlich: „text-short" in der
 * Palette fällt auf und wird gemeldet; ein stillschweigend englischer Text in
 * einem deutschen Editor fällt niemandem auf.
 */
export function feldtypTexte(
  t: EditorTranslations,
  feldtypId: string,
): FeldtypTexte {
  return (
    t.feldtypen[feldtypId] ?? {
      name: feldtypId,
      label: feldtypId,
      beschreibung: '',
    }
  );
}

export function feldtypGruppenName(t: EditorTranslations, gruppe: string) {
  return (t.palette.groups as Record<string, string>)[gruppe] ?? gruppe;
}

/**
 * Der Feldtyp, wie er in dieser Region gilt: Platzhalter mit Länderkennung,
 * engeres Muster. Ohne Profil bleibt die Definition unverändert.
 */
export function feldtypFuerRegion(
  definition: FieldTypeDefinition,
  region?: Regionsprofil,
): FieldTypeDefinition {
  const platzhalter = region?.platzhalter?.[definition.id];
  const muster = region?.muster?.[definition.id];
  if (!platzhalter && !muster) return definition;
  return {
    ...definition,
    schema: muster
      ? { ...definition.schema, pattern: muster }
      : definition.schema,
    uiSchema: platzhalter
      ? {
          ...definition.uiSchema,
          options: { ...definition.uiSchema.options, placeholder: platzhalter },
        }
      : definition.uiSchema,
  };
}
