/**
 * Referenz-Adapter für einen extern gepflegten Baustein-Katalog (ADR 0005).
 *
 * Erwartet unter `url` eine JSON-Antwort — entweder ein Array von Bausteinen
 * oder ein Objekt `{ items: [...] }`. Damit lässt sich der Katalog als
 * statische Datei im Intranet ablegen oder aus einem Fachverfahren liefern,
 * ohne dass der Editor neu gebaut wird.
 *
 * SECURITY: Der Katalog ist unvertraute Eingabe. Jeder Eintrag läuft durch
 * `normalisiereBaustein`: Prototype-Pollution-Schlüssel werden entfernt,
 * Pflichtangaben geprüft und unbrauchbare Einträge verworfen statt den
 * ganzen Katalog scheitern zu lassen. `url` und `headers` müssen aus
 * vertrauenswürdiger Konfiguration stammen; die CSP der Host-Anwendung muss
 * den Origin in `connect-src` führen.
 */
import { JsonSchema7 } from '@jsonforms/core';

import { sanitizeParsedJson } from '../core/util/sanitizeJson';
import { Baustein, BausteinFeld, BausteinService } from './bausteinService';

export interface HttpBausteinServiceOptions {
  /** Zusätzliche Header (z. B. Authorization). */
  headers?: Record<string, string>;
  /** Default: 'same-origin' */
  credentials?: RequestCredentials;
  /** Eigene fetch-Implementierung (Tests). Default: globalThis.fetch */
  fetchFn?: typeof fetch;
  /** Fehlerkanal für verworfene Einträge. Default: console.warn */
  onEintragVerworfen?: (grund: string, rohwert: unknown) => void;
}

const istObjekt = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const istNichtLeererText = (v: unknown): v is string =>
  typeof v === 'string' && v.trim() !== '';

function normalisiereFeld(roh: unknown): BausteinFeld | undefined {
  if (!istObjekt(roh)) return undefined;
  const { propertyKey, label, schemaFragment, uiSchemaOptions } = roh;
  if (!istNichtLeererText(propertyKey)) return undefined;
  if (!istNichtLeererText(label)) return undefined;
  // Ohne Typangabe im Schema-Fragment ließe sich kein Feld anlegen.
  if (!istObjekt(schemaFragment) || !istNichtLeererText(schemaFragment.type))
    return undefined;

  return {
    propertyKey,
    label,
    schemaFragment: schemaFragment as JsonSchema7 & { title?: string },
    uiSchemaOptions: istObjekt(uiSchemaOptions) ? uiSchemaOptions : undefined,
  };
}

/**
 * Formt einen Rohwert aus dem Katalog in einen Baustein oder liefert
 * `undefined`, wenn Pflichtangaben fehlen. Felder, die für sich unbrauchbar
 * sind, werden verworfen; ein Baustein ohne verwertbares Feld ebenfalls.
 */
export function normalisiereBaustein(rohwert: unknown): Baustein | undefined {
  const roh = sanitizeParsedJson(rohwert);
  if (!istObjekt(roh)) return undefined;
  if (!istNichtLeererText(roh.id)) return undefined;
  if (!istNichtLeererText(roh.name)) return undefined;

  const felder = Array.isArray(roh.felder)
    ? roh.felder.map(normalisiereFeld).filter((f): f is BausteinFeld => !!f)
    : [];
  if (felder.length === 0) return undefined;

  return {
    id: roh.id,
    name: roh.name,
    beschreibung: istNichtLeererText(roh.beschreibung) ? roh.beschreibung : '',
    // Ein Katalog ohne Symbolangabe bekommt ein neutrales Standardsymbol.
    icon: istNichtLeererText(roh.icon) ? roh.icon : 'components',
    // Nur ein ausdrückliches false hebt die Beispiel-Kennzeichnung auf —
    // wer nichts sagt, hat nichts abgestimmt.
    istBeispiel: roh.istBeispiel !== false,
    felder,
  };
}

/** Trennt die Katalog-Einträge aus Array- oder `{ items }`-Antworten heraus. */
function leseEintraege(nutzlast: unknown): unknown[] {
  if (Array.isArray(nutzlast)) return nutzlast;
  if (istObjekt(nutzlast) && Array.isArray(nutzlast.items))
    return nutzlast.items;
  return [];
}

export class HttpBausteinService implements BausteinService {
  constructor(
    private readonly url: string,
    private readonly options: HttpBausteinServiceOptions = {},
  ) {}

  async getBausteine(): Promise<Baustein[]> {
    const holen = this.options.fetchFn ?? globalThis.fetch;
    const antwort = await holen(this.url, {
      headers: { Accept: 'application/json', ...this.options.headers },
      credentials: this.options.credentials ?? 'same-origin',
    });
    if (!antwort.ok) {
      throw new Error(
        `Baustein-Katalog nicht abrufbar (HTTP ${antwort.status})`,
      );
    }

    const verworfen =
      this.options.onEintragVerworfen ??
      ((grund: string) => console.warn(`[Baustein-Katalog] ${grund}`));

    const bausteine: Baustein[] = [];
    const gesehen = new Set<string>();
    for (const eintrag of leseEintraege(await antwort.json())) {
      const baustein = normalisiereBaustein(eintrag);
      if (!baustein) {
        verworfen('Eintrag ohne id, Namen oder verwertbare Felder', eintrag);
        continue;
      }
      if (gesehen.has(baustein.id)) {
        verworfen(`Doppelte id „${baustein.id}"`, eintrag);
        continue;
      }
      gesehen.add(baustein.id);
      bausteine.push(baustein);
    }
    return bausteine;
  }
}
