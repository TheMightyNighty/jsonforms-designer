# ADR 0006: Mehrere benannte Formulare statt eines Arbeitsstands

**Status:** Akzeptiert (2026-09)
**Kontext:** packages/editor — `core/api`, Kopfzeile

## Kontext

Der Designer kannte genau ein Formular. `FieldStateStorageService.load()`
und `save()` arbeiteten auf einem festen Schlüssel (`jfd_fieldState_v1`),
und die Oberfläche bot dazu nur drei Dinge an: Auto-Save, Import/Export als
JSON-Datei und „Vorlage laden", das den aktuellen Stand ohne Rückfrage
überschrieb.

Wer ein zweites Formular anlegen wollte, musste das erste exportieren und
dann überschreiben. Ein „Neues Formular" gab es nicht, ein „Öffnen" auch
nicht, und der Formulartitel war nur über „Weitere → Formular-Metadaten"
erreichbar — beim leeren Formular führte dorthin gar kein sichtbarer Weg.

Das Werkzeug verhielt sich damit wie ein Notizzettel, nicht wie ein
Dokumenteneditor. Für die Zielgruppe aus ADR 0002 — eine Redakteurin, die
wenige Formulare pro Jahr baut und zwischen ihnen wechselt — ist das die
größte Einzellücke, größer als jede visuelle Frage.

## Entscheidung

Der Editor verwaltet **mehrere benannte Formulare** über eine
**optionale** Erweiterung des bestehenden Persistenz-Adapters:

```ts
interface FieldStateStorageService {
  load(): …;   // unverändert
  save(state): …;   // unverändert
  readonly ablage?: FormularAblage;   // neu, optional
}
```

`FormularAblage` kann auflisten, öffnen, unter neuem Namen ablegen,
umbenennen, löschen und das aktuelle Formular merken. Fehlt die Ablage,
arbeitet der Editor unverändert im Ein-Dokument-Betrieb und blendet die
Menüpunkte nicht ein — **bestehende Host-Einbettungen brechen nicht**
(ADR 0002/V2). Die Erweiterung ist additiv, `load`/`save` behalten ihre
Bedeutung.

**Der Name eines Formulars ist sein Titel** (`schema.title`), bewusst kein
zweiter, davon unabhängiger Name. Zwei Namen für dieselbe Sache laufen
auseinander, und der Titel ist es, der später im Portal steht.
Umbenennen setzt deshalb den Titel; der Auto-Save zieht den Namen im
Index nach.

`LocalStorageFormularAblage` ist die Default-Umsetzung: ein Index
(`jfd_formulare_v1`) mit den Kopfdaten und je Formular ein eigener
Schlüssel (`jfd_formular_<id>`) — getrennt, damit das Auflisten nicht
alle Formulare vollständig einlesen muss. Ein vorhandener Stand unter dem
alten Ein-Dokument-Schlüssel wird beim ersten Laden einmalig als erstes
Formular übernommen; niemand verliert beim Update sein Formular. Der alte
Schlüssel wird weiter mitgeschrieben, damit ein Host, der direkt darauf
zugreift, den aktuellen Stand sieht.

In der Oberfläche ist der Formularname in der Kopfzeile zugleich der
Einstieg: Ein Klick öffnet „Neues Formular", „Formular öffnen …",
„Umbenennen …" und „Speichern unter …". Damit ist auch der Titel dort
änderbar, wo er steht, statt nur in einem Metadaten-Dialog. Löschen fragt
nach, weil es nicht über Rückgängig zurückzuholen ist.

## Konsequenzen

Der Designer wird zum Dokumenteneditor: Mehrere Formulare nebeneinander,
Wechseln ohne Export-Umweg, ein sichtbarer Ort für den Namen. Die Ablage
ist gegen fehlenden oder vollen Speicher abgesichert (Private Mode, Quota)
und verhält sich im Zweifel wie leer, statt den Editor scheitern zu lassen.

Der Preis ist eine zweite Persistenzebene neben dem Auto-Save, die
konsistent bleiben muss: Beim Öffnen wird erst die Ablage umgestellt und
dann der Zustand gesetzt, damit der nachlaufende Auto-Save bereits ins neue
Formular schreibt statt das alte zu überschreiben. Diese Reihenfolge ist
kommentiert und durch einen E2E-Fall abgesichert.

Ein Server-Adapter, der die Ablage anbietet, braucht sie asynchron — die
Schnittstelle erlaubt beides. `HttpFieldStateService` bringt sie bewusst
**nicht** mit: Wie mehrere Formulare auf einem Server abgelegt und
berechtigt werden, hängt am Fachverfahren und ist keine Entscheidung, die
der Editor treffen sollte.

Nicht entschieden: Versionsstände eines Formulars, gemeinsames Bearbeiten
und ein Papierkorb. Gelöscht ist gelöscht — deshalb die Rückfrage.
