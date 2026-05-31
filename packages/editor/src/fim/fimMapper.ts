import { FieldSchemaFragment, FieldUiSchemaFragment } from '../field-types/fieldTypes';
import { FimDatenfeld, FimDatenfeldgruppe, FimDatentyp } from './fimService';

export interface FimFeldMapping {
  propertyKey: string;
  schema: FieldSchemaFragment;
  uiSchemaOptions: Record<string, unknown>;
}

export interface FimGruppeMapping {
  propertyKey: string;
  felder: FimFeldMapping[];
}

function datentyp2JsonType(datentyp: FimDatentyp): string {
  switch (datentyp) {
    case 'text':        return 'string';
    case 'ganzzahl':    return 'integer';
    case 'dezimalzahl': return 'number';
    case 'datum':       return 'string';
    case 'datumZeit':   return 'string';
    case 'boolean':     return 'boolean';
    case 'codeliste':   return 'string';
  }
}

function identifierToKey(identifier: string): string {
  return identifier.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export function mapDatenfeld(feld: FimDatenfeld): FimFeldMapping {
  const jsonType = datentyp2JsonType(feld.datentyp);
  const schema = {
    type: jsonType,
    title: feld.name,
    description: feld.beschreibung || undefined,
    ...(feld.datentyp === 'datum'     && { format: 'date' }),
    ...(feld.datentyp === 'datumZeit' && { format: 'date-time' }),
    ...(feld.datentyp === 'codeliste' && feld.codelisteWerte?.length
      ? { enum: feld.codelisteWerte.map((w) => w.code) }
      : {}),
    ...(feld.einschraenkungen?.minLength != null && { minLength: feld.einschraenkungen.minLength }),
    ...(feld.einschraenkungen?.maxLength != null && { maxLength: feld.einschraenkungen.maxLength }),
    ...(feld.einschraenkungen?.minimum  != null && { minimum:   feld.einschraenkungen.minimum }),
    ...(feld.einschraenkungen?.maximum  != null && { maximum:   feld.einschraenkungen.maximum }),
    ...(feld.einschraenkungen?.pattern            && { pattern:   feld.einschraenkungen.pattern }),
    'x-fim-id': feld.identifier,
  } as FieldSchemaFragment;

  const isLongText =
    feld.datentyp === 'text' && (feld.einschraenkungen?.maxLength ?? 0) > 500;

  const uiSchemaOptions: Record<string, unknown> = isLongText ? { multi: true } : {};

  return {
    propertyKey: identifierToKey(feld.identifier),
    schema,
    uiSchemaOptions,
  };
}

export function mapDatenfeldgruppe(gruppe: FimDatenfeldgruppe): FimGruppeMapping {
  return {
    propertyKey: identifierToKey(gruppe.identifier),
    felder: gruppe.felder.map(mapDatenfeld),
  };
}

/** Erzeugt ein vollständiges JSONSchema-object-Fragment für eine Datenfeldgruppe. */
export function gruppeToObjectSchema(
  gruppe: FimDatenfeldgruppe,
  mapping: FimGruppeMapping
): FieldSchemaFragment {
  const properties: Record<string, FieldSchemaFragment> = {};
  for (const fm of mapping.felder) {
    properties[fm.propertyKey] = fm.schema;
  }
  return {
    type: 'object',
    title: gruppe.name,
    description: gruppe.beschreibung || undefined,
    properties,
    'x-fim-id': gruppe.identifier,
  } as FieldSchemaFragment;
}

/** Erzeugt ein UISchema-VerticalLayout für alle Felder einer Gruppe. */
export function gruppeToUiSchema(
  mapping: FimGruppeMapping,
  baseScopePath: string
): Omit<FieldUiSchemaFragment, 'scope'> {
  return {
    type: 'VerticalLayout',
    elements: mapping.felder.map((fm) => ({
      type: 'Control' as const,
      scope: `${baseScopePath}/properties/${fm.propertyKey}`,
      options: fm.uiSchemaOptions,
    })),
  } as Omit<FieldUiSchemaFragment, 'scope'>;
}
