/**
 * Lokale Bibliothek der Erweiterungspakete (ADR 0007).
 *
 * „Lokal" ist die Entscheidung: Die Bibliothek liegt im Browser der
 * Redakteurin, nicht auf einem Server, den jemand betreiben müsste. Wer ein
 * Paket weitergeben will, gibt eine Datei weiter — über ein
 * Git-Repository, ein Laufwerk, eine E-Mail. Der Editor lädt nichts von
 * sich aus nach: Was in der Bibliothek liegt, hat jemand ausdrücklich
 * hineingelegt.
 *
 * Wie die Formular-Ablage (ADR 0006) ist sie austauschbar. Ein Host, der
 * seine Bibliothek zentral pflegen will, hängt eine eigene Umsetzung ein.
 */
import { ErweiterungsEintrag, Erweiterungspaket } from './erweiterungspaket';

export interface ErweiterungsBibliothek {
  liste(): ErweiterungsEintrag[];
  /**
   * Legt ein Paket ab. Eine vorhandene id wird ersetzt — beim Nachladen
   * einer neueren Fassung derselben Bibliothek ist das das Erwartete.
   */
  hinzufuegen(paket: Erweiterungspaket, herkunft?: string): void;
  entfernen(id: string): void;
  setzeAktiv(id: string, aktiv: boolean): void;
}

export const ERWEITERUNGEN_KEY = 'jfd_erweiterungen_v1';

type StorageTeil = Pick<Storage, 'getItem' | 'setItem'>;

function istEintrag(wert: unknown): wert is ErweiterungsEintrag {
  if (typeof wert !== 'object' || wert === null) return false;
  const e = wert as ErweiterungsEintrag;
  return (
    typeof e.paket === 'object' &&
    e.paket !== null &&
    typeof e.paket.id === 'string' &&
    typeof e.aktiv === 'boolean'
  );
}

/**
 * Bibliothek im Browser-localStorage, unter einem Schlüssel.
 *
 * Alle Zugriffe sind gegen fehlenden oder vollen Storage abgesichert
 * (Private Mode, Quota): Im Zweifel verhält sie sich wie leer, statt den
 * Editor scheitern zu lassen.
 */
export class LocalStorageErweiterungsBibliothek implements ErweiterungsBibliothek {
  constructor(
    private readonly storage: StorageTeil | undefined = typeof localStorage !==
    'undefined'
      ? localStorage
      : undefined,
    private readonly jetzt: () => Date = () => new Date(),
  ) {}

  liste(): ErweiterungsEintrag[] {
    try {
      const roh = this.storage?.getItem(ERWEITERUNGEN_KEY);
      if (!roh) return [];
      const geparst: unknown = JSON.parse(roh);
      return Array.isArray(geparst) ? geparst.filter(istEintrag) : [];
    } catch {
      return [];
    }
  }

  private schreibe(eintraege: ErweiterungsEintrag[]): void {
    try {
      this.storage?.setItem(ERWEITERUNGEN_KEY, JSON.stringify(eintraege));
    } catch {
      /* Quota / kein Storage — die Bibliothek bleibt flüchtig */
    }
  }

  hinzufuegen(paket: Erweiterungspaket, herkunft?: string): void {
    const ohneAlte = this.liste().filter((e) => e.paket.id !== paket.id);
    // Ein neu hinzugefügtes Paket ist aktiv: Es hinzuzufügen war schon die
    // Entscheidung, es zu wollen.
    this.schreibe([
      ...ohneAlte,
      {
        paket,
        aktiv: true,
        herkunft,
        hinzugefuegtAm: this.jetzt().toISOString(),
      },
    ]);
  }

  entfernen(id: string): void {
    this.schreibe(this.liste().filter((e) => e.paket.id !== id));
  }

  setzeAktiv(id: string, aktiv: boolean): void {
    this.schreibe(
      this.liste().map((e) => (e.paket.id === id ? { ...e, aktiv } : e)),
    );
  }
}
