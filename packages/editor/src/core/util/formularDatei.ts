/**
 * Formular als Datei: Serialisieren, Dateinamen bilden, wieder einlesen.
 *
 * Reine Funktionen ohne Browser-Zugriff, damit sie ohne Oberfläche testbar
 * sind. Der eigentliche Datei-Zugriff (Auswahldialog, Schreiben) liegt in
 * `core/api/dateiZugriff`.
 *
 * Das Dateiformat ist bewusst der vollständige `FieldAwareState` im selben
 * Umschlag, den schon der Import-Reiter versteht: `{ schema, uiSchema, … }`.
 * Ein zweites Dateiformat neben dem bestehenden wäre genau der Workaround,
 * den das Projektleitprinzip ausschließt.
 */
import { normalizeFieldState } from '../api/normalizeFieldState';
import { FieldAwareState } from '../model/addFieldReducer';

/** Dateiendung der Formulardateien. */
export const FORMULAR_DATEIENDUNG = '.json';

/** MIME-Typ für Auswahldialog und Download. */
export const FORMULAR_MIME = 'application/json';

/**
 * Wandelt einen Titel in einen brauchbaren Dateinamen: Umlaute
 * ausgeschrieben, alles Übrige auf Buchstaben, Ziffern und Bindestriche
 * reduziert. Leer → `formular`.
 */
export function dateinameFuer(state: FieldAwareState): string {
  const titel = (state.schema as { title?: string }).title ?? '';
  const stamm =
    titel
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'formular';
  return `${stamm}${FORMULAR_DATEIENDUNG}`;
}

/** Formular als eingerückter JSON-Text. */
export function formularAlsJson(state: FieldAwareState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Liest eine Formulardatei. Liefert `undefined`, wenn der Inhalt kein
 * gültiges Formular ist — der Aufrufer meldet das, statt den Editor mit
 * halben Daten zu füllen. Die Bereinigung (Prototype-Pollution,
 * Alt-Formate) übernimmt `normalizeFieldState`.
 */
export function leseFormularDatei(text: string): FieldAwareState | undefined {
  try {
    return normalizeFieldState(JSON.parse(text));
  } catch {
    return undefined;
  }
}

/**
 * Name des Formulars aus einem Dateinamen — Fallback, wenn die Datei
 * keinen Titel im Schema trägt.
 */
export function nameAusDateiname(dateiname: string): string {
  return (
    dateiname
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .trim() || 'Unbenanntes Formular'
  );
}
