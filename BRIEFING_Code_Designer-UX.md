# Briefing für Claude Code: jsonforms-designer — Editor-UX auf Behörden-Niveau

**An:** Claude Code (neue Session im Repo `TheMightyNighty/jsonforms-designer`)
**Rolle:** Du setzt eine bereits entschiedene UX-Richtung in Arbeitspaketen um. Du triffst KEINE neuen Produkt- oder Architekturentscheidungen. Bei Unklarheit markierst du die Stelle im Code-Kommentar bzw. im PR-Text mit `[RÜCKFRAGE AN FABLE: ...]` und arbeitest mit dem vorsichtigsten Default weiter, statt zu entscheiden.

---

## Kontext (5 Sätze)

Der Designer ist technisch solide (CI, E2E, ADRs, Supply-Chain-Audit), wirkt aber wie ein Entwicklerwerkzeug: technische Typ-Badges, eine Palette aus Rohfeldtypen, acht unbeschriftete Symbole in der Kopfzeile, nicht kontextsensitive Eigenschaften. Zielgruppe ist künftig die Formularredakteurin im Fachbereich einer Behörde, die wenige Formulare pro Jahr baut und ohne Schulung zurechtkommen muss. Der Editor ist der Einstieg, um die Lucom LIP formularweise abzulösen; überzeugen muss er den Fachbereich, nicht die IT. Leitbild: Fachsprache statt Technik, Bausteine statt Felder, sichtbare Qualität, klare Hauptaktion. Leitprinzip des Gesamtprojekts: „Alles, was wir jetzt als Workaround bauen, machen wir später noch einmal. Dann lieber gleich richtig.“

---

## Verbindliche Vorgaben (nicht verhandelbar)

### V1 — Repo-Konventionen gelten vollständig

Lies vor dem ersten Commit `CONTRIBUTING.md`, `ROADMAP.md` und `docs/adr/0001-fieldstate-als-single-source.md`. Insbesondere:

- Neue Module, Kommentare, Tests und Commit-Messages auf **Deutsch**
- **Conventional Commits**, Begründung im Body. `CONTRIBUTING.md` verlangt **keinen Co-Authored-By-Trailer** — die Repo-Konvention hat Vorrang.
- `no-explicit-any` ist Fehler
- **`FieldAwareState` ist die einzige Laufzeit-Quelle** (ADR 0001) — keine neuen Zuflüsse in den geerbten Baum-State
- Neue Logik (Reducer, Utils) bekommt Unit-Tests, neue UI-Kernpfade einen E2E-Smoke
- **Keine Laufzeit-CDN-Zugriffe**, `npm audit` bleibt sauber

### V2 — Persistenzformat bleibt stabil

`jfd_fieldState_v1` darf sich nicht inkompatibel ändern (1.0-Kriterium „Persistenzformat-Garantie“). Braucht ein Arbeitspaket zusätzliche Felder, dann nur optional und rückwärtskompatibel lesbar, mit Test „alter Stand lädt weiterhin“. Alles darüber hinaus: `[RÜCKFRAGE AN FABLE]`.

### V3 — Ausgabeformat bleibt JSON Schema + JSONForms UI Schema

Kein Arbeitspaket ändert, was exportiert wird (Schema, UI Schema, XDF). Die UX-Arbeit liegt ausschließlich in der Editor-Oberfläche. OFM-Konformität und JSONLogic-Validierungen sind **nicht** Teil dieses Auftrags (eigener Brief 2.4).

### V4 — Barrierefreiheit darf nicht schlechter werden

Der bestehende Tastaturpfad (Enter/Leertaste zum Hinzufügen, Alt+Pfeiltasten zum Umsortieren) muss nach jedem Paket funktionieren. Neue interaktive Elemente sind per Tastatur bedienbar, haben zugängliche Namen und erfüllen Kontrast 4,5:1 für Text.

### V5 — Keine neuen Laufzeit-Abhängigkeiten ohne Begründung

MUI 7, JSONForms 3.x, react-dnd bleiben. Braucht ein Paket eine neue Abhängigkeit, dann `[RÜCKFRAGE AN FABLE]` mit Begründung und Alternative ohne Abhängigkeit.

### V6 — Fachsprache

Sichtbare Texte kommen aus `i18n/de.ts` bzw. `en.ts`, nie hart codiert. Verbotene sichtbare Begriffe in der Standardansicht: *string, boolean, Bool, Schema, Scope, Control, JSON*. Im Code-Modus und in Entwicklerdialogen bleiben sie erlaubt.

---

## Arbeitspakete

Reihenfolge = Priorität. **Ein Branch und ein PR pro Arbeitspaket.** Vor Beginn einmal alle Qualitäts-Gates auf `main` laufen lassen und das Ergebnis als Ausgangslage notieren.

### AP 0 — ADR für die Richtung

Lege `docs/adr/0002-fachsprachliche-editor-ux.md` an (Kontext → Entscheidung → Konsequenzen), das die Vorgaben V1–V6 und die Arbeitspakete in drei, vier Absätzen festhält. Kein Code.

### AP 1 — Schnelle Korrekturen

1. **Typ-Badges aus dem Feldtyp, nicht aus dem JSON-Basistyp.** `FieldFormPreview.tsx` (`TYPE_LABELS`) zeigt heute den JSON-Typ: Ein korrekt als Datum angelegtes Feld (`type: string, format: date`) erscheint als „Text“, ein Ja/Nein-Feld als „Bool“. `ColumnContainerRow.tsx` zeigt sogar roh „string“. Beide Stellen leiten das Badge künftig über eine gemeinsame, getestete Funktion aus `FIELD_TYPE_CATALOG` ab (Datum, IBAN, Ja/Nein …); Fallback in Fachsprache.
2. **FIM-Screenshot reparieren.** `screenshots.gen.spec.ts` prüft zwar, dass „Anschrift Inland“ im DOM sichtbar ist, bei 1600×900 liegt die FIM-Sektion aber unterhalb des sichtbaren Bereichs — `docs/screenshot-fim.png` zeigt deshalb keine FIM-Bausteine. Sektion in den Sichtbereich bringen (z. B. `scrollIntoViewIfNeeded`, andere Sektionen zuklappen) und Screenshots neu erzeugen.
3. **Kontrast der Palette-Überschriften** („EINGABE“, „AUSWAHL“ …) auf mindestens 4,5:1 anheben.
4. **Fehlendes Symbol** bei „Mehrfachauswahl“ ergänzen.
5. **Validatoren kontextsensitiv.** `ValidatorSection.tsx` bietet heute jedem Feld alle Validatoren an (Steuer-ID am Geburtsdatum). Filtern nach Feldtyp über eine explizite, getestete Zuordnungstabelle. Liefert `OpenCodeBaustein` keine Typinformation: Tabelle im Editor pflegen und `[RÜCKFRAGE AN FABLE]` zur Frage, ob das Interface erweitert werden soll.

### AP 2 — Kopfzeile mit klarer Aufgabe

- **Links:** Formularname und Speicherstatus („Entwurf · gespeichert vor 5 s“ / „Speichern fehlgeschlagen“), gespeist aus den vorhandenen Speicher- und Fehlerereignissen (`fieldStateStorage`, `onError`).
- **Rechts, beschriftet (Symbol + Text):** Rückgängig/Wiederholen, **„Ausprobieren“** (bisherige Vorschau) als Hauptaktion, ein Platz für die Qualitäts-Ampel aus AP 6.
- **Menü „Weitere“** für: Code-Modus, Schema kopieren, Import/Export, Vorlagen, Metadaten, Editorsprache.
- **Produktname** konfigurierbar über `EditorConfig` (neuer optionaler Parameter), Default bleibt vorerst unverändert: `[RÜCKFRAGE AN FABLE: endgültiger Produktname]`.
- Eine Aktion „Zur Freigabe“ **nicht** anlegen, solange es keinen Freigabe-Workflow gibt — nur den Platz im Layout vorsehen und im PR vermerken.
- E2E-Smoke anpassen: Die bisherigen `getByRole('button', { name: … })`-Selektoren müssen weiter greifen oder bewusst umgestellt werden.

### AP 3 — Palette neu gliedern

- **Suchfeld oben**, durchsucht alle Reiter.
- **Drei Reiter:** *Bausteine* (Standard) · *FIM* · *Einzelfelder*.
- **Einzelfelder:** die acht häufigsten sichtbar (Textfeld einzeilig, Textfeld mehrzeilig, Datum, Betrag, Ja/Nein, Auswahl, E-Mail, Datei-Upload), der Rest unter „Weitere Feldtypen“. Die Auswahl der acht als Konstante mit Kommentar, damit sie leicht zu ändern ist.
- **Bausteine:** Mechanismus für vorgefertigte Feldgruppen (benannter Container mit mehreren Feldern, Hilfetexten, Pflichtangaben, optional `x-fim-id`), eingefügt über dieselbe Action-Logik wie FIM-Gruppen. Inhalt zunächst **drei als „Beispiel“ gekennzeichnete Bausteine** (Antragsteller, Anschrift, Bankverbindung). Fachliche Inhalte der Bausteine: `[RÜCKFRAGE AN FABLE]`, nicht selbst ausdenken.
- Tastaturpfad gilt für alle drei Reiter (schließt den offenen Roadmap-Punkt „Tastatur-Hinzufügen auch für FIM-/OpenCode-Einträge“).

### AP 4 — Eigenschaften in Reiter

Reiter: **Inhalt** · **Prüfung** · **Bedingungen** · **Übersetzung**.

- *Inhalt:* Label, Hilfetext, Platzhalter, Pflichtfeld und **Feldtyp sichtbar**. Typwechsel nur zwischen Typen mit gleichem JSON-Basistyp (z. B. Text ↔ E-Mail), als neue Action mit Reducer-Test. Andere Wechsel: `[RÜCKFRAGE AN FABLE: Verhalten bei Datenverlust]`.
- *Prüfung:* die gefilterten Validatoren aus AP 1.5.
- *Bedingungen:* Die vorhandene `ConditionEditor.tsx` wird als Satz dargestellt: „Nur **anzeigen** / **ausblenden** / **sperren**, wenn [Feld] [ist gleich / ist nicht gleich / ist ausgefüllt] [Wert]“. Ausgabe bleibt der bestehende JSONForms-`rule`-Eintrag (V3). Operatoren, die `rule.condition` nicht abbilden kann, nicht anbieten.
- *Übersetzung:* bestehender `TranslationEditor`.
- Bei Strukturelementen (`StructuralPropertiesPanel`) nur die passenden Reiter.

### AP 5 — Typvorschläge

Reine Funktion `vorschlagFeldtyp(label: string): FeldtypId | undefined` mit deutscher Stichwortliste (Geburtsdatum/Datum → Datum, IBAN → IBAN, E-Mail → E-Mail, Telefon → Telefon, Postleitzahl/PLZ → Text mit PLZ-Validator …) und umfangreichen Tests inklusive Negativfällen. Weicht der gewählte Typ vom Vorschlag ab, erscheint im Reiter *Inhalt* ein nicht blockierender Hinweis mit „Übernehmen“ und „Ignorieren“. „Ignorieren“ wird pro Feld gemerkt (V2 beachten).

### AP 6 — Qualitäts-Ampel

Reine Funktion `pruefeFormular(state): Hinweis[]` (`{ id, schwere: 'fehler' | 'hinweis', feldScope?, text }`) mit Tests. Erste Prüfregeln:

- Feld ohne Label
- Pflichtfeld ohne Hilfetext (Hinweis)
- Label länger als 80 Zeichen (Hinweis)
- Doppelte Labels
- Formular ohne Titel oder ohne Rechtsgrundlage in den Metadaten
- Offener Typvorschlag aus AP 5 (Hinweis)
- Bedingung verweist auf gelöschtes Feld (Fehler)

Schwellenwerte als benannte Konstanten. Anzeige: Zähler in der Kopfzeile (AP 2); ein Klick öffnet eine Liste, ein Klick auf einen Eintrag wählt das betroffene Feld aus.

### AP 7 — Vorbereitung WYSIWYG (nur ADR und Prototyp)

Die Mitte soll künftig das echte Formular zeigen, gerendert mit dem **gemeinsamen Renderer-Paket**, das aus `vsp-poc` herausgelöst wird (eigener Brief 2.3). Dieses Paket existiert noch nicht. Deshalb hier **nur**:

1. ADR-Entwurf `0003-canvas-mit-produktivrenderer.md`: Auswahl, Ziehen, Inline-Bearbeitung als Overlay über gerenderten JSONForms-Controls; Umschalter Desktop/Handy; Abhängigkeit zum Renderer-Paket.
2. Prototyp hinter einem Feature-Flag in `EditorConfig` (Default aus), der mit den vorhandenen Material-Renderern zeigt, dass Auswahl und Umsortieren per Overlay funktionieren. Die bestehende Listenansicht bleibt Standard und unverändert.

---

## Nicht Teil dieses Auftrags

- OFM-Konformität, JSONLogic-Validierungsregeln, Manifest (Brief 2.4)
- Gemeinsames Renderer-Paket (Brief 2.3)
- Visuelle Neuausrichtung an einem Verwaltungs-Designsystem (z. B. KERN) — eigene Entscheidung
- Freigabe-Workflow, Mehrbenutzerbetrieb, Versionsvergleich
- Import aus LIP/PDF, Migrationstool-Integration
- Ablösung von react-dnd, Toolchain-Upgrades (TS 6, MUI 9, Vitest 4)

---

## Abschlussprüfung pro Arbeitspaket (Checkliste für dich)

1. Laufen `lint`, `format:check`, `typecheck`, `test`, `build`, `test:e2e` grün?
2. Hat neue Logik Unit-Tests und jeder neue UI-Kernpfad einen E2E-Smoke?
3. Lädt ein gespeicherter Stand aus `main` weiterhin fehlerfrei (V2)?
4. Ist der Export (Schema, UI Schema, XDF) für ein unverändertes Formular byte-gleich zu vorher (V3)?
5. Funktioniert der komplette Ablauf „Feld hinzufügen, bearbeiten, umsortieren, löschen“ nur per Tastatur (V4)?
6. Taucht in der Standardansicht einer der verbotenen Begriffe aus V6 auf?
7. Sind die Screenshots neu erzeugt, und hast du sie **angesehen** (nicht nur erzeugt)?
8. Hat `CHANGELOG.md` einen Eintrag unter „Unreleased“?
9. Hast du irgendwo eine Produkt- oder Architekturentscheidung getroffen, statt `[RÜCKFRAGE AN FABLE]` zu setzen?

Beende jedes Arbeitspaket mit einem kurzen Bericht: was umgesetzt ist, welche Rückfragen offen sind, was du bewusst nicht gemacht hast.
