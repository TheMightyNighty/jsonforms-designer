/**
 * Die acht Feldtypen, die im Reiter „Einzelfelder" ohne Aufklappen sichtbar
 * sind. Alles andere steht darunter unter „Weitere Feldtypen".
 *
 * Bewusst eine eigene Konstante und keine Eigenschaft am Katalog: Die
 * Auswahl ist eine Annahme über den Alltag im Fachbereich und wird sich mit
 * den ersten Rückmeldungen aus dem Pilotbetrieb ändern. Reihenfolge = Reihen-
 * folge in der Palette.
 */
export const HAEUFIGE_FELDTYP_IDS: readonly string[] = [
  'text-short', // Textfeld (einzeilig)
  'text-long', // Textfeld (mehrzeilig)
  'date', // Datum
  'currency', // Betrag (€)
  'checkbox', // Ja/Nein
  'dropdown', // Auswahl
  'email', // E-Mail-Adresse
  'file-upload', // Datei-Upload
];
