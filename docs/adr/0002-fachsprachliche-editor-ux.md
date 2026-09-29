# ADR 0002: Fachsprachliche Editor-UX für Formularredakteurinnen

**Status:** Akzeptiert (2026-09)
**Kontext:** packages/editor — Editor-Oberfläche

## Kontext

Der Designer ist technisch konsolidiert (ADR 0001, CI, E2E, Supply-Chain-Audit),
liest sich in der Oberfläche aber als Entwicklerwerkzeug: technische Typ-Badges
aus dem JSON-Basistyp, eine Palette aus Rohfeldtypen, unbeschriftete Symbole in
der Kopfzeile und Eigenschaften, die jedem Feld alles anbieten (Steuer-ID-Prüfung
am Geburtsdatum).

Die Zielgruppe verschiebt sich: Nicht die IT baut die Formulare, sondern die
Formularredakteurin im Fachbereich einer Behörde. Sie baut wenige Formulare pro
Jahr und muss ohne Schulung zurechtkommen. Der Editor ist der Einstiegspunkt, um
die Lucom LIP formularweise abzulösen — überzeugen muss er den Fachbereich.

Leitbild der Umstellung: **Fachsprache statt Technik, Bausteine statt Felder,
sichtbare Qualität, klare Hauptaktion.** Leitprinzip des Gesamtprojekts: Was als
Workaround gebaut wird, wird später noch einmal gebaut — dann lieber gleich
richtig.

## Entscheidung

Die Editor-Oberfläche wird auf diese Zielgruppe ausgerichtet. Die Umstellung
liegt **ausschließlich in der Oberfläche**; Datenmodell, Persistenz und Export
bleiben unangetastet. Verbindlich gelten dabei sechs Randbedingungen:

**V1 — Repo-Konventionen gelten vollständig.** Neue Module, Kommentare, Tests und
Commit-Messages auf Deutsch; Conventional Commits mit Begründung im Body und
ohne Co-Authored-By-Trailer; `no-explicit-any` ist Fehler; neue Logik bekommt
Unit-Tests, neue UI-Kernpfade einen E2E-Smoke; keine Laufzeit-CDN-Zugriffe,
`npm audit` bleibt sauber.

**V2 — Das Persistenzformat `jfd_fieldState_v1` bleibt stabil.** Zusätzliche
Felder nur optional und rückwärtskompatibel lesbar, jeweils mit Test „alter
Stand lädt weiterhin". Das 1.0-Kriterium „Persistenzformat-Garantie" der
ROADMAP darf durch die UX-Arbeit nicht verletzt werden.

**V3 — Das Ausgabeformat bleibt JSON Schema + JSONForms UI Schema (und XDF).**
Kein Arbeitspaket ändert, was exportiert wird. OFM-Konformität und
JSONLogic-Validierungen sind Gegenstand eines eigenen Auftrags.

**V4 — Barrierefreiheit darf nicht schlechter werden.** Der bestehende
Tastaturpfad (Enter/Leertaste zum Hinzufügen, Alt+Pfeiltasten zum Umsortieren)
bleibt nach jedem Arbeitspaket funktionsfähig. Neue interaktive Elemente sind
per Tastatur bedienbar, haben zugängliche Namen und erfüllen Kontrast 4,5:1 für
Text.

**V5 — Keine neuen Laufzeit-Abhängigkeiten ohne Begründung.** MUI 7,
JSONForms 3.x und react-dnd bleiben der Baukasten.

**V6 — Fachsprache.** Sichtbare Texte kommen aus `i18n/de.ts` bzw. `en.ts`, nie
hart codiert. In der Standardansicht sind die Begriffe *string, boolean, Bool,
Schema, Scope, Control, JSON* unzulässig; im Code-Modus und in
Entwicklerdialogen bleiben sie erlaubt.

Die Umsetzung erfolgt in Arbeitspaketen, ein Branch und ein Pull Request je
Paket: (1) schnelle Korrekturen an Typ-Badges, Kontrast, Symbolen und
kontextsensitiven Validatoren; (2) eine Kopfzeile mit Formularname,
Speicherstatus und „Ausprobieren" als Hauptaktion; (3) eine neu gegliederte
Palette mit Suche und den Reitern *Bausteine · FIM · Einzelfelder*; (4)
Eigenschaften in den Reitern *Inhalt · Prüfung · Bedingungen · Übersetzung*;
(5) Typvorschläge aus dem Feldlabel; (6) eine Qualitäts-Ampel als reine
Prüffunktion mit Anzeige in der Kopfzeile; (7) die Vorbereitung eines
WYSIWYG-Canvas — dort zunächst nur ADR und ein Prototyp hinter einem
Feature-Flag, weil das gemeinsame Renderer-Paket noch nicht existiert.

Produkt- und Architekturentscheidungen werden in diesen Paketen **nicht** neu
getroffen. Offene Punkte werden im Code-Kommentar bzw. PR-Text mit
`[RÜCKFRAGE AN FABLE: …]` markiert und mit dem vorsichtigsten Default
weitergearbeitet.

## Konsequenzen

Die Oberfläche spricht in der Standardansicht Fachsprache; technische Begriffe
bleiben auf Code-Modus und Entwicklerdialoge beschränkt. Das kostet eine
Übersetzungsschicht zwischen Katalog und Anzeige (gemeinsame, getestete
Ableitung des Feldtyp-Labels aus `FIELD_TYPE_CATALOG` statt aus dem
JSON-Basistyp) sowie gepflegte Zuordnungstabellen — etwa welche Validatoren zu
welchem Feldtyp passen. Diese Tabellen sind bewusst explizit und getestet, damit
sie ohne Codeverständnis erweiterbar bleiben.

Weil Persistenz- und Ausgabeformat unverändert bleiben (V2, V3), ist jedes Paket
für sich auslieferbar und rücknehmbar: Ein Formular, das vor der Umstellung
gespeichert wurde, lädt danach unverändert, und sein Export ist byte-gleich. Die
Prüfung beider Eigenschaften gehört in die Abschlussprüfung jedes Pakets.

Die Qualitäts-Ampel (Paket 6) und die Typvorschläge (Paket 5) sind reine
Funktionen über dem Zustand. Sie erzeugen keine neuen Zuflüsse in den Zustand
(ADR 0001) und sind ohne UI testbar; lediglich das „Ignorieren" eines Vorschlags
wird pro Feld gemerkt und ist damit der einzige — optionale, rückwärtskompatible
— Zuwachs am Persistenzformat.

Nicht Teil dieser Entscheidung sind: OFM-Konformität und JSONLogic-Regeln, das
gemeinsame Renderer-Paket, eine visuelle Neuausrichtung an einem
Verwaltungs-Designsystem (z. B. KERN), Freigabe-Workflow, Mehrbenutzerbetrieb,
Versionsvergleich, Import aus LIP/PDF sowie die Ablösung von react-dnd und
Toolchain-Upgrades.
