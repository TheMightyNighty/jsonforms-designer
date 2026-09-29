/**
 * Folgen eines Feldtyp-Wechsels.
 *
 * Ein Wechsel innerhalb desselben JSON-Basistyps (Text → E-Mail) ist
 * verlustfrei. Ein Wechsel darüber hinweg (Text → Ja/Nein) ist es nicht: Der
 * neue Typ erwartet eine andere Art von Antwort, und alles, was am alten Typ
 * hing — Auswahloptionen, Prüfungen, Bedingungen, die einen Wert vergleichen
 * — passt danach nicht mehr.
 *
 * Statt solche Wechsel zu verbieten, benennt diese Funktion die Folgen. Die
 * Oberfläche fragt damit vor dem Wechsel nach; der Reducer räumt hinterher
 * konsistent auf. Reine Funktion, damit die Aufzählung ohne Oberfläche
 * testbar ist.
 */
import { FieldAwareState } from '../core/model/addFieldReducer';
import { UiElement } from '../core/model/uiElements';
import {
  passtValidatorZuFeldtyp,
  VALIDATOR_FELDTYPEN,
} from '../opencode/validatorZuordnung';
import { ermittleFeldtyp, FeldSchema } from './feldtypErkennung';
import { getFieldType } from './fieldTypes';

export interface WechselFolgen {
  /** Ändert der Wechsel die Art der Antwort (JSON-Basistyp)? */
  basistypWechsel: boolean;
  /** Auswahloptionen, die der neue Typ nicht mehr kennt. */
  verlierteOptionen: string[];
  /** Gesetzte Prüfungen, die zum neuen Typ nicht mehr passen. */
  verlierteePruefungen: string[];
  /**
   * Bezeichnungen der Felder, deren Bedingung dieses Feld mit einem Wert
   * vergleicht. Die Bedingung bleibt bestehen, trifft nach einem
   * Basistypwechsel aber womöglich nie mehr zu.
   */
  betroffeneBedingungen: string[];
  /** Gibt es überhaupt etwas zu bedenken? */
  istVerlustfrei: boolean;
}

const schluesselAus = (scope: string) => scope.replace(/^#\/properties\//, '');

/** Alle Controls, auch in Spalten und Gruppen — mit ihrer Regel. */
function alleControls(elemente: readonly UiElement[]): Array<{
  scope: string;
  options?: Record<string, unknown>;
  rule?: { condition?: { scope?: string } };
}> {
  const gefunden: Array<{
    scope: string;
    options?: Record<string, unknown>;
    rule?: { condition?: { scope?: string } };
  }> = [];
  for (const el of elemente) {
    if (el.type === 'Control') {
      gefunden.push({
        scope: el.scope,
        options: el.options,
        rule: (el as { rule?: { condition?: { scope?: string } } }).rule,
      });
    } else if (el.type === 'ColumnContainer') {
      for (const spalte of el.columns) gefunden.push(...alleControls(spalte));
    } else if (el.type === 'GroupContainer') {
      gefunden.push(...alleControls(el.children));
    }
  }
  return gefunden;
}

/** Lesbarer Name einer Prüfung; ohne Katalog-Eintrag die rohe id. */
function pruefungsName(validatorId: string): string {
  return validatorId in VALIDATOR_FELDTYPEN
    ? validatorId.replace(/^oc-val-/, '')
    : validatorId;
}

/**
 * Was kostet der Wechsel von `scope` auf `zielFeldtypId`? Ein unbekanntes
 * Ziel oder ein nicht vorhandenes Feld gilt als verlustfrei — der Reducer
 * lehnt solche Wechsel ohnehin ab.
 */
export function wechselFolgen(
  state: FieldAwareState,
  scope: string,
  zielFeldtypId: string,
): WechselFolgen {
  const leer: WechselFolgen = {
    basistypWechsel: false,
    verlierteOptionen: [],
    verlierteePruefungen: [],
    betroffeneBedingungen: [],
    istVerlustfrei: true,
  };

  const key = schluesselAus(scope);
  const feld = state.schema.properties?.[key] as
    (FeldSchema & { 'x-opencode-validators'?: string[] }) | undefined;
  if (!feld) return leer;

  let ziel;
  try {
    ziel = getFieldType(zielFeldtypId);
  } catch {
    return leer;
  }
  if (ziel.isStructural) return leer;

  const controls = alleControls(state.uiSchema.elements);
  const eigenes = controls.find((c) => c.scope === scope);
  const aktuellId = ermittleFeldtyp(feld, eigenes?.options)?.id;

  const basistypWechsel = ziel.schema.type !== feld.type;

  // Auswahloptionen gehen verloren, wenn der neue Typ keine kennt.
  const eigeneOptionen = Array.isArray(feld.enum)
    ? feld.enum.map((v) => String(v))
    : [];
  const zielKenntOptionen = Array.isArray(
    (ziel.schema as FeldSchema).enum ??
      ((ziel.schema as FeldSchema).items as FeldSchema | undefined)?.enum,
  );
  const verlierteOptionen = zielKenntOptionen ? [] : eigeneOptionen;

  // Prüfungen, die zum neuen Typ nicht mehr passen.
  const gesetztePruefungen = feld['x-opencode-validators'] ?? [];
  const verlierteePruefungen = gesetztePruefungen
    .filter((id) => !passtValidatorZuFeldtyp(id, zielFeldtypId))
    .map(pruefungsName);

  // Bedingungen anderer Felder, die dieses Feld mit einem Wert vergleichen.
  // Nur bei einem Basistypwechsel relevant: Innerhalb eines Basistyps
  // bleibt der Vergleichswert gültig.
  const betroffeneBedingungen = basistypWechsel
    ? controls
        .filter((c) => c.rule?.condition?.scope === scope)
        .map((c) => {
          const anderes = state.schema.properties?.[schluesselAus(c.scope)] as
            { title?: string } | undefined;
          return anderes?.title?.trim() || schluesselAus(c.scope);
        })
    : [];

  const folgen: WechselFolgen = {
    basistypWechsel,
    verlierteOptionen,
    verlierteePruefungen,
    betroffeneBedingungen,
    istVerlustfrei: false,
  };
  folgen.istVerlustfrei =
    aktuellId === zielFeldtypId ||
    (!basistypWechsel &&
      verlierteOptionen.length === 0 &&
      verlierteePruefungen.length === 0);
  return folgen;
}
