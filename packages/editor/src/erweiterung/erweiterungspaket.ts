/**
 * Erweiterungspakete: datengetriebene Erweiterungen als JSON (ADR 0007).
 *
 * Ein Paket ist eine einzelne Datei. Es braucht keinen Build, keine
 * Toolchain und keine JavaScript-Kenntnisse — eine Bibliothek weiterzugeben
 * heißt, eine Datei weiterzugeben, etwa über ein Git-Repository. Genau das
 * unterscheidet datengetriebene von codegetriebenen Erweiterungen, die
 * Vertrauen und einen Build erfordern.
 *
 * Ein Paket kann **hinzufügen**: Feldtypen, Bausteine, ein Regionsprofil,
 * Begriffe. Es kann **keinen** Feldtyp des Kerns ersetzen: Eine id, die der
 * Katalog schon führt, wird verworfen. Sonst könnte eine Bibliothek
 * unbemerkt ändern, was „E-Mail-Adresse" bedeutet, und zwei Formulare
 * hießen dasselbe, ohne es zu sein.
 */
import { Baustein } from '../bausteine/bausteinService';
import { FeldtypTexte } from '../field-types/feldtypTexte';
import {
  FieldGroup,
  FieldSchemaFragment,
  FieldUiSchemaFragment,
} from '../field-types/fieldTypes';
import { Regionsprofil } from '../region/regionsprofil';

/**
 * Ein Feldtyp aus einer Erweiterung: dieselbe Struktur wie im Katalog, aber
 * mit seinen Texten im Gepäck. Der Katalog kennt keine Sprache, ein Paket
 * muss seine mitliefern — sonst stünde in der Palette nur die id.
 */
export interface ErweiterungsFeldtyp {
  id: string;
  gruppe: FieldGroup;
  /** Tabler-Symbolname ohne `ti-`-Präfix. */
  icon: string;
  schema: FieldSchemaFragment;
  uiSchema?: Partial<FieldUiSchemaFragment>;
  /** Texte je Sprachkürzel („de", „en"). */
  texte: Record<string, FeldtypTexte>;
}

export interface Erweiterungspaket {
  id: string;
  name: string;
  /** Freitext, z. B. „1.2.0" — der Editor wertet ihn nicht aus. */
  version?: string;
  beschreibung?: string;
  feldtypen?: ErweiterungsFeldtyp[];
  bausteine?: Baustein[];
  region?: Regionsprofil;
  /**
   * Begriffe überschreiben, je Sprachkürzel und mit dem Pfad in den
   * Übersetzungen als Schlüssel: `{ "de": { "header.title": "Antragsbau" } }`.
   * Nur Pfade, die es gibt — ein unbekannter Pfad wird verworfen, damit ein
   * Tippfehler nicht stillschweigend wirkungslos bleibt.
   */
  texte?: Record<string, Record<string, string>>;
}

/** Ein Paket in der Bibliothek, mit allem, was der Editor darüber weiß. */
export interface ErweiterungsEintrag {
  paket: Erweiterungspaket;
  /** Nur aktive Pakete wirken. Ein neu hinzugefügtes ist aktiv. */
  aktiv: boolean;
  /** Woher es kam: URL oder Dateiname. Für die Anzeige, nicht zum Nachladen. */
  herkunft?: string;
  /** ISO-Zeitstempel. */
  hinzugefuegtAm: string;
}
