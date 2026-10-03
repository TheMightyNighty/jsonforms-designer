/**
 * Persistenz-Adapter gegen die Redaktions-API eines Formularkatalogs.
 *
 * Bildet die Formular-Ablage (ADR 0006) auf den Katalog ab: Kennung = id,
 * Titel = Name, der Auto-Save schreibt den Entwurf. Zusätzlich kann der
 * Adapter den Entwurf freigeben; die Fußleiste (`KatalogLeiste`) zeigt den
 * Stand und bietet die Freigabe an.
 *
 * Zwei Regeln schützen das Vier-Augen-Prinzip des Katalogs: Der Adapter
 * speichert nur echte Änderungen (nicht den Zustand, der gerade geladen
 * wurde) und nur mit Redaktionsrecht. Sonst legte schon das Ansehen eines
 * Formulars einen Entwurf an, und die ansehende Person dürfte ihn danach
 * nicht mehr freigeben.
 */
import { FieldStateStorageService } from '../core/api/fieldStateStorage';
import {
  FormularAblage,
  FormularEintrag,
  UNBENANNTES_FORMULAR,
} from '../core/api/formularAblage';
import { normalizeFieldState } from '../core/api/normalizeFieldState';
import { FieldAwareState } from '../core/model/addFieldReducer';
import { fieldStateFromSchemas } from '../core/util/fieldStateFromSchemas';
import { buildJsonFormsUiSchema } from '../core/util/jsonFormsExport';
import {
  KatalogClient,
  KatalogClientOptionen,
  KatalogFehler,
  KatalogIch,
  KatalogUebersicht,
  KatalogVersion,
} from './katalogClient';
import { kennungAusTitel, kennungMitZaehler } from './kennung';

export type KatalogSpeicherstatus =
  | { art: 'ruhig' }
  | { art: 'speichert' }
  | { art: 'gespeichert' }
  | { art: 'fehler'; meldung: string };

export interface KatalogStand {
  ich?: KatalogIch;
  /** Geöffnetes Katalogformular; fehlt bei einem noch nicht angelegten. */
  formular?: KatalogUebersicht;
  speichern: KatalogSpeicherstatus;
}

export interface KatalogAblageOptionen extends KatalogClientOptionen {
  /** Debounce des Auto-Saves in Millisekunden. Default: 1500 */
  debounceMs?: number;
  /** Merkt sich das zuletzt geöffnete Formular. Default: sessionStorage */
  speicher?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}

const AKTUELL_KEY = 'jfd_katalog_aktuell_v1';
const MAX_KENNUNGSVERSUCHE = 9;

function sortiert(wert: unknown): unknown {
  if (Array.isArray(wert)) return wert.map(sortiert);
  if (wert && typeof wert === 'object') {
    return Object.fromEntries(
      Object.keys(wert)
        .sort()
        .map((k) => [k, sortiert((wert as Record<string, unknown>)[k])]),
    );
  }
  return wert;
}

/**
 * Vergleichswert für „hat sich etwas geändert“: unabhängig von der
 * Reihenfolge der Schlüssel, denn der Reducer baut geladene Zustände neu
 * zusammen. activeTabIndex ist reine Ansicht.
 */
export function vergleichswert(state: FieldAwareState): string {
  const { activeTabIndex: _ansicht, ...inhalt } = state;
  return JSON.stringify(sortiert(inhalt));
}

function zuInhalt(state: FieldAwareState) {
  return {
    schema: state.schema,
    uischema: buildJsonFormsUiSchema(state),
    editor_state: state,
  };
}

function ausVersion(v: KatalogVersion): FieldAwareState | undefined {
  return (
    normalizeFieldState(v.editor_state) ??
    fieldStateFromSchemas(v.schema, v.uischema as never)
  );
}

function sessionSpeicher():
  Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | undefined {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : undefined;
  } catch {
    return undefined;
  }
}

export class KatalogFieldStateService implements FieldStateStorageService {
  readonly ablage: FormularAblage;
  readonly client: KatalogClient;

  private stand: KatalogStand = { speichern: { art: 'ruhig' } };
  private readonly hoerer = new Set<() => void>();
  private uebersicht = new Map<string, KatalogUebersicht>();
  private aktuell: string | undefined;
  private zuletztGesichert = new Map<string, string>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private laufend: Promise<void> = Promise.resolve();
  private readonly speicher;

  constructor(private readonly optionen: KatalogAblageOptionen) {
    this.client = new KatalogClient(optionen);
    this.speicher = optionen.speicher ?? sessionSpeicher();
    this.aktuell = this.speicher?.getItem(AKTUELL_KEY) ?? undefined;
    this.ablage = {
      liste: () => this.liste(),
      oeffnen: (id) => this.oeffnen(id),
      speichernAls: (name, state) => this.speichernAls(name, state),
      umbenennen: () => undefined,
      loeschen: () => {
        throw new Error(
          'Formulare im Katalog lassen sich nicht löschen. Eine Version wird stattdessen außer Kraft gesetzt.',
        );
      },
      aktuelleId: () => this.aktuell,
      setzeAktuelleId: (id) => this.setzeAktuell(id),
    };
  }

  // ── Stand für die Oberfläche (useSyncExternalStore) ───────────────────

  abonnieren = (hoerer: () => void): (() => void) => {
    this.hoerer.add(hoerer);
    return () => this.hoerer.delete(hoerer);
  };

  aktuellerStand = (): KatalogStand => this.stand;

  private melde(teil: Partial<KatalogStand>) {
    this.stand = { ...this.stand, ...teil };
    this.hoerer.forEach((h) => h());
  }

  // ── FieldStateStorageService ──────────────────────────────────────────

  async load(): Promise<FieldAwareState | undefined> {
    this.melde({ ich: await this.client.ich() });
    await this.liste();
    if (!this.aktuell || !this.uebersicht.has(this.aktuell)) {
      this.setzeAktuell(undefined);
      return undefined;
    }
    return this.oeffnen(this.aktuell);
  }

  save(state: FieldAwareState): void {
    const kennung = this.aktuell;
    if (!kennung || !this.uebersicht.get(kennung)?.rechte.redaktion) return;
    // Solange das Formular noch lädt, ist state der vorherige Stand.
    const geladen = this.zuletztGesichert.get(kennung);
    if (geladen === undefined) return;
    const wert = vergleichswert(state);
    if (geladen === wert) return;

    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.laufend = this.laufend.then(() =>
        this.entwurfSchreiben(kennung, state, wert),
      );
    }, this.optionen.debounceMs ?? 1500);
  }

  /** Wartet, bis ausstehende Speichervorgänge geschrieben sind. */
  async ausstehendeSpeichern(): Promise<void> {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    await this.laufend;
  }

  /** Gibt den Entwurf des geöffneten Formulars frei. */
  async freigeben(gueltigAb?: Date): Promise<number> {
    const kennung = this.aktuell;
    if (!kennung) throw new KatalogFehler(404, 'kein Formular geöffnet');
    await this.ausstehendeSpeichern();
    const { version } = await this.client.freigeben(kennung, gueltigAb);
    await this.liste();
    return version;
  }

  // ── Ablage ────────────────────────────────────────────────────────────

  private async liste(): Promise<FormularEintrag[]> {
    const liste = await this.client.liste();
    this.uebersicht = new Map(liste.map((f) => [f.kennung, f]));
    this.melde({
      formular: this.aktuell ? this.uebersicht.get(this.aktuell) : undefined,
    });
    return liste.map((f) => ({
      id: f.kennung,
      name: f.titel,
      geaendertAm: f.entwurf?.bearbeitet_am ?? '',
    }));
  }

  private async oeffnen(kennung: string): Promise<FieldAwareState | undefined> {
    const state = await this.laden(kennung);
    if (state) this.zuletztGesichert.set(kennung, vergleichswert(state));
    return state;
  }

  private async laden(kennung: string): Promise<FieldAwareState | undefined> {
    try {
      return ausVersion(await this.client.entwurf(kennung));
    } catch (err) {
      if (!(err instanceof KatalogFehler) || err.status !== 404) throw err;
    }
    const version = this.uebersicht.get(kennung)?.aktuelle_version;
    if (!version) return undefined;
    return ausVersion(await this.client.version(kennung, version));
  }

  /**
   * Ein unbenanntes neues Formular wird erst im Katalog angelegt, wenn es
   * einen Namen bekommt. Sonst entstünde bei jedem „Neu“ ein Eintrag
   * „unbenanntes-formular“.
   */
  private async speichernAls(
    name: string,
    state: FieldAwareState,
  ): Promise<FormularEintrag> {
    if (name === UNBENANNTES_FORMULAR) {
      this.setzeAktuell(undefined);
      return { id: '', name, geaendertAm: new Date().toISOString() };
    }
    const kennung = await this.imKatalogAnlegen(name, state);
    return { id: kennung, name, geaendertAm: new Date().toISOString() };
  }

  /**
   * Legt das Formular unter dem Titel im Katalog an, speichert den Stand
   * als ersten Entwurf und macht es zum geöffneten Formular.
   */
  async imKatalogAnlegen(
    name: string,
    state: FieldAwareState,
  ): Promise<string> {
    const basis = kennungAusTitel(name);
    let kennung = basis;
    for (let n = 1; n <= MAX_KENNUNGSVERSUCHE; n++) {
      kennung = kennungMitZaehler(basis, n);
      try {
        await this.client.anlegen(kennung, name);
        break;
      } catch (err) {
        const vergeben = err instanceof KatalogFehler && err.status === 409;
        if (!vergeben || n === MAX_KENNUNGSVERSUCHE) throw err;
      }
    }
    const benannt = {
      ...state,
      schema: { ...state.schema, title: name },
    } as FieldAwareState;
    await this.client.entwurfSpeichern(kennung, zuInhalt(benannt));
    this.zuletztGesichert.set(kennung, vergleichswert(benannt));
    this.setzeAktuell(kennung);
    await this.liste();
    return kennung;
  }

  private setzeAktuell(kennung: string | undefined) {
    this.aktuell = kennung || undefined;
    try {
      if (this.aktuell) this.speicher?.setItem(AKTUELL_KEY, this.aktuell);
      else this.speicher?.removeItem(AKTUELL_KEY);
    } catch {
      // Ohne Speicher beginnt der nächste Start ohne geöffnetes Formular.
    }
    this.melde({
      formular: this.aktuell ? this.uebersicht.get(this.aktuell) : undefined,
      speichern: { art: 'ruhig' },
    });
  }

  private async entwurfSchreiben(
    kennung: string,
    state: FieldAwareState,
    wert: string,
  ): Promise<void> {
    this.melde({ speichern: { art: 'speichert' } });
    try {
      await this.client.entwurfSpeichern(kennung, zuInhalt(state));
      this.zuletztGesichert.set(kennung, wert);
      await this.liste();
      this.melde({ speichern: { art: 'gespeichert' } });
    } catch (err) {
      this.melde({
        speichern: {
          art: 'fehler',
          meldung: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }
}
