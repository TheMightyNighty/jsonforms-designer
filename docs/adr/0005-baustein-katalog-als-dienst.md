# ADR 0005: Baustein-Katalog als austauschbarer Dienst

**Status:** Akzeptiert (2026-09)
**Kontext:** packages/editor — `bausteine/`, Palette, `EditorConfig`

## Kontext

Bausteine sind vorgefertigte Feldgruppen, die als benannter Abschnitt in einem
Schritt eingefügt werden (ADR 0002, Arbeitspaket 3). Sie sind der
Standard-Reiter der Palette, weil die Formularredakteurin in Abschnitten denkt
und nicht in Feldtypen — der Baustein ist der Einstieg, das Einzelfeld die
Ausnahme.

Bei der ersten Umsetzung lag der Katalog als Konstante `BAUSTEIN_KATALOG` im
Editor-Code, mit drei als Beispiel gekennzeichneten Einträgen und einer
offenen Rückfrage zu den fachlichen Inhalten. Das trägt nicht: Welche
Bausteine eine Behörde braucht, weiß die Behörde, nicht der Editor. Fachliche
Inhalte im Code bedeuten, dass jede Ergänzung einen neuen Editor-Build
erfordert — und dass zwei Behörden mit unterschiedlichen Bibliotheken
denselben Editor nicht teilen können.

Für genau diesen Fall gibt es im Projekt bereits ein Muster: `FimService` und
`OpenCodeService` werden über `EditorConfig.modules.*.service` injiziert, mit
einer Mock-Implementierung als Default. Ein dritter, eigener Weg wäre der
Workaround, den das Projektleitprinzip ausschließt.

## Entscheidung

Der Baustein-Katalog kommt über den austauschbaren **`BausteinService`**:

```ts
interface BausteinService {
  getBausteine(): Promise<Baustein[]>;
}
```

Konfiguriert wird er wie die beiden anderen Kataloge, über
`EditorConfig.modules.bausteine`. Ohne Angabe liefert der
`MockBausteinService` die drei bisherigen Beispiel-Bausteine — die Palette
darf ohne Host-Konfiguration nicht leer sein, sonst ist der Standard-Reiter
im Entwicklungs- und Vorführbetrieb wertlos. Die Beispiele sind über das Feld
`istBeispiel` weiterhin sichtbar als solche gekennzeichnet; die Rückfrage nach
den fachlichen Inhalten wandert mit ihnen in den Default-Dienst.

`HttpBausteinService` ist der mitgelieferte Referenz-Adapter: Er liest den
Katalog als JSON von einer konfigurierten URL, wahlweise als Array oder als
`{ items: [...] }`. Damit genügt eine statische Datei im Intranet, um eine
eigene Bibliothek zu betreiben.

**Eingehende Kataloge sind unvertraute Eingabe.** Jeder Eintrag läuft durch
`normalisiereBaustein`: Prototype-Pollution-Schlüssel werden entfernt
(`sanitizeParsedJson`, wie beim Formular-Import), Pflichtangaben geprüft und
unbrauchbare Einträge einzeln verworfen statt den ganzen Katalog scheitern zu
lassen. Verworfene Einträge gehen über `onEintragVerworfen` an den Host.
Vorsichtiger Default bei der Kennzeichnung: Nur ein ausdrückliches
`istBeispiel: false` hebt sie auf — wer nichts sagt, hat nichts abgestimmt.

Weil der Katalog asynchron kommt, kann der Drop-Handler ihn nicht mehr
synchron nachschlagen. Das Drag-Item trägt deshalb den vollständigen Baustein
statt seiner id — dieselbe Lösung wie bei FIM-Datenfeldgruppen
(`FimDragItem.gruppe`). Der Einfügepfad (`createBausteinAction`) bleibt
unverändert und nutzt weiterhin dieselbe Action wie FIM-Gruppen
(`ADD_FIM_GRUPPE`).

Geladen wird einmal auf Ebene der Palette, nicht im Reiter: Das Suchfeld steht
über allen Reitern und muss auf demselben Stand arbeiten wie der
Bausteine-Reiter.

## Konsequenzen

Eine Behörde pflegt ihre Bausteinbibliothek künftig ohne Editor-Build — als
Datei oder aus einem Fachverfahren. Zwei Behörden können denselben Editor mit
verschiedenen Bibliotheken betreiben, und ein Katalog kann zwischen ihnen
weitergegeben werden, weil das Format dokumentiert ist (README, Abschnitt
„Baustein-Bibliothek").

Der Code wird dadurch **nicht kleiner, sondern größer**: Interface,
Default-Dienst, HTTP-Adapter, Normalisierung, Ladezustand und Fehlerkanal
kommen hinzu, wo vorher eine Konstante stand. Der Gewinn liegt nicht in
weniger Zeilen, sondern darin, dass die fachlichen Inhalte den Code verlassen
haben. Dafür muss die Palette jetzt drei Zustände zeigen — lädt, leer,
Fehler —, die es bei einer Konstante nicht gab.

Der Katalog ist keine Quelle für den Formularzustand: Ein eingefügter Baustein
erzeugt gewöhnliche Felder im `FieldAwareState` und trägt keine Referenz auf
seine Herkunft. Verschwindet ein Baustein später aus dem Katalog, bleiben
bereits gebaute Formulare unberührt (ADR 0001, ADR 0002/V2). Der Preis ist die
andere Richtung: Eine Korrektur im Katalog erreicht bestehende Formulare nicht
— das wäre ein eigenes Thema (Baustein-Instanzen mit Herkunft und
Aktualisierung) und ist hier bewusst nicht entschieden.
