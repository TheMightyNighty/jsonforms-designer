/**
 * Bausteine: vorgefertigte Feldgruppen, die als benannte Gruppe in einem
 * Schritt eingefügt werden.
 *
 * Die Formularredakteurin denkt nicht in Feldtypen, sondern in Abschnitten
 * („Antragsteller", „Anschrift"). Ein Baustein ist genau das: ein benannter
 * Container mit mehreren Feldern samt Hilfetexten und Pflichtangaben,
 * optional mit `x-fim-id` an den Feldern.
 *
 * Der Katalog kommt über einen austauschbaren Dienst, nicht aus dem Code
 * (ADR 0005) — dasselbe Muster wie `FimService` und `OpenCodeService`. So
 * kann eine Behörde ihre eigene Bausteinbibliothek pflegen, ohne den Editor
 * neu zu bauen.
 */
import { JsonSchema7 } from '@jsonforms/core';

export interface BausteinFeld {
  /** Property-Schlüssel-Vorschlag; Konflikte löst der Reducer auf. */
  propertyKey: string;
  label: string;
  schemaFragment: JsonSchema7 & { title?: string; description?: string };
  uiSchemaOptions?: Record<string, unknown>;
}

export interface Baustein {
  id: string;
  name: string;
  beschreibung: string;
  /** Tabler-Symbolname ohne `ti-`-Präfix. */
  icon: string;
  /**
   * true, solange die fachlichen Inhalte nicht abgestimmt sind. Die Palette
   * kennzeichnet solche Bausteine sichtbar als Beispiel — wer einen eigenen
   * Katalog liefert, setzt das Feld für abgestimmte Bausteine auf false.
   */
  istBeispiel: boolean;
  felder: BausteinFeld[];
}

export interface BausteinService {
  /**
   * Liefert den vollständigen Katalog. Die Palette lädt ihn einmal beim
   * Öffnen des Reiters; die Suche arbeitet auf dem geladenen Stand.
   */
  getBausteine(): Promise<Baustein[]>;
}
