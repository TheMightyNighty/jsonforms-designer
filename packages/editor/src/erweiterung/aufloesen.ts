/**
 * Aus aktiven Paketen den tatsächlich geltenden Stand berechnen (ADR 0007).
 *
 * Eine reine Funktion über Katalog, Sprachdateien und Paketen — ohne
 * Oberfläche testbar und ohne eigenen Zustand. Was sie nicht auflösen kann,
 * meldet sie als Konflikt zurück, statt es stillschweigend zu schlucken:
 * Eine Bibliothek, die nicht wirkt, ist schlimmer als eine, die sich
 * beschwert.
 */
import { Baustein } from '../bausteine/bausteinService';
import { FeldtypTexte } from '../field-types/feldtypTexte';
import {
  FIELD_TYPE_CATALOG,
  FieldTypeDefinition,
} from '../field-types/fieldTypes';
import { EditorTranslations } from '../i18n/types';
import { Regionsprofil } from '../region/regionsprofil';
import { Erweiterungspaket } from './erweiterungspaket';

export interface AufgeloesteErweiterungen {
  /** Kern-Katalog plus die Feldtypen der Pakete, in dieser Reihenfolge. */
  feldtypen: FieldTypeDefinition[];
  /** Nur die ergänzten — das, was die Registrierstelle bekommt. */
  zusatzFeldtypen: FieldTypeDefinition[];
  /** Texte der ergänzten Feldtypen, je Sprachkürzel. */
  feldtypTexte: Record<string, Record<string, FeldtypTexte>>;
  bausteine: Baustein[];
  region: Regionsprofil | undefined;
  /** Überschriebene Begriffe je Sprachkürzel, Pfad → Text. */
  begriffe: Record<string, Record<string, string>>;
  /**
   * Was nicht übernommen wurde, in Klartext. Die Oberfläche zeigt es am
   * betroffenen Paket an.
   */
  konflikte: string[];
}

/**
 * Vereinigt die Regionsprofile: Platzhalter und Muster werden gemischt,
 * Prüfregeln vereinigt. Ein späteres Paket überschreibt einen einzelnen
 * Platzhalter, wirft aber nicht das ganze Profil weg — sonst hinge das
 * Ergebnis an der Reihenfolge, in der jemand seine Pakete hinzugefügt hat.
 */
function vereinigeRegionen(
  profile: readonly Regionsprofil[],
): Regionsprofil | undefined {
  if (profile.length === 0) return undefined;
  if (profile.length === 1) return profile[0];
  return {
    id: profile.map((p) => p.id).join('+'),
    platzhalter: Object.assign({}, ...profile.map((p) => p.platzhalter ?? {})),
    muster: Object.assign({}, ...profile.map((p) => p.muster ?? {})),
    pruefRegeln: [...new Set(profile.flatMap((p) => p.pruefRegeln ?? []))],
  };
}

export function loeseErweiterungenAuf(
  pakete: readonly Erweiterungspaket[],
  basisRegion?: Regionsprofil,
): AufgeloesteErweiterungen {
  const konflikte: string[] = [];
  const zusatzFeldtypen: FieldTypeDefinition[] = [];
  const feldtypTexte: Record<string, Record<string, FeldtypTexte>> = {};
  const bausteine: Baustein[] = [];
  const begriffe: Record<string, Record<string, string>> = {};
  const regionen: Regionsprofil[] = basisRegion ? [basisRegion] : [];

  const bekannteFeldtypen = new Set(FIELD_TYPE_CATALOG.map((f) => f.id));
  const bekannteBausteine = new Set<string>();

  for (const paket of pakete) {
    for (const feldtyp of paket.feldtypen ?? []) {
      if (bekannteFeldtypen.has(feldtyp.id)) {
        konflikte.push(
          `„${paket.name}": Feldtyp „${feldtyp.id}" gibt es bereits und wurde nicht übernommen.`,
        );
        continue;
      }
      bekannteFeldtypen.add(feldtyp.id);
      zusatzFeldtypen.push({
        id: feldtyp.id,
        group: feldtyp.gruppe,
        icon: feldtyp.icon,
        schema: feldtyp.schema,
        uiSchema: {
          type: 'Control',
          scope: '',
          ...feldtyp.uiSchema,
        },
        defaults: { required: false },
      });
      for (const [sprache, texte] of Object.entries(feldtyp.texte)) {
        feldtypTexte[sprache] ??= {};
        feldtypTexte[sprache][feldtyp.id] = texte;
      }
    }

    for (const baustein of paket.bausteine ?? []) {
      if (bekannteBausteine.has(baustein.id)) {
        konflikte.push(
          `„${paket.name}": Baustein „${baustein.id}" kam doppelt und wurde einmal übernommen.`,
        );
        continue;
      }
      bekannteBausteine.add(baustein.id);
      bausteine.push(baustein);
    }

    if (paket.region) regionen.push(paket.region);

    for (const [sprache, karte] of Object.entries(paket.texte ?? {})) {
      begriffe[sprache] = { ...begriffe[sprache], ...karte };
    }
  }

  return {
    feldtypen: [...FIELD_TYPE_CATALOG, ...zusatzFeldtypen],
    zusatzFeldtypen,
    feldtypTexte,
    bausteine,
    region: vereinigeRegionen(regionen),
    begriffe,
    konflikte,
  };
}

/** Liest einen Wert über einen Pfad wie `header.title`. */
function lesePfad(objekt: unknown, pfad: string): unknown {
  return pfad
    .split('.')
    .reduce<unknown>(
      (wert, teil) =>
        typeof wert === 'object' && wert !== null
          ? (wert as Record<string, unknown>)[teil]
          : undefined,
      objekt,
    );
}

/** Setzt einen Wert über einen Pfad, ohne das Original zu verändern. */
function setzePfad<T>(objekt: T, pfad: string, wert: string): T {
  const [kopf, ...rest] = pfad.split('.');
  const alt = objekt as Record<string, unknown>;
  if (rest.length === 0) return { ...alt, [kopf]: wert } as T;
  return {
    ...alt,
    [kopf]: setzePfad(alt[kopf] as object, rest.join('.'), wert),
  } as T;
}

/**
 * Legt die Texte der Pakete über die Sprachdatei: erst die Feldtyp-Texte,
 * dann die überschriebenen Begriffe.
 *
 * Ein Begriff, den es in der Sprachdatei nicht gibt, wird verworfen und
 * gemeldet. Anders herum bliebe ein Tippfehler im Pfad unsichtbar — das
 * Paket wäre still wirkungslos, und niemand wüsste, warum.
 */
export function wendeTexteAn(
  basis: EditorTranslations,
  aufgeloest: AufgeloesteErweiterungen,
  sprache: string,
): { texte: EditorTranslations; konflikte: string[] } {
  const konflikte: string[] = [];
  const feldtypen = aufgeloest.feldtypTexte[sprache] ?? {};

  let texte: EditorTranslations =
    Object.keys(feldtypen).length > 0
      ? { ...basis, feldtypen: { ...basis.feldtypen, ...feldtypen } }
      : basis;

  for (const [pfad, wert] of Object.entries(
    aufgeloest.begriffe[sprache] ?? {},
  )) {
    if (typeof lesePfad(texte, pfad) !== 'string') {
      konflikte.push(`Unbekannter Textpfad „${pfad}" — nicht übernommen.`);
      continue;
    }
    texte = setzePfad(texte, pfad, wert);
  }

  return { texte, konflikte };
}
