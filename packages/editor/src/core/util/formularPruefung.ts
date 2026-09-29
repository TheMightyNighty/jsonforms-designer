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
 *
 * **Sie liefert Daten, keinen Text.** Jeder Hinweis trägt seine Regel-id und
 * die Werte zur Textbildung; den Satz baut erst die Oberfläche, weil nur sie
 * die Sprache kennt (ADR 0007).
 *
 * Welche Regeln gelten, entscheidet die Einrichtung:
 * `formular-ohne-rechtsgrundlage` ist eine Anforderung des deutschen
 * Verwaltungsrechts (OFM) und im neutralen Kern deshalb aus.
 */
import {
  ermittleFeldtyp,
  FeldSchema,
} from '../../field-types/feldtypErkennung';
import {
  Vorschlagsregel,
  vorschlagWeichtAb,
} from '../../field-types/feldtypVorschlag';
import { FieldAwareState } from '../model/addFieldReducer';
import { UiElement } from '../model/uiElements';
import { fuelleVorlage } from './textVorlage';

// ---------------------------------------------------------------------------
// Regeln
// ---------------------------------------------------------------------------

/** Kennungen aller Prüfregeln — zugleich die Schlüssel der Hinweistexte. */
export const PRUEF_REGELN = [
  'feld-ohne-label',
  'label-zu-lang',
  'pflichtfeld-ohne-hilfetext',
  'offener-typvorschlag',
  'doppeltes-label',
  'bedingung-ohne-feld',
  'formular-ohne-titel',
  'formular-ohne-rechtsgrundlage',
] as const;

export type PruefRegelId = (typeof PRUEF_REGELN)[number];

/**
 * Regeln, die nicht überall gelten und deshalb im neutralen Kern aus sind.
 * Ein deutsches Profil schaltet sie über `EditorConfig.pruefung` ein.
 */
export const REGIONALE_REGELN: readonly PruefRegelId[] = [
  // „Rechtsgrundlage" ist ein Begriff des deutschen Verwaltungsrechts und
  // eine Anforderung des OFM-Manifests — anderswo gibt es sie nicht.
  'formular-ohne-rechtsgrundlage',
];

/**
 * Ab dieser Zeichenzahl gilt eine Bezeichnung als zu lang. Orientiert an der
 * Breite, die ein Feld-Label im Formular einnehmen kann, ohne umzubrechen —
 * nicht an einer Norm, deshalb einstellbar.
 */
export const MAX_LABEL_LAENGE = 80;

export interface PruefEinstellungen {
  /** Überschreibt MAX_LABEL_LAENGE. */
  maxLabelLaenge?: number;
  /**
   * Regionale Regeln, die zusätzlich gelten sollen. Ohne Angabe laufen nur
   * die Regeln, die überall zutreffen.
   */
  zusaetzlicheRegeln?: readonly PruefRegelId[];
  /** Regeln, die ausgeschaltet werden, auch wenn sie allgemein gelten. */
  abgeschalteteRegeln?: readonly PruefRegelId[];
  /**
   * Stichwörter für den Typvorschlag. Ohne sie prüft `offener-typvorschlag`
   * nichts — die Stichwörter hängen an der Sprache (ADR 0007).
   */
  typvorschlaege?: readonly Vorschlagsregel[];
}

// ---------------------------------------------------------------------------
// Ergebnis
// ---------------------------------------------------------------------------

export type Hinweisschwere = 'fehler' | 'hinweis';

export interface Hinweis {
  id: PruefRegelId;
  schwere: Hinweisschwere;
  /** scope des betroffenen Feldes, falls die Regel ein Feld betrifft. */
  feldScope?: string;
  /**
   * Feldtyp, auf den sich der Hinweis bezieht. Nur die id — den Namen dazu
   * holt die Oberfläche aus i18n und reicht ihn als `{vorschlag}` nach.
   */
  feldtypId?: string;
  /**
   * Werte für die Textbildung in der Oberfläche, z. B.
   * `{ feld: 'Nachname', anzahl: 2 }`. Bewusst keine fertigen Sätze —
   * übersetzt wird erst dort, wo die Sprache bekannt ist.
   */
  werte?: Record<string, string | number>;
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

/** Anzeigename eines Feldes für die Textbildung. */
function feldName(state: FieldAwareState, scope: string): string {
  const feld = state.schema.properties?.[schluesselAus(scope)] as
    { title?: string } | undefined;
  return feld?.title?.trim() || schluesselAus(scope);
}

/** Läuft diese Regel unter den gegebenen Einstellungen? */
function regelAktiv(
  id: PruefRegelId,
  einstellungen: PruefEinstellungen,
): boolean {
  if (einstellungen.abgeschalteteRegeln?.includes(id)) return false;
  if (!REGIONALE_REGELN.includes(id)) return true;
  return einstellungen.zusaetzlicheRegeln?.includes(id) ?? false;
}

// ---------------------------------------------------------------------------
// Prüfung
// ---------------------------------------------------------------------------

/**
 * Prüft das Formular und liefert alle Hinweise — Fehler zuerst, innerhalb
 * einer Schwere in Formularreihenfolge.
 */
export function pruefeFormular(
  state: FieldAwareState,
  einstellungen: PruefEinstellungen = {},
): Hinweis[] {
  const fehler: Hinweis[] = [];
  const hinweise: Hinweis[] = [];
  const maxLabel = einstellungen.maxLabelLaenge ?? MAX_LABEL_LAENGE;
  const aktiv = (id: PruefRegelId) => regelAktiv(id, einstellungen);

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
      if (aktiv('feld-ohne-label')) {
        fehler.push({
          id: 'feld-ohne-label',
          schwere: 'fehler',
          feldScope: control.scope,
          werte: { feld: key },
        });
      }
    } else {
      const normalisiert = label.toLocaleLowerCase();
      labelZuScopes.set(normalisiert, [
        ...(labelZuScopes.get(normalisiert) ?? []),
        control.scope,
      ]);
    }

    if (label.length > maxLabel && aktiv('label-zu-lang')) {
      hinweise.push({
        id: 'label-zu-lang',
        schwere: 'hinweis',
        feldScope: control.scope,
        werte: { feld: label.slice(0, 30), grenze: maxLabel },
      });
    }

    const istPflicht = state.schema.required?.includes(key) ?? false;
    if (
      istPflicht &&
      !(feld.description ?? '').trim() &&
      aktiv('pflichtfeld-ohne-hilfetext')
    ) {
      hinweise.push({
        id: 'pflichtfeld-ohne-hilfetext',
        schwere: 'hinweis',
        feldScope: control.scope,
        werte: { feld: label || key },
      });
    }

    // Offener Typvorschlag — ignorierte Vorschläge zählen nicht.
    if (
      !state.typvorschlagIgnoriert[control.scope] &&
      aktiv('offener-typvorschlag')
    ) {
      const aktuell = ermittleFeldtyp(feld, control.options)?.id;
      const vorschlag = vorschlagWeichtAb(
        label,
        aktuell,
        einstellungen.typvorschlaege,
      );
      if (vorschlag) {
        hinweise.push({
          id: 'offener-typvorschlag',
          schwere: 'hinweis',
          feldScope: control.scope,
          werte: { feld: label },
          feldtypId: vorschlag.feldtypId,
        });
      }
    }
  }

  // Doppelte Bezeichnungen: einmal je betroffenem Feld, damit der Klick in
  // der Liste zum jeweiligen Feld führt.
  if (aktiv('doppeltes-label')) {
    for (const [, scopes] of labelZuScopes) {
      if (scopes.length < 2) continue;
      for (const scope of scopes) {
        fehler.push({
          id: 'doppeltes-label',
          schwere: 'fehler',
          feldScope: scope,
          werte: { feld: feldName(state, scope), anzahl: scopes.length },
        });
      }
    }
  }

  // ── Bedingungen, die ins Leere zeigen ───────────────────────────────────
  if (aktiv('bedingung-ohne-feld')) {
    for (const regel of alleRegeln(state.uiSchema.elements)) {
      if (vorhandeneScopes.has(regel.quellScope)) continue;
      fehler.push({
        id: 'bedingung-ohne-feld',
        schwere: 'fehler',
        feldScope: regel.scope,
        werte: { feld: feldName(state, regel.scope) },
      });
    }
  }

  // ── Formular-Metadaten ──────────────────────────────────────────────────
  // Am ganz leeren Formular werden sie nicht angemahnt: Titel und
  // Rechtsgrundlage fehlen dort zwangsläufig, und ein frisches Formular mit
  // roten Fehlern zu begrüßen ist entmutigend statt hilfreich.
  const hatInhalt = controls.length > 0 || state.uiSchema.elements.length > 0;
  if (hatInhalt) {
    if (!(state.schema.title ?? '').trim() && aktiv('formular-ohne-titel')) {
      fehler.push({ id: 'formular-ohne-titel', schwere: 'fehler' });
    }
    if (
      !state.manifestMeta.legalBasis.trim() &&
      aktiv('formular-ohne-rechtsgrundlage')
    ) {
      fehler.push({ id: 'formular-ohne-rechtsgrundlage', schwere: 'fehler' });
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

/**
 * Setzt den Hinweistext aus Vorlage und Werten zusammen. Die Vorlagen
 * kommen aus `i18n`; Platzhalter haben die Form `{name}`.
 */
export function hinweisText(
  hinweis: Hinweis,
  vorlagen: Record<PruefRegelId, string>,
  zusatzWerte?: Record<string, string | number>,
): string {
  return fuelleVorlage(vorlagen[hinweis.id] ?? hinweis.id, {
    ...hinweis.werte,
    ...zusatzWerte,
  });
}
