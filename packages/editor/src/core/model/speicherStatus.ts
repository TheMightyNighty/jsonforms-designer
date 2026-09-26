/**
 * Speicherstatus des Formulars für die Kopfzeile.
 *
 * Der Editor speichert automatisch über den `FieldStateStorageService`. Bisher
 * war davon nichts zu sehen — die Redakteurin konnte nicht erkennen, ob ihre
 * Arbeit gesichert ist. Der Status wird im Editor geführt und in der Kopfzeile
 * als Satz ausgegeben („Entwurf · gespeichert vor 5 s").
 *
 * Die Textbildung liegt hier als reine Funktion, damit sie ohne Oberfläche
 * testbar ist.
 */

export type SpeicherStatus =
  /** Noch nichts gespeichert (frisch geladen, keine Änderung). */
  | { art: 'unveraendert' }
  /** Speichervorgang läuft (asynchroner Adapter). */
  | { art: 'speichert' }
  /** Erfolgreich gespeichert; `zeitpunkt` als Millisekunden-Zeitstempel. */
  | { art: 'gespeichert'; zeitpunkt: number }
  /** Der letzte Speicherversuch ist fehlgeschlagen. */
  | { art: 'fehler' };

/** Wortlaute der Statuszeile — in beiden Sprachen aus `i18n` versorgt. */
export interface SpeicherStatusTexte {
  entwurf: string;
  speichert: string;
  geradeEben: string;
  /** „gespeichert vor {zeit}" */
  gespeichertVor: string;
  fehler: string;
  sekunden: string;
  minuten: string;
  stunden: string;
}

/**
 * Ab wann nicht mehr „gerade eben" steht. Bewusst großzügig: Die
 * Sekundenangabe soll nicht bei jedem Tastendruck flackern.
 */
export const GERADE_EBEN_SEKUNDEN = 5;

/** Wie oft die Kopfzeile den relativen Zeitpunkt neu berechnet (ms). */
export const STATUS_AKTUALISIERUNG_MS = 5_000;

function relativeZeit(
  vergangeneMs: number,
  texte: SpeicherStatusTexte,
): string {
  const sekunden = Math.max(0, Math.floor(vergangeneMs / 1000));
  if (sekunden < GERADE_EBEN_SEKUNDEN) return texte.geradeEben;
  if (sekunden < 60) return `${sekunden} ${texte.sekunden}`;
  const minuten = Math.floor(sekunden / 60);
  if (minuten < 60) return `${minuten} ${texte.minuten}`;
  return `${Math.floor(minuten / 60)} ${texte.stunden}`;
}

/**
 * Statuszeile für die Kopfzeile. `jetzt` wird übergeben statt intern
 * ermittelt, damit die Funktion rein und testbar bleibt.
 */
export function formatiereSpeicherStatus(
  status: SpeicherStatus,
  texte: SpeicherStatusTexte,
  jetzt: number,
): string {
  switch (status.art) {
    case 'fehler':
      return texte.fehler;
    case 'speichert':
      return `${texte.entwurf} · ${texte.speichert}`;
    case 'gespeichert': {
      const zeit = relativeZeit(jetzt - status.zeitpunkt, texte);
      return `${texte.entwurf} · ${texte.gespeichertVor.replace('{zeit}', zeit)}`;
    }
    case 'unveraendert':
    default:
      return texte.entwurf;
  }
}

/** Nur ein Fehler ist eine Warnung; alles andere ist Normalbetrieb. */
export function istSpeicherFehler(status: SpeicherStatus): boolean {
  return status.art === 'fehler';
}
