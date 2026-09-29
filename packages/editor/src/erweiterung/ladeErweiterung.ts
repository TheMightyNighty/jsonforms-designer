/**
 * Ein Erweiterungspaket von einer URL holen (ADR 0007, ADR 0005).
 *
 * Damit lässt sich eine Bibliothek als statische Datei im Intranet ablegen
 * oder aus einem Git-Repository roh beziehen, statt sie von Hand
 * herumzureichen. Der Editor ruft von sich aus nichts ab: Die URL gibt die
 * Redakteurin ein oder der Host reicht sie in die Konfiguration — das
 * Nachladen bleibt ein ausdrücklicher Schritt.
 *
 * SECURITY: Die Antwort ist unvertraute Eingabe und läuft durch
 * `normalisiereErweiterung`. Die CSP der Host-Anwendung muss den Origin in
 * `connect-src` führen.
 */
import { sanitizeParsedJson } from '../core/util/sanitizeJson';
import { Erweiterungspaket } from './erweiterungspaket';
import {
  normalisiereErweiterung,
  VerworfenMelder,
} from './normalisiereErweiterung';

export interface LadeOptionen {
  headers?: Record<string, string>;
  /** Default: 'same-origin' */
  credentials?: RequestCredentials;
  /** Eigene fetch-Implementierung (Tests). Default: globalThis.fetch */
  fetchFn?: typeof fetch;
  onEintragVerworfen?: VerworfenMelder;
}

export class ErweiterungLadefehler extends Error {
  constructor(
    message: string,
    /** Kennung für die Übersetzung in der Oberfläche. */
    readonly grund: 'nicht-erreichbar' | 'kein-json' | 'unbrauchbar',
  ) {
    super(message);
    this.name = 'ErweiterungLadefehler';
  }
}

export async function ladeErweiterungVonUrl(
  url: string,
  optionen: LadeOptionen = {},
): Promise<Erweiterungspaket> {
  const holen = optionen.fetchFn ?? globalThis.fetch;

  let antwort: Response;
  try {
    antwort = await holen(url, {
      headers: { Accept: 'application/json', ...optionen.headers },
      credentials: optionen.credentials ?? 'same-origin',
    });
  } catch (ursache) {
    // Netzwerkfehler und von der CSP geblockte Aufrufe landen beide hier.
    throw new ErweiterungLadefehler(String(ursache), 'nicht-erreichbar');
  }
  if (!antwort.ok) {
    throw new ErweiterungLadefehler(
      `HTTP ${antwort.status}`,
      'nicht-erreichbar',
    );
  }

  let nutzlast: unknown;
  try {
    nutzlast = sanitizeParsedJson(await antwort.json());
  } catch {
    throw new ErweiterungLadefehler('Antwort ist kein JSON', 'kein-json');
  }

  const paket = normalisiereErweiterung(nutzlast, optionen.onEintragVerworfen);
  if (!paket) {
    throw new ErweiterungLadefehler(
      'Kein verwertbares Erweiterungspaket',
      'unbrauchbar',
    );
  }
  return paket;
}
