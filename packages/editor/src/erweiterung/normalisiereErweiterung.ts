/**
 * Erweiterungspakete sind unvertraute Eingabe (ADR 0005, ADR 0007).
 *
 * Ein Paket kommt aus einer Datei oder von einer URL und ist damit nichts
 * anderes als ein fremder Baustein-Katalog: Prototype-Pollution-Schlüssel
 * werden entfernt, Pflichtangaben geprüft, und ein einzelner unbrauchbarer
 * Eintrag wird verworfen, statt das ganze Paket scheitern zu lassen. Wer
 * eine Bibliothek mit fünfzig Feldtypen lädt, von denen einer kaputt ist,
 * soll neunundvierzig bekommen und eine Meldung.
 */
import { Baustein } from '../bausteine/bausteinService';
import { normalisiereBaustein } from '../bausteine/httpBausteinService';
import { PRUEF_REGELN, PruefRegelId } from '../core/util/formularPruefung';
import { sanitizeParsedJson } from '../core/util/sanitizeJson';
import { FIELD_GROUPS, FieldGroup } from '../field-types/fieldTypes';
import { FormTemplate } from '../field-types/formTemplates';
import { Regionsprofil } from '../region/regionsprofil';
import { ErweiterungsFeldtyp, Erweiterungspaket } from './erweiterungspaket';

export type VerworfenMelder = (grund: string, rohwert: unknown) => void;

const istObjekt = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const istText = (v: unknown): v is string =>
  typeof v === 'string' && v.trim() !== '';

const ERLAUBTE_SCHEMA_TYPEN = [
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
];

function normalisiereTexte(roh: unknown): Record<string, FeldtypTexteRoh> {
  const texte: Record<string, FeldtypTexteRoh> = {};
  if (!istObjekt(roh)) return texte;
  for (const [sprache, wert] of Object.entries(roh)) {
    if (!istObjekt(wert)) continue;
    if (!istText(wert.name)) continue;
    texte[sprache] = {
      name: wert.name,
      label: istText(wert.label) ? wert.label : wert.name,
      beschreibung: istText(wert.beschreibung) ? wert.beschreibung : '',
    };
  }
  return texte;
}

interface FeldtypTexteRoh {
  name: string;
  label: string;
  beschreibung: string;
}

function normalisiereFeldtyp(roh: unknown): ErweiterungsFeldtyp | undefined {
  if (!istObjekt(roh)) return undefined;
  if (!istText(roh.id)) return undefined;
  if (!FIELD_GROUPS.includes(roh.gruppe as FieldGroup)) return undefined;
  if (!istObjekt(roh.schema)) return undefined;
  if (!ERLAUBTE_SCHEMA_TYPEN.includes(roh.schema.type as string))
    return undefined;

  const texte = normalisiereTexte(roh.texte);
  // Ohne einen einzigen Namen stünde in der Palette die id.
  if (Object.keys(texte).length === 0) return undefined;

  return {
    id: roh.id,
    gruppe: roh.gruppe as FieldGroup,
    icon: istText(roh.icon) ? roh.icon : 'forms',
    schema: roh.schema as ErweiterungsFeldtyp['schema'],
    uiSchema: istObjekt(roh.uiSchema)
      ? (roh.uiSchema as ErweiterungsFeldtyp['uiSchema'])
      : undefined,
    texte,
  };
}

/**
 * Eine Vorlage ist ein fertiger Formularzustand. Geprüft wird nur, dass sie
 * Schema und uiSchema mitbringt — den Inhalt normalisiert beim Laden ohnehin
 * `normalizeFieldState`.
 */
function normalisiereVorlage(roh: unknown): FormTemplate | undefined {
  if (!istObjekt(roh)) return undefined;
  if (!istText(roh.id)) return undefined;
  if (!istText(roh.displayName)) return undefined;
  const zustand = roh.state;
  if (!istObjekt(zustand)) return undefined;
  if (!istObjekt(zustand.schema) || !istObjekt(zustand.uiSchema))
    return undefined;
  return {
    id: roh.id,
    displayName: roh.displayName,
    description: istText(roh.description) ? roh.description : '',
    icon: istText(roh.icon) ? roh.icon : 'file-text',
    state: zustand as unknown as FormTemplate['state'],
  };
}

function normalisiereRegion(roh: unknown): Regionsprofil | undefined {
  if (!istObjekt(roh)) return undefined;
  if (!istText(roh.id)) return undefined;

  const textKarte = (wert: unknown): Record<string, string> | undefined => {
    if (!istObjekt(wert)) return undefined;
    const karte: Record<string, string> = {};
    for (const [k, v] of Object.entries(wert)) if (istText(v)) karte[k] = v;
    return Object.keys(karte).length > 0 ? karte : undefined;
  };

  // Ein Paket darf nur Regeln einschalten, die der Kern kennt — eine
  // erfundene id wäre stillschweigend wirkungslos.
  const regeln = Array.isArray(roh.pruefRegeln)
    ? roh.pruefRegeln.filter((r): r is PruefRegelId =>
        PRUEF_REGELN.includes(r as PruefRegelId),
      )
    : undefined;

  return {
    id: roh.id,
    platzhalter: textKarte(roh.platzhalter),
    muster: textKarte(roh.muster),
    pruefRegeln: regeln && regeln.length > 0 ? regeln : undefined,
  };
}

function normalisiereBegriffe(
  roh: unknown,
): Record<string, Record<string, string>> | undefined {
  if (!istObjekt(roh)) return undefined;
  const alle: Record<string, Record<string, string>> = {};
  for (const [sprache, karte] of Object.entries(roh)) {
    if (!istObjekt(karte)) continue;
    const gueltig: Record<string, string> = {};
    for (const [pfad, wert] of Object.entries(karte)) {
      if (istText(pfad) && typeof wert === 'string') gueltig[pfad] = wert;
    }
    if (Object.keys(gueltig).length > 0) alle[sprache] = gueltig;
  }
  return Object.keys(alle).length > 0 ? alle : undefined;
}

/**
 * Formt einen Rohwert in ein Erweiterungspaket oder liefert `undefined`,
 * wenn id oder Name fehlen. Ein Paket, das am Ende nichts beiträgt, gilt als
 * unbrauchbar: Es stünde sonst in der Bibliothek und täte nichts.
 */
export function normalisiereErweiterung(
  rohwert: unknown,
  verworfen: VerworfenMelder = (grund) =>
    console.warn(`[Erweiterung] ${grund}`),
): Erweiterungspaket | undefined {
  const roh = sanitizeParsedJson(rohwert);
  if (!istObjekt(roh)) return undefined;
  if (!istText(roh.id)) return undefined;
  if (!istText(roh.name)) return undefined;

  const feldtypen: ErweiterungsFeldtyp[] = [];
  const gesehen = new Set<string>();
  for (const eintrag of Array.isArray(roh.feldtypen) ? roh.feldtypen : []) {
    const feldtyp = normalisiereFeldtyp(eintrag);
    if (!feldtyp) {
      verworfen('Feldtyp ohne id, Gruppe, Schema-Typ oder Namen', eintrag);
      continue;
    }
    if (gesehen.has(feldtyp.id)) {
      verworfen(`Doppelte Feldtyp-id „${feldtyp.id}"`, eintrag);
      continue;
    }
    gesehen.add(feldtyp.id);
    feldtypen.push(feldtyp);
  }

  const bausteine: Baustein[] = [];
  for (const eintrag of Array.isArray(roh.bausteine) ? roh.bausteine : []) {
    const baustein = normalisiereBaustein(eintrag);
    if (!baustein) {
      verworfen('Baustein ohne id, Namen oder verwertbare Felder', eintrag);
      continue;
    }
    bausteine.push(baustein);
  }

  const vorlagen: FormTemplate[] = [];
  for (const eintrag of Array.isArray(roh.vorlagen) ? roh.vorlagen : []) {
    const vorlage = normalisiereVorlage(eintrag);
    if (!vorlage) {
      verworfen('Vorlage ohne id, Namen, Schema oder uiSchema', eintrag);
      continue;
    }
    vorlagen.push(vorlage);
  }

  const region = normalisiereRegion(roh.region);
  const texte = normalisiereBegriffe(roh.texte);

  const traegtNichtsBei =
    feldtypen.length === 0 &&
    bausteine.length === 0 &&
    vorlagen.length === 0 &&
    !region &&
    !texte;
  if (traegtNichtsBei) {
    verworfen(`Paket „${roh.id}" trägt nichts bei`, rohwert);
    return undefined;
  }

  return {
    id: roh.id,
    name: roh.name,
    version: istText(roh.version) ? roh.version : undefined,
    beschreibung: istText(roh.beschreibung) ? roh.beschreibung : undefined,
    feldtypen: feldtypen.length > 0 ? feldtypen : undefined,
    bausteine: bausteine.length > 0 ? bausteine : undefined,
    vorlagen: vorlagen.length > 0 ? vorlagen : undefined,
    region,
    texte,
  };
}
