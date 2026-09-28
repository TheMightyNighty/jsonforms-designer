# Erweiterungspakete

Ein Erweiterungspaket ist **eine JSON-Datei** (ADR 0007). Es braucht keinen
Build und keine JavaScript-Kenntnisse: Wer eine Bibliothek weitergeben will,
gibt diese Datei weiter — über ein Git-Repository, ein Laufwerk, eine E-Mail.

Hinzugefügt wird sie im Editor unter **Ansicht → Erweiterungen …**. Der Editor
lädt von sich aus nichts nach; was in der Bibliothek liegt, hat jemand
ausdrücklich hineingelegt. Die Bibliothek ist lokal, sie liegt im Browser der
Redakteurin.

`musterstadt.json` in diesem Verzeichnis zeigt alle vier Beitragsarten.

## Aufbau

| Feld | Pflicht | Bedeutung |
| --- | --- | --- |
| `id` | ja | Eindeutig. Eine Datei mit derselben id ersetzt die vorhandene. |
| `name` | ja | Was in der Bibliothek steht. |
| `version`, `beschreibung` | nein | Freitext; der Editor wertet sie nicht aus. |
| `feldtypen` | nein | Zusätzliche Feldtypen samt ihren Texten. |
| `bausteine` | nein | Vorgefertigte Feldgruppen, Format wie in ADR 0005. |
| `region` | nein | Platzhalter, engere Muster, regionale Prüfregeln. |
| `texte` | nein | Einzelne Begriffe überschreiben, je Sprache. |

Ein Paket muss mindestens eine dieser vier Arten beitragen — sonst stünde es
in der Bibliothek und täte nichts.

## Feldtypen

```jsonc
{
  "id": "kfz-kennzeichen",        // darf keinen Kern-Feldtyp überschreiben
  "gruppe": "eingabe",            // eingabe | auswahl | struktur | layout
  "icon": "car",                  // Tabler-Symbolname ohne "ti-"
  "schema": { "type": "string" }, // JSON-Schema-Fragment
  "uiSchema": { "options": { "placeholder": "M-AB123" } },
  "texte": {                      // mindestens eine Sprache, sonst verworfen
    "de": { "name": "…", "label": "…", "beschreibung": "" }
  }
}
```

`name` steht in der Palette, `label` ist die Beschriftung des eingefügten
Feldes, `beschreibung` die Erläuterung darunter.

Eine id, die der Kern schon führt, wird **verworfen** und im Dialog gemeldet.
Sonst könnte eine Bibliothek unbemerkt ändern, was „E-Mail-Adresse" bedeutet.

## Begriffe

`texte` überschreibt einzelne Pfade in den Sprachdateien — so heißt das
Formular überall „Antrag", ohne dass jemand den Editor neu baut:

```json
{ "texte": { "de": { "header.title": "Antragsdesigner Musterstadt" } } }
```

Ein Pfad, den es nicht gibt, wird verworfen und gemeldet; ein Tippfehler
bleibt damit nicht unsichtbar.

## Was ein Paket nicht kann

Ein Paket ist **Daten, kein Code**. Es kann keine eigenen Renderer, keine
Exportformate und keine Fachmodule mitbringen — das sind codegetriebene
Erweiterungen, die beim Zusammenbau der Anwendung registriert werden und
Vertrauen voraussetzen. Ein Editor, der Code von einer URL nachlädt, ist in
einer Behörde nicht betreibbar; diese Grenze ist Absicht (ADR 0007).

Eingehende Pakete sind unvertraute Eingabe: Prototype-Pollution-Schlüssel
werden entfernt, Pflichtangaben geprüft, und ein einzelner unbrauchbarer
Eintrag wird verworfen, statt das ganze Paket scheitern zu lassen.
