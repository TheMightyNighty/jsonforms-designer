/**
 * Platzhalter in Übersetzungstexten füllen (ADR 0007).
 *
 * Der Kern liefert Daten, die Oberfläche baut daraus Sätze. Weil Wortstellung
 * und Beugung von der Sprache abhängen, steht der ganze Satz als Vorlage im
 * Sprachkatalog und bekommt seine Werte erst hier: „{anzahl} Felder" im
 * Deutschen, „{anzahl} fields" im Englischen — dieselben Daten, zwei Sätze.
 */
export function fuelleVorlage(
  vorlage: string,
  werte?: Record<string, string | number>,
): string {
  if (!werte) return vorlage;
  return Object.entries(werte).reduce(
    (text, [name, wert]) => text.replaceAll(`{${name}}`, String(wert)),
    vorlage,
  );
}
