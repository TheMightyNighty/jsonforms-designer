/**
 * Migration von Alt-Beständen beim Laden (OFM-R-304, OFM-R-421):
 *
 * - Formular-Metadaten, die frühere Versionen als x-publisher/x-legal-basis/
 *   x-version/x-valid-from ins schema.json geschrieben haben, ziehen in den
 *   Manifest-Datenhalter um und werden aus dem Schema entfernt.
 * - Abschnittsfarben mit Hex-Werten werden auf die sechs Registry-Token
 *   normalisiert.
 *
 * x-fim-id/x-fim-version/x-codelist-id bleiben unangetastet am Feld.
 */
import { FieldAwareState } from '../model/addFieldReducer';
import { emptyManifestMeta, FormManifestMeta } from '../model/manifestMeta';
import {
  isSectionColorToken,
  legacyColorToToken,
} from '../model/sectionColorTokens';
import { UiElement } from '../model/uiElements';

const LEGACY_SCHEMA_META_KEYS: Record<string, keyof FormManifestMeta> = {
  'x-publisher': 'publisher',
  'x-legal-basis': 'legalBasis',
  'x-version': 'version',
  'x-valid-from': 'validFrom',
};

export interface MigrationResult {
  state: FieldAwareState;
  /** true, wenn Metadaten aus dem Schema in den Manifest-Zustand umgezogen sind. */
  migratedMetadata: boolean;
}

export function migrateLegacyFieldState(
  state: FieldAwareState,
): MigrationResult {
  let migratedMetadata = false;

  let schema = state.schema;
  let manifestMeta: FormManifestMeta = {
    ...emptyManifestMeta,
    ...state.manifestMeta,
  };

  const legacyKeys = Object.keys(LEGACY_SCHEMA_META_KEYS).filter((k) =>
    Object.prototype.hasOwnProperty.call(schema, k),
  );
  if (legacyKeys.length > 0) {
    migratedMetadata = true;
    const cleaned = { ...(schema as Record<string, unknown>) };
    for (const key of legacyKeys) {
      const target = LEGACY_SCHEMA_META_KEYS[key];
      const value = cleaned[key];
      if (!manifestMeta[target] && typeof value === 'string') {
        manifestMeta = { ...manifestMeta, [target]: value };
      }
      delete cleaned[key];
    }
    schema = cleaned as FieldAwareState['schema'];
  }

  let sectionColors = state.sectionColors;
  // ofm:sectionColor aus importierten Group-Options in den Farb-Zustand heben.
  const importedColors = collectSectionColorOptions(state.uiSchema.elements);
  const needsColorImport = Object.keys(importedColors).some(
    (k) => !(k in sectionColors),
  );
  const needsColorMigration =
    Object.values(sectionColors).some((v) => !isSectionColorToken(v)) ||
    needsColorImport;
  if (needsColorMigration) {
    sectionColors = Object.fromEntries(
      Object.entries({ ...importedColors, ...sectionColors }).map(([k, v]) => [
        k,
        legacyColorToToken(v),
      ]),
    );
  }

  if (!migratedMetadata && !needsColorMigration && state.manifestMeta) {
    return { state, migratedMetadata };
  }

  return {
    state: { ...state, schema, manifestMeta, sectionColors },
    migratedMetadata,
  };
}

function collectSectionColorOptions(
  elements: UiElement[],
): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (els: UiElement[]) => {
    for (const el of els) {
      const token = el.options?.['ofm:sectionColor'];
      if (typeof token === 'string' && isSectionColorToken(token)) {
        out[el.id] = token;
      }
      if (el.type === 'GroupContainer') walk(el.children);
      if (el.type === 'ColumnContainer') el.columns.forEach(walk);
    }
  };
  walk(elements);
  return out;
}

/** Prüft rohe Import-/Storage-Daten auf migrationsbedürftige Alt-Metadaten. */
export function hasLegacySchemaMetadata(schema: unknown): boolean {
  if (!schema || typeof schema !== 'object') return false;
  return Object.keys(LEGACY_SCHEMA_META_KEYS).some((k) =>
    Object.prototype.hasOwnProperty.call(schema, k),
  );
}
