/**
 * Persistenz-Schnittstelle für den Formular-Zustand (FieldAwareState).
 *
 * Der Editor ruft `load()` genau einmal beim Start auf und `save()` bei jeder
 * Zustandsänderung. Implementierungen entscheiden selbst über Transport
 * (localStorage, REST-Backend, Dateisystem …), Debouncing und
 * Konfliktbehandlung — Server-Adapter sollten `save()` intern debouncen.
 *
 * `load()` darf synchron oder asynchron antworten: synchrone Ergebnisse
 * fließen ohne Zwischenrender in den Initial-State des Editors, Promises
 * werden nach dem Mount per SET_FIELD_STATE hydriert.
 */
import { FieldAwareState } from '../model/addFieldReducer';
import {
  FormularAblage,
  LocalStorageFormularAblage,
  nameAusZustand,
} from './formularAblage';
import { normalizeFieldState } from './normalizeFieldState';

export { normalizeFieldState } from './normalizeFieldState';

export interface FieldStateStorageService {
  /** Gespeicherten Zustand laden; `undefined`, wenn nichts vorhanden ist. */
  load(): FieldAwareState | undefined | Promise<FieldAwareState | undefined>;
  /** Aktuellen Zustand speichern. Wird bei jeder Änderung aufgerufen. */
  save(state: FieldAwareState): void | Promise<void>;
  /**
   * Optional: Verwaltung mehrerer benannter Formulare (ADR 0006). Fehlt
   * sie, arbeitet der Editor wie bisher mit genau einem Formular — die
   * Menüpunkte „Neu", „Öffnen" und „Speichern unter" erscheinen dann
   * nicht. Bestehende Host-Adapter brechen dadurch nicht.
   */
  readonly ablage?: FormularAblage;
}

/** localStorage-Schlüssel der Default-Implementierung. */
export const FIELD_STATE_STORAGE_KEY = 'jfd_fieldState_v1';

export interface HttpFieldStateServiceOptions {
  /** Debounce für save() in Millisekunden. Default: 750 */
  debounceMs?: number;
  /** Zusätzliche Header (z. B. Authorization). */
  headers?: Record<string, string>;
  /** Default: 'same-origin' */
  credentials?: RequestCredentials;
  /**
   * Fehlerkanal für (debouncte) Speicherfehler — die laufen asynchron
   * außerhalb des save()-Aufrufs. Default: console.error.
   */
  onSaveError?: (error: unknown) => void;
  /** Eigene fetch-Implementierung (Tests). Default: globalThis.fetch */
  fetchFn?: typeof fetch;
}

/**
 * Referenz-Adapter für Server-Persistenz: GET beim Laden, debounctes PUT
 * beim Speichern (JSON). 404 beim Laden = „noch kein Formular" → leerer
 * Editor; eingehende Daten werden über `normalizeFieldState` bereinigt.
 *
 * SECURITY: `url` und `headers` müssen aus vertrauenswürdiger Konfiguration
 * stammen — Header (z. B. Authorization) gehen mit jedem Request an `url`.
 * Die CSP der Host-Anwendung muss den Backend-Origin in `connect-src`
 * erlauben.
 */
export class HttpFieldStateService implements FieldStateStorageService {
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly url: string,
    private readonly options: HttpFieldStateServiceOptions = {},
  ) {}

  async load(): Promise<FieldAwareState | undefined> {
    const fetchFn = this.options.fetchFn ?? fetch;
    const res = await fetchFn(this.url, {
      headers: { Accept: 'application/json', ...this.options.headers },
      credentials: this.options.credentials ?? 'same-origin',
    });
    if (res.status === 404) return undefined;
    if (!res.ok) {
      throw new Error(`Formular laden fehlgeschlagen: HTTP ${res.status}`);
    }
    return normalizeFieldState(await res.json());
  }

  save(state: FieldAwareState): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const fetchFn = this.options.fetchFn ?? fetch;
      fetchFn(this.url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers,
        },
        credentials: this.options.credentials ?? 'same-origin',
        body: JSON.stringify(state),
      })
        .then((res) => {
          if (!res.ok)
            throw new Error(`Auto-Save fehlgeschlagen: HTTP ${res.status}`);
        })
        .catch((err) => (this.options.onSaveError ?? console.error)(err));
    }, this.options.debounceMs ?? 750);
  }
}

/**
 * Default-Adapter: Auto-Save im Browser-localStorage.
 *
 * Fehler (korruptes JSON, Storage-Quota, Private-Mode ohne Storage) werden
 * geschluckt — der Editor startet dann mit einem leeren Formular bzw.
 * arbeitet ohne Auto-Save weiter.
 */
export class LocalStorageFieldStateService implements FieldStateStorageService {
  readonly ablage: LocalStorageFormularAblage;

  constructor(
    private readonly key: string = FIELD_STATE_STORAGE_KEY,
    private readonly storage:
      | Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
      | undefined = typeof localStorage !== 'undefined'
      ? localStorage
      : undefined,
  ) {
    this.ablage = new LocalStorageFormularAblage(this.storage);
  }

  /**
   * Lädt das zuletzt bearbeitete Formular aus der Ablage. Gibt es noch
   * keine Ablage, aber einen Stand unter dem alten Ein-Dokument-Schlüssel,
   * wird dieser einmalig als erstes Formular übernommen — niemand verliert
   * beim Update sein Formular (ADR 0002/V2).
   */
  load(): FieldAwareState | undefined {
    const aktuelle = this.ablage.aktuelleId();
    if (aktuelle) {
      const ausAblage = this.ablage.oeffnen(aktuelle);
      if (ausAblage) return ausAblage;
    }

    let alt: FieldAwareState | undefined;
    try {
      const raw = this.storage?.getItem(this.key);
      alt = raw ? normalizeFieldState(JSON.parse(raw)) : undefined;
    } catch {
      /* korrupt oder Storage nicht verfügbar — frisch starten */
      return undefined;
    }
    if (!alt) return undefined;

    if (this.ablage.liste().length === 0) {
      this.ablage.speichernAls(nameAusZustand(alt), alt);
    }
    return alt;
  }

  save(state: FieldAwareState): void {
    const aktuelle = this.ablage.aktuelleId();
    if (aktuelle) {
      this.ablage.aktualisiere(aktuelle, state);
    } else {
      // Noch kein Formular in der Ablage (frischer Start): Das erste
      // Speichern legt eines an, damit der Auto-Save ein Ziel hat.
      this.ablage.speichernAls(nameAusZustand(state), state);
    }
    try {
      // Den alten Schlüssel weiterschreiben: Ein Host, der noch direkt
      // darauf zugreift, sieht weiterhin den aktuellen Stand.
      this.storage?.setItem(this.key, JSON.stringify(state));
    } catch {
      /* Storage-Quota / Private-Mode — Auto-Save still deaktiviert */
    }
  }
}
