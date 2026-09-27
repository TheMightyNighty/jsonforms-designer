/**
 * Ablage für mehrere benannte Formulare (ADR 0006).
 *
 * Bis hierher kannte der Editor genau ein Formular: `load()` und `save()`
 * arbeiteten auf einem festen Schlüssel, und wer ein zweites Formular
 * anlegen wollte, musste das erste exportieren und überschreiben. Der
 * Designer verhielt sich wie ein Notizzettel, nicht wie ein
 * Dokumenteneditor.
 *
 * Die Ablage ist eine **optionale** Erweiterung des
 * `FieldStateStorageService`: Ein Host, dessen Adapter sie nicht
 * implementiert, bekommt unverändert den Ein-Dokument-Betrieb von vorher
 * (ADR 0002/V2 — bestehende Einbettungen dürfen nicht brechen).
 *
 * Der Name eines Formulars ist sein Titel (`schema.title`) — bewusst kein
 * zweiter, davon unabhängiger Name: Zwei Namen für dieselbe Sache gehen
 * auseinander, und der Titel ist es, der später im Portal steht.
 */
import { FieldAwareState } from '../model/addFieldReducer';
import { normalizeFieldState } from './normalizeFieldState';

/** Kopfdaten eines abgelegten Formulars — ohne den Inhalt. */
export interface FormularEintrag {
  id: string;
  name: string;
  /** ISO-Zeitstempel der letzten Änderung. */
  geaendertAm: string;
}

/**
 * Verwaltung mehrerer benannter Formulare. Alle Methoden dürfen synchron
 * oder asynchron antworten — ein Server-Adapter braucht Promises, der
 * localStorage-Adapter nicht.
 */
export interface FormularAblage {
  /** Alle abgelegten Formulare, zuletzt geändertes zuerst. */
  liste(): FormularEintrag[] | Promise<FormularEintrag[]>;
  /** Inhalt eines Formulars; `undefined`, wenn es die id nicht gibt. */
  oeffnen(
    id: string,
  ): FieldAwareState | undefined | Promise<FieldAwareState | undefined>;
  /** Legt ein Formular unter neuem Namen ab und gibt seinen Eintrag zurück. */
  speichernAls(
    name: string,
    state: FieldAwareState,
  ): FormularEintrag | Promise<FormularEintrag>;
  umbenennen(id: string, name: string): void | Promise<void>;
  loeschen(id: string): void | Promise<void>;
  /** id des zuletzt geöffneten Formulars, falls bekannt. */
  aktuelleId(): string | undefined;
  /** Setzt das aktuelle Formular — der Auto-Save schreibt danach dorthin. */
  setzeAktuelleId(id: string | undefined): void;
}

/** Name, unter dem ein Formular ohne Titel in der Liste erscheint. */
export const UNBENANNTES_FORMULAR = 'Unbenanntes Formular';

export const FORMULAR_INDEX_KEY = 'jfd_formulare_v1';
export const FORMULAR_AKTUELL_KEY = 'jfd_formular_aktuell_v1';
/** Präfix der Einzeldokumente: `jfd_formular_<id>`. */
export const FORMULAR_PREFIX = 'jfd_formular_';

type StorageTeil = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function neueId(): string {
  // Kein UUID-Paket: Der Wert muss nur innerhalb einer Ablage eindeutig
  // sein, nicht global.
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Titel des Formulars als Anzeigename; leer → Platzhalter. */
export function nameAusZustand(state: FieldAwareState): string {
  const titel = (state.schema as { title?: string }).title?.trim();
  return titel || UNBENANNTES_FORMULAR;
}

/**
 * Ablage im Browser-localStorage.
 *
 * Aufbau: ein Index (`jfd_formulare_v1`) mit den Kopfdaten und je Formular
 * ein eigener Schlüssel (`jfd_formular_<id>`). Getrennt, damit das Auflisten
 * nicht alle Formulare vollständig einlesen muss.
 *
 * Alle Zugriffe sind gegen fehlenden oder vollen Storage abgesichert
 * (Private Mode, Quota) — im Zweifel verhält sich die Ablage wie leer,
 * statt den Editor scheitern zu lassen.
 */
export class LocalStorageFormularAblage implements FormularAblage {
  constructor(
    private readonly storage: StorageTeil | undefined = typeof localStorage !==
    'undefined'
      ? localStorage
      : undefined,
    /** Für Tests: feste Zeitquelle. */
    private readonly jetzt: () => Date = () => new Date(),
  ) {}

  private leseIndex(): FormularEintrag[] {
    try {
      const roh = this.storage?.getItem(FORMULAR_INDEX_KEY);
      if (!roh) return [];
      const geparst: unknown = JSON.parse(roh);
      if (!Array.isArray(geparst)) return [];
      return geparst.filter(
        (e): e is FormularEintrag =>
          typeof e === 'object' &&
          e !== null &&
          typeof (e as FormularEintrag).id === 'string' &&
          typeof (e as FormularEintrag).name === 'string',
      );
    } catch {
      return [];
    }
  }

  private schreibeIndex(eintraege: FormularEintrag[]): void {
    try {
      this.storage?.setItem(FORMULAR_INDEX_KEY, JSON.stringify(eintraege));
    } catch {
      /* Quota / kein Storage — Ablage bleibt flüchtig */
    }
  }

  liste(): FormularEintrag[] {
    return [...this.leseIndex()].sort((a, b) =>
      b.geaendertAm.localeCompare(a.geaendertAm),
    );
  }

  oeffnen(id: string): FieldAwareState | undefined {
    try {
      const roh = this.storage?.getItem(FORMULAR_PREFIX + id);
      if (!roh) return undefined;
      // Absichtlich über den Normalisierer: Ein abgelegtes Formular kann
      // aus einer älteren Version stammen.
      return normalizeFieldState(JSON.parse(roh));
    } catch {
      return undefined;
    }
  }

  speichernAls(name: string, state: FieldAwareState): FormularEintrag {
    const eintrag: FormularEintrag = {
      id: neueId(),
      name: name.trim() || UNBENANNTES_FORMULAR,
      geaendertAm: this.jetzt().toISOString(),
    };
    this.schreibeInhalt(eintrag.id, state);
    this.schreibeIndex([...this.leseIndex(), eintrag]);
    this.setzeAktuelleId(eintrag.id);
    return eintrag;
  }

  /** Schreibt den Inhalt des aktuellen Formulars (Auto-Save). */
  aktualisiere(id: string, state: FieldAwareState): void {
    const index = this.leseIndex();
    const vorhanden = index.find((e) => e.id === id);
    if (!vorhanden) return;
    this.schreibeInhalt(id, state);
    this.schreibeIndex(
      index.map((e) =>
        e.id === id
          ? {
              ...e,
              name: nameAusZustand(state),
              geaendertAm: this.jetzt().toISOString(),
            }
          : e,
      ),
    );
  }

  umbenennen(id: string, name: string): void {
    this.schreibeIndex(
      this.leseIndex().map((e) =>
        e.id === id
          ? {
              ...e,
              name: name.trim() || UNBENANNTES_FORMULAR,
              geaendertAm: this.jetzt().toISOString(),
            }
          : e,
      ),
    );
  }

  loeschen(id: string): void {
    try {
      this.storage?.removeItem(FORMULAR_PREFIX + id);
    } catch {
      /* egal — der Index-Eintrag verschwindet trotzdem */
    }
    this.schreibeIndex(this.leseIndex().filter((e) => e.id !== id));
    if (this.aktuelleId() === id) this.setzeAktuelleId(undefined);
  }

  aktuelleId(): string | undefined {
    try {
      return this.storage?.getItem(FORMULAR_AKTUELL_KEY) ?? undefined;
    } catch {
      return undefined;
    }
  }

  setzeAktuelleId(id: string | undefined): void {
    try {
      if (id) this.storage?.setItem(FORMULAR_AKTUELL_KEY, id);
      else this.storage?.removeItem(FORMULAR_AKTUELL_KEY);
    } catch {
      /* kein Storage */
    }
  }

  private schreibeInhalt(id: string, state: FieldAwareState): void {
    try {
      this.storage?.setItem(FORMULAR_PREFIX + id, JSON.stringify(state));
    } catch {
      /* Quota / kein Storage */
    }
  }
}
