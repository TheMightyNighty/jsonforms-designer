# ADR 0003: Arbeitsfläche mit dem Produktiv-Renderer

**Status:** Entwurf (2026-09) — wartet auf das gemeinsame Renderer-Paket
**Kontext:** packages/editor — Arbeitsfläche (`Editor`, `FieldFormPreview`, `FieldRow`)

## Kontext

Die Mitte des Designers soll zeigen, was die Bürgerin später sieht. Das
funktioniert nur, wenn die Arbeitsfläche dieselben Renderer verwendet wie das
Portal — jede Nachbildung driftet, und die Redakteurin verlässt sich auf ein
Bild, das nicht stimmt.

Ein Teil des Weges ist bereits gegangen: Die Arbeitsfläche rendert jedes Feld
über `RenderedField` mit den echten JSONForms-Material-Renderern, und Auswahl,
Drag-Handle, Duplizieren und Löschen liegen als Overlay darüber (`FieldRow`) —
absolut positioniert am Rand, sichtbar erst bei Hover oder Auswahl, ohne
Rahmen oder Kopfzeile, die den Formularfluss unterbrechen. Außerhalb des
Testmodus unterbindet `pointer-events: none` die Eingabe, sodass Klicks zur
Zeile durchreichen; Pflichtfeld-Fehler bleiben ausgeblendet, weil das Formular
noch niemand abgeschickt hat.

Was fehlt, ist die Verbindung zum **gemeinsamen Renderer-Paket**, das aus
`vsp-poc` herausgelöst werden soll (eigener Brief 2.3). Solange es dieses
Paket nicht gibt, zeigt die Arbeitsfläche die Material-Renderer, das Portal
aber seine eigenen — die Vorschau-Varianten (`preview-variants/`) machen den
Unterschied heute sichtbar, statt ihn aufzulösen.

## Entscheidung (Entwurf)

Die Arbeitsfläche rendert das Formular mit dem **Produktiv-Renderer** und legt
die Bearbeitung als Overlay darüber. Konkret:

**Auswahl** erfolgt durch Klick auf das gerenderte Feld, nicht auf eine
Listenzeile daneben. Die Auswahl wird durch eine Kontur um das Feld gezeigt,
nicht durch eine eigene Zeilendarstellung — das gerenderte Feld bleibt
unverändert sichtbar.

**Ziehen** greift an einem Handle am linken Rand an, das erst bei Hover oder
Auswahl erscheint. Der Tastaturpfad (Alt+Pfeiltasten auf der fokussierten
Zeile) bleibt gleichwertig und unabhängig vom Renderer — er darf nie von der
Maus abhängen (ADR 0002/V4).

**Inline-Bearbeitung** wird nicht im gerenderten Feld selbst vorgenommen,
sondern bleibt im Eigenschaften-Bereich rechts. Ein Feld direkt zu beschriften
setzte voraus, dass jeder Renderer eine Bearbeitungsstelle anbietet; das würde
den Renderer an den Editor binden, genau das soll das gemeinsame Paket
verhindern.

**Umschalter Desktop/Handy** verengt die Arbeitsfläche auf Handy-Breite, damit
sich Auswahl und Umsortieren auch dort prüfen lassen — der Fall, in dem ein
zweispaltiges Layout umbricht. Der Umschalter ändert nur die Ansicht, nie das
Formular.

**Abhängigkeit zum Renderer-Paket:** Sobald das gemeinsame Paket existiert,
tritt es an die Stelle von `@jsonforms/material-renderers` in `RenderedField`
und in den Vorschau-Varianten. Die Overlay-Schicht bleibt unberührt — sie
kennt nur Scope und Element-Identität, keinen Renderer. Bis dahin bleiben die
Material-Renderer der Stand.

## Prototyp

Hinter dem Feature-Flag `EditorConfig.features.canvasGeraeteAnsicht`
(Default **aus**) steht der Umschalter Desktop/Handy auf der Arbeitsfläche.
Er zeigt mit den vorhandenen Material-Renderern, dass Auswahl und Umsortieren
per Overlay auch in einer schmalen Ansicht funktionieren. Die bestehende
Ansicht bleibt Standard und unverändert; ohne Flag rendert `EditorPanel`
exakt wie zuvor.

Nicht Teil des Prototyps: die Inline-Bearbeitung, der Wechsel des
Renderer-Pakets und eine Vorschau mehrerer Geräte nebeneinander.

## Konsequenzen (erwartet)

Sobald der Produktiv-Renderer greift, ist die Mitte des Designers keine
Annäherung mehr, sondern das Formular — Abweichungen zwischen Editor und
Portal können nicht mehr unbemerkt entstehen, weil es nur noch eine
Renderer-Implementierung gibt.

Der Preis ist eine Abhängigkeit in die andere Richtung: Ein Fehler im
gemeinsamen Renderer trifft dann auch den Editor. Deshalb bleibt die
Overlay-Schicht strikt renderer-unabhängig, und der Tastaturpfad bleibt ein
eigener, getesteter Weg.

Diese Entscheidung ist ein **Entwurf**. Sie wird angenommen oder verworfen,
wenn das gemeinsame Renderer-Paket vorliegt und seine Schnittstelle bekannt
ist. Bis dahin ändert sich am Normalbetrieb nichts.
