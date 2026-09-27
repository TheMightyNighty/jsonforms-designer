/**
 * Normalisierung eingehender Formular-Zustände.
 *
 * Eigenes Modul, damit sowohl der Persistenz-Adapter als auch die
 * Formular-Ablage (ADR 0006) darauf zugreifen können, ohne einen
 * Importzyklus zu bauen.
 */
import { FieldAwareState } from '../model/addFieldReducer';
import { emptyManifestMeta } from '../model/manifestMeta';
import { FlatElement, fromLegacy } from '../model/uiElements';
import { migrateLegacyFieldState } from '../util/legacyMetadataMigration';
import { sanitizeParsedJson } from '../util/sanitizeJson';

/**
 * Formt unvertraute Rohdaten (Datei-Import, localStorage, API-Antwort) in
 * einen vollständigen FieldAwareState: entfernt Prototype-Pollution-Schlüssel
 * und füllt fehlende Felder mit Defaults. `undefined`, wenn die Pflichtteile
 * (schema + uiSchema) fehlen.
 */
export const normalizeFieldState = (
  raw: unknown,
): FieldAwareState | undefined => {
  const parsed = sanitizeParsedJson(raw) as Partial<FieldAwareState> | null;
  if (!parsed?.schema || !parsed?.uiSchema) return undefined;
  return migrateLegacyFieldState({
    schema: parsed.schema,
    uiSchema: {
      type: parsed.uiSchema.type ?? 'VerticalLayout',
      elements: ((parsed.uiSchema.elements ?? []) as FlatElement[]).map(
        fromLegacy,
      ),
    },
    tabs: parsed.tabs ?? [],
    activeTabIndex: parsed.activeTabIndex ?? 0,
    tabAssignments: parsed.tabAssignments ?? {},
    lineNumbersEnabled: parsed.lineNumbersEnabled ?? false,
    typvorschlagIgnoriert: parsed.typvorschlagIgnoriert ?? {},
    sectionColors: parsed.sectionColors ?? {},
    manifestMeta: parsed.manifestMeta ?? { ...emptyManifestMeta },
  }).state;
};
