# ADR 0007: Neutraler Kern, Regionsprofile und Erweiterungspunkte

**Status:** Akzeptiert (2026-09)
**Kontext:** packages/editor — Kern, `field-types/`, `i18n/`, `config/`, `region/`

## Kontext

Der Editor ist für „die Formularredakteurin im Fachbereich einer Behörde"
gebaut worden, und das ist im Code sichtbar geworden. Nicht als Modul, das
man abschalten könnte, sondern verteilt über den Kern: acht deutsche Sätze in
der Qualitätsprüfung, rund dreißig deutsche Anzeigenamen im Feldtyp-Katalog,
ein Betragsfeld mit Euro im Namen, Platzhalter mit `+49` und `DE89`, eine
Stichwortliste zur Typerkennung, die deutsche Feldbezeichnungen erwartet, und
eine Pflichtangabe „Rechtsgrundlage", die es außerhalb des deutschen
Verwaltungsrechts nicht gibt.

Solange der Editor nur in dieser einen Behörde läuft, ist das kein Fehler,
sondern Passform. Für die Nutzung in einer Gemeinschaft ist es eine Sperre:
Wer nicht auf Deutsch und nicht nach deutschem Verwaltungsrecht arbeitet,
kann den Editor nicht benutzen, sondern nur forken. Und ein Fork erhält keine
Verbesserungen mehr.

Der Editor hat für Austauschbarkeit bereits ein Muster: `FimService`,
`OpenCodeService` und `BausteinService` werden über `EditorConfig.modules.*`
injiziert, mit einer Mock-Implementierung als Default (ADR 0005). Das Muster
trägt für ganze Fachmodule. Es trägt nicht für die Dinge, die im Kern
verstreut sind — für einen Anzeigenamen oder einen Platzhalter ist ein
Dienst die falsche Größe.

## Entscheidung

Drei Schichten, klar getrennt nach dem, was sie kosten:

**1. Der Kern ist neutral.** Er enthält keine Sprache und keine Region. Was
die Redakteurin liest, ist ein i18n-Schlüssel; was eine Funktion liefert,
sind Daten. Die Qualitätsprüfung gibt seit ADR 0002 keine Sätze mehr zurück,
sondern `{ id, schwere, feldScope, werte }` — den Satz baut die Oberfläche,
weil nur sie die Sprache kennt. Dieselbe Regel gilt für alle weiteren
Kern-Funktionen: **Wer keine Oberfläche ist, formuliert keinen Text.**

Der Feldtyp-Katalog behält im Code nur seine Struktur — id, Gruppe, Symbol,
Schema-Fragment. Die Texte (`name`, `label`, `beschreibung`) stehen unter
`i18n.feldtypen[id]`. Ein Test verlangt für jede Katalog-id einen Eintrag in
jedem Sprachkatalog; eine neue Sprache ist damit vollständig oder sie
übersetzt nicht.

**2. Regionales steht in einem Profil, nicht im Kern.** Ein `Regionsprofil`
ist reine Konfiguration: Währungszeichen, Platzhalter je Feldtyp,
zugeschaltete regionale Prüfregeln, Stichwörter der Typerkennung. Der Kern
liefert `REGION_NEUTRAL`; `REGION_DE` ist ein mitgeliefertes Profil wie jedes
andere und hat vor fremden Profilen keinen Vorrang. Regionale Bestandteile
sind **abgeschaltet**, solange kein Profil sie einschaltet — der vorsichtige
Default ist der leere, nicht der gewohnte.

Damit bleibt der Kern frei von der Frage, welche Region „normal" ist. Die
Demo-Anwendung in `packages/app` ist nicht der Kern, sondern das deutsche
Profil: Sie schaltet `REGION_DE` und die Regel `formular-ohne-rechtsgrundlage`
ein. Am sichtbaren Verhalten für die bisherige Nutzerin ändert das nichts.

**3. Erweitert wird über Daten, wo es geht, über Code, wo es muss.**

*Datengetriebene Erweiterungen* sind JSON und zur Laufzeit nachladbar:
Baustein-Kataloge (ADR 0005), Regionsprofile, Formularvorlagen, Stichwörter.
Sie brauchen keinen Build, keine Toolchain und keine JavaScript-Kenntnisse.
Eine Bibliothek weiterzugeben heißt, eine Datei weiterzugeben. Eingehende
Daten sind unvertraute Eingabe und laufen wie Baustein-Kataloge durch eine
Normalisierung, die einzelne unbrauchbare Einträge verwirft, statt das Ganze
scheitern zu lassen.

*Codegetriebene Erweiterungen* sind Pakete und werden beim Zusammenbau der
Anwendung registriert: Fachmodule (FIM, OpenCode), Exportformate (XDF, OFM),
eigene Renderer. Sie können alles, aber sie erfordern einen Build und Vertrauen
— fremder Code läuft mit allen Rechten der Anwendung. Deshalb ausdrücklich
**kein Plugin-Laden zur Laufzeit**: Ein Editor, der Code von einer URL
nachlädt, ist in einer Behörde nicht betreibbar, und die Trennung zwischen
„Daten kann jeder beisteuern" und „Code wird eingebaut" ist genau die Grenze,
an der diese Frage entschieden gehört.

### Die Bibliothek ist lokal

Datengetriebene Erweiterungen liegen in einer **lokalen Bibliothek** — im
Browser der Redakteurin, nicht auf einem Server, den jemand betreiben müsste.
Ein Paket kommt als Datei herein und wird dort abgelegt; der Editor lädt von
sich aus nichts nach. Weitergegeben wird es wie jede Datei, etwa über ein
Git-Repository. Wie die Formular-Ablage (ADR 0006) ist die Bibliothek
austauschbar: Ein Host, der sie zentral pflegen will, hängt eine eigene
Umsetzung ein.

Ein Paket kann nur **hinzufügen**. Eine Feldtyp-id, die der Kern schon führt,
wird verworfen und im Dialog gemeldet — sonst könnte eine Bibliothek
unbemerkt ändern, was „E-Mail-Adresse" bedeutet, und zwei Formulare hießen
dasselbe, ohne es zu sein. Ausgenommen sind Begriffe und das Regionsprofil:
Beides ist ausdrücklich zum Überschreiben da.

### Fachmodule sind aus, bis ein Profil sie einschaltet

FIM und Open CoDE sind Einrichtungen der deutschen Verwaltung. Sie stehen im
Kern deshalb auf `enabled: false`; wer nur JSON-Schema-Formulare bauen will,
bekommt keine zwei Reiter, die er nicht zuordnen kann. Bausteine bleiben an —
vorgefertigte Feldgruppen sind kein deutsches Konzept, und der Standard-Reiter
der Palette darf nicht leer sein (ADR 0005).

## Konsequenzen

Der Editor wird für Dritte benutzbar, ohne ihn zu forken, und die bisherige
Nutzerin merkt davon nichts: Ihr Profil bringt zurück, was vorher fest
verdrahtet war.

Der Preis ist Umweg. Ein deutscher Anzeigename stand bisher an genau einer
Stelle; künftig steht die id im Katalog, der Text in zwei Sprachdateien, und
wer einen Feldtyp hinzufügt, muss alle drei anfassen — sonst schlägt der Test
fehl. Das ist gewollt, aber es ist mehr Arbeit als vorher.

Feldtypen aus Erweiterungen müssen auch die Reducer finden, und die sind
reine Funktionen ohne Kontext. `getFieldType` liest deshalb aus einer
Registrierstelle im Modul, die der Provider füllt. Der Preis ist bekannt: Der
Katalog gilt für die ganze Seite, zwei Editor-Instanzen nebeneinander mit
verschiedenen Bibliotheken gehen nicht. Dieselbe Einschränkung hat ein Theme,
und für den Betriebsfall — eine Anwendung, eine Bibliothek — hat sie keine
Bedeutung.

Die Reduzierstelle liegt an den Reducern. `ADD_FIELD` schreibt ein Label in
den Formularzustand, und Reducer sind reine Funktionen ohne Zugriff auf i18n.
Das Label muss deshalb die Action mitbringen: Die auslösende Komponente kennt
die Sprache, der Reducer nicht. Wo keins mitkommt, bleibt die Feldtyp-id als
Notnagel stehen — sichtbar hässlich, damit die fehlende Übersetzung auffällt
und nicht als englischer Text durchgeht.

Die Sprache des Editors und die Sprache des Formulars sind ab hier zwei
verschiedene Dinge. Eine Redakteurin kann den Editor auf Englisch bedienen
und ein deutsches Formular bauen. Der Formularinhalt gehört dem Formular und
wird nie mitübersetzt — er ist Daten, keine Oberfläche (ADR 0001).

Was diese Entscheidung **nicht** löst: Der Kern kennt weiterhin nur ein
Formularmodell (`FieldAwareState`, ADR 0001) und einen Renderer-Stack
(JSONForms/MUI, ADR 0003). Wer ein anderes Zielformat als JSON Schema braucht,
ist mit diesem Editor nicht bedient; das wäre kein Erweiterungspunkt, sondern
ein anderes Produkt.
