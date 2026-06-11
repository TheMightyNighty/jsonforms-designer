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
import { sanitizeParsedJson } from '../util/sanitizeJson';

export interface FieldStateStorageService {
  /** Gespeicherten Zustand laden; `undefined`, wenn nichts vorhanden ist. */
  load(): FieldAwareState | undefined | Promise<FieldAwareState | undefined>;
  /** Aktuellen Zustand speichern. Wird bei jeder Änderung aufgerufen. */
  save(state: FieldAwareState): void | Promise<void>;
}

/** localStorage-Schlüssel der Default-Implementierung. */
export const FIELD_STATE_STORAGE_KEY = 'jfd_fieldState_v1';

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
  return {
    schema: parsed.schema,
    uiSchema: parsed.uiSchema,
    tabs: parsed.tabs ?? [],
    activeTabIndex: parsed.activeTabIndex ?? 0,
    tabAssignments: parsed.tabAssignments ?? {},
    lineNumbersEnabled: parsed.lineNumbersEnabled ?? false,
    sectionColors: parsed.sectionColors ?? {},
  };
};

/**
 * Default-Adapter: Auto-Save im Browser-localStorage.
 *
 * Fehler (korruptes JSON, Storage-Quota, Private-Mode ohne Storage) werden
 * geschluckt — der Editor startet dann mit einem leeren Formular bzw.
 * arbeitet ohne Auto-Save weiter.
 */
export class LocalStorageFieldStateService implements FieldStateStorageService {
  constructor(
    private readonly key: string = FIELD_STATE_STORAGE_KEY,
    private readonly storage:
      | Pick<Storage, 'getItem' | 'setItem'>
      | undefined = typeof localStorage !== 'undefined'
      ? localStorage
      : undefined,
  ) {}

  load(): FieldAwareState | undefined {
    try {
      const raw = this.storage?.getItem(this.key);
      if (!raw) return undefined;
      return normalizeFieldState(JSON.parse(raw));
    } catch {
      /* korrupt oder Storage nicht verfügbar — frisch starten */
      return undefined;
    }
  }

  save(state: FieldAwareState): void {
    try {
      this.storage?.setItem(this.key, JSON.stringify(state));
    } catch {
      /* Storage-Quota / Private-Mode — Auto-Save still deaktiviert */
    }
  }
}
