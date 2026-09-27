/**
 * Qualitäts-Ampel: reine Prüffunktion über dem Formularzustand
 * (ADR 0002, Arbeitspaket 6).
 *
 * Die Formularredakteurin sieht erst beim Ausprobieren, dass ein Feld keine
 * Bezeichnung hat oder zwei Felder gleich heißen. Diese Funktion findet das
 * vorher und liefert eine Liste von Hinweisen, die die Kopfzeile als Zähler
 * anzeigt und auf Klick auflistet.
 *
 * Bewusst eine reine Funktion über `FieldAwareState`: keine neuen Zuflüsse in
 * den Zustand (ADR 0001), ohne Oberfläche testbar, und die Reihenfolge der
 * Hinweise ist stabil — Fehler vor Hinweisen, innerhalb dessen in
 * Formularreihenfolge.
 */
import {
  ermittleFeldtyp,
  FeldSchema,
} from '../../field-types/feldtypErkennung';
import { vorschlagWeichtAb } from '../../field-types/feldtypVorschlag';
import { FieldAwareState } from '../model/addFieldReducer';
import { UiElement } from '../model/uiElements';

// ---------------------------------------------------------------------------
// Schwellenwerte
// ---------------------------------------------------------------------------

/**
 * Ab dieser Zeichenzahl gilt eine Bezeichnung als zu lang. Orientiert an der
 * Breite, die ein Feld-Label im Formular einnehmen kann, ohne umzubrechen —
 * nicht an einer Norm.
 */
export const MAX_LABEL_LAENGE = 80;

// ---------------------------------------------------------------------------
// Ergebnis
// ---------------------------------------------------------------------------

export type Hinweisschwere = 'fehler' | 'hinweis';

export interface Hinweis {
  /** Stabile Kennung der Prüfregel, z. B. `feld-ohne-label`. */
  id: string;
  schwere: Hinweisschwere;
  /** scope des betroffenen Feldes, falls die Regel ein Feld betrifft. */
  feldScope?: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Hilfsmittel
// ---------------------------------------------------------------------------

/** Alle Controls in Formularreihenfolge, auch in Spalten und Gruppen. */
function alleControls(
  elemente: readonly UiElement[],
): Array<{ scope: string; options?: Record<string, unknown> }> {
  const gefunden: Array<{
    scope: string;
    options?: Record<string, unknown>;
  }> = [];
  for (const el of elemente) {
    if (el.type === 'Control') {
      gefunden.push({ scope: el.scope, options: el.options });
    } else if (el.type === 'ColumnContainer') {
      for (const spalte of el.columns) gefunden.push(...alleControls(spalte));
    } else if (el.type === 'GroupContainer') {
      gefunden.push(...alleControls(el.children));
    }
  }
  return gefunden;
}

/** Alle Regeln (bedingte Anzeige) mit dem Element, an dem sie hängen. */
function alleRegeln(
  elemente: readonly UiElement[],
): Array<{ scope: string; quellScope: string }> {
  const gefunden: Array<{ scope: string; quellScope: string }> = [];
  for (const el of elemente) {
    const regel = (el as { rule?: { condition?: { scope?: string } } }).rule;
    const quellScope = regel?.condition?.scope;
    if (quellScope && 'scope' in el && el.scope) {
      gefunden.push({ scope: el.scope, quellScope });
    }
    if (el.type === 'ColumnContainer') {
      for (const spalte of el.columns) gefunden.push(...alleRegeln(spalte));
    } else if (el.type === 'GroupContainer') {
      gefunden.push(...alleRegeln(el.children));
    }
  }
  return gefunden;
}

const schluesselAus = (scope: string) => scope.replace(/^#\/properties\//, '');

/** Anzeigename eines Feldes für den Hinweistext. */
function feldName(state: FieldAwareState, scope: string): string {
  const feld = state.schema.properties?.[schluesselAus(scope)] as
    { title?: string } | undefined;
  return feld?.title?.trim() || schluesselAus(scope);
}

// ---------------------------------------------------------------------------
// Prüfung
// ---------------------------------------------------------------------------

/**
 * Prüft das Formular und liefert alle Hinweise — Fehler zuerst, innerhalb
 * einer Schwere in Formularreihenfolge.
 */
export function pruefeFormular(state: FieldAwareState): Hinweis[] {
  const fehler: Hinweis[] = [];
  const hinweise: Hinweis[] = [];

  const controls = alleControls(state.uiSchema.elements);
  const vorhandeneScopes = new Set(controls.map((c) => c.scope));

  // ── Feldbezogene Regeln ─────────────────────────────────────────────────
  const labelZuScopes = new Map<string, string[]>();

  for (const control of controls) {
    const key = schluesselAus(control.scope);
    const feld = state.schema.properties?.[key] as
      (FeldSchema & { title?: string; description?: string }) | undefined;
    if (!feld) continue;

    const label = (feld.title ?? '').trim();

    if (label === '') {
      fehler.push({
        id: 'feld-ohne-label',
        schwere: 'fehler',
        feldScope: control.scope,
        text: `Das Feld „${key}" hat keine Bezeichnung.`,
      });
    } else {
      const normalisiert = label.toLocaleLowerCase('de-DE');
      labelZuScopes.set(normalisiert, [
        ...(labelZuScopes.get(normalisiert) ?? []),
        control.scope,
      ]);
    }

    if (label.length > MAX_LABEL_LAENGE) {
      hinweise.push({
        id: 'label-zu-lang',
        schwere: 'hinweis',
        feldScope: control.scope,
        text: `Die Bezeichnung von „${label.slice(0, 30)}…" ist länger als ${MAX_LABEL_LAENGE} Zeichen.`,
      });
    }

    const istPflicht = state.schema.required?.includes(key) ?? false;
    if (istPflicht && !(feld.description ?? '').trim()) {
      hinweise.push({
        id: 'pflichtfeld-ohne-hilfetext',
        schwere: 'hinweis',
        feldScope: control.scope,
        text: `Das Pflichtfeld „${label || key}" hat keinen Hilfetext.`,
      });
    }

    // Offener Typvorschlag — ignorierte Vorschläge zählen nicht.
    if (!state.typvorschlagIgnoriert[control.scope]) {
      const aktuell = ermittleFeldtyp(feld, control.options)?.id;
      const vorschlag = vorschlagWeichtAb(label, aktuell);
      if (vorschlag) {
        hinweise.push({
          id: 'offener-typvorschlag',
          schwere: 'hinweis',
          feldScope: control.scope,
          text: `Für „${label}" passt vermutlich ${vorschlag.feldtypName}.`,
        });
      }
    }
  }

  // Doppelte Bezeichnungen: einmal je betroffenem Feld, damit der Klick in
  // der Liste zum jeweiligen Feld führt.
  for (const [, scopes] of labelZuScopes) {
    if (scopes.length < 2) continue;
    for (const scope of scopes) {
      fehler.push({
        id: 'doppeltes-label',
        schwere: 'fehler',
        feldScope: scope,
        text: `Die Bezeichnung „${feldName(state, scope)}" kommt ${scopes.length}-mal vor.`,
      });
    }
  }

  // ── Bedingungen, die ins Leere zeigen ───────────────────────────────────
  for (const regel of alleRegeln(state.uiSchema.elements)) {
    if (vorhandeneScopes.has(regel.quellScope)) continue;
    fehler.push({
      id: 'bedingung-ohne-feld',
      schwere: 'fehler',
      feldScope: regel.scope,
      text: `Die Bedingung an „${feldName(state, regel.scope)}" verweist auf ein gelöschtes Feld.`,
    });
  }

  // ── Formular-Metadaten ──────────────────────────────────────────────────
  // Am ganz leeren Formular werden die Metadaten nicht angemahnt: Titel und
  // Rechtsgrundlage fehlen dort zwangsläufig, und ein frisches Formular mit
  // zwei roten Fehlern zu begrüßen ist entmutigend statt hilfreich. Sobald
  // das Formular Inhalt hat, zählen sie wieder.
  if (controls.length > 0 || state.uiSchema.elements.length > 0) {
    if (!(state.schema.title ?? '').trim()) {
      fehler.push({
        id: 'formular-ohne-titel',
        schwere: 'fehler',
        text: 'Das Formular hat keinen Titel.',
      });
    }
    if (!state.manifestMeta.legalBasis.trim()) {
      fehler.push({
        id: 'formular-ohne-rechtsgrundlage',
        schwere: 'fehler',
        text: 'In den Metadaten fehlt die Rechtsgrundlage.',
      });
    }
  }

  return [...fehler, ...hinweise];
}

/** Zähler für die Kopfzeile. */
export function zaehleHinweise(hinweise: readonly Hinweis[]): {
  fehler: number;
  hinweise: number;
} {
  return {
    fehler: hinweise.filter((h) => h.schwere === 'fehler').length,
    hinweise: hinweise.filter((h) => h.schwere === 'hinweis').length,
  };
}
