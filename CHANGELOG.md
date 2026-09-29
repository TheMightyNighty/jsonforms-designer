# Changelog

Alle wesentlichen Änderungen am Projekt werden in dieser Datei dokumentiert.  
Format nach [Keep a Changelog](https://keepachangelog.com/de/1.0.0/), Versionierung nach [Semantic Versioning](https://semver.org).

---

## [Unreleased]

---

## [0.4.0] — 2026-09-29

**Der Editor ist nicht mehr auf eine Behörde zugeschnitten.** Der Kern kennt
weder Sprache noch Region; Deutschland ist ein Profil wie jedes andere, und
Dritte erweitern ihn über Dateien statt über einen Fork (ADR 0007).

### Umstellung für einbettende Hosts

- **FIM und Open CoDE sind aus** (`modules.fim.enabled`, `modules.openCode.enabled`
  jetzt `false`). Wer sie nutzt, schaltet sie ausdrücklich ein.
- **`createAddFieldAction` hat einen dritten Parameter `label`.** Reducer sind
  reine Funktionen ohne Zugriff auf i18n; die auslösende Komponente reicht den
  Text mit.
- **`feldtypLabel` und `FELDTYP_FALLBACK_LABEL` entfallen.** Feldtyp-Texte
  stehen unter `i18n.feldtypen[<id>]`; `FieldTypeDefinition` trägt weder
  `displayName` noch `defaults.label`/`.description`.
- **`sucheFeldtypen`** bekommt die Namensfunktion hereingereicht,
  **`vorschlagFeldtyp`/`vorschlagWeichtAb`** die Stichwortregeln.
- **`FIELD_GROUPS`** ist jetzt eine Liste von ids, kein Objekt-Array.

Formulare, die mit 0.3.x gebaut wurden, bleiben unberührt — das
Persistenzformat `jfd_fieldState_v1` ändert sich nicht.


### Geändert (Zustand im Render statt im Effekt)
- **`react-hooks/set-state-in-effect` aufgelöst** und von `warn` auf **`error`** gehoben. Fünf der neun Stellen waren abgeleiteter Zustand und werden jetzt im Render angeglichen: Reiterwahl beim Feldwechsel, Bedingung des gewählten Feldes, Werte des Metadaten-Dialogs beim Öffnen, Fehlermeldung beim Reiterwechsel im Code-Modus, und die Selektion, die auf ein gelöschtes Element zeigt. Ein Effekt läuft nach dem Malen — die Redakteurin sah für einen Durchlauf den alten Wert zum neuen Gegenstand.
- **Die Selektion wird abgeleitet statt zurückgesetzt:** Der Zustand bleibt stehen, wenn das Element verschwindet, und Rückgängig bringt die Auswahl wieder mit. Nach außen gilt sie nur, solange es das Element gibt.
- **Vier Stellen bleiben Effekt** — Baustein- und FIM-Katalog laden, Ablage beim Start lesen, Auto-Save-Status: Das ist Synchronisation mit einem äußeren System, keine Ableitung. Sie tragen eine einzeilige Ausnahme mit Begründung; mehrzeilig greift `eslint-disable-next-line` stillschweigend daneben.
- **Latenter Endlos-Effekt entschärft:** Ein Host darf `onError` inline übergeben; dann wechselte `reportError` bei jedem Render die Identität, und ein davon abhängiger Lade-Effekt liefe endlos. Die Lade-Effekte melden jetzt über eine stabile Fassade. Damit ist auch `exhaustive-deps` erfüllt — **Lint läuft ohne Fehler und ohne Warnung** (vorher 11 Warnungen).

### Behoben
- **`ofm-dogfooding` in der CI konnte nie grün sein:** Der Job checkt `ofm-spec` unter demselben Account aus, und das Repository ist noch nicht veröffentlicht (AUFTRAG 2.2). Er prüft jetzt zuerst, ob es erreichbar ist, und überspringt sich mit einer Meldung statt fehlzuschlagen. Ein Check, der dauerhaft rot ist, gewöhnt einem das Hinsehen ab — und dann fällt der echte Befund nicht mehr auf. Sobald `ofm-spec` steht, läuft der Job ohne weitere Änderung.
- **Sicherheits-Header kamen im Produktions-Image nirgends an:** `X-Content-Type-Options`, `Referrer-Policy` und `X-Frame-Options` standen in `docker/nginx.conf`, aber auf Serverebene — und `add_header` wird in nginx nicht ergänzt, sondern **ersetzt**, sobald ein `location`-Block ein eigenes setzt. Jede Anfrage landete in genau so einem Block (`/assets/`, `= /index.html`, auch der SPA-Fallback), also galten sie auf **keinem** Pfad. Die drei Header stehen jetzt in jedem betroffenen Block. Aufgefallen beim ersten lokalen Docker-Build.
- **Regionsprofile verloren beim Zusammenführen Felder:** `vereinigeRegionen` baute ein neues Objekt und ließ `typvorschlaege` und `exportformate` weg. Ein Erweiterungspaket mit eigenem Profil nahm dem deutschen Profil damit still seine Typvorschläge und die Reiter OFM und XDF. Behoben; ein Test über `Required<Regionsprofil>` erzwingt, dass jedes Feld weitergetragen wird — auch jedes künftige.
- **Die Kopfzeile wurde bei jedem Render abgehängt und neu eingehängt:** `HeaderWithMode` war eine im Render erzeugte Komponente, damit bei jedem Durchlauf ein neuer Komponententyp. Sichtbar wurde es erst mit den Erweiterungen — ein hinzugefügtes Paket ändert die Texte, die Kopfzeile wurde neu eingehängt, und der offene Dialog verschwand, bevor die Redakteurin ihr Paket in der Liste sah. Jetzt `useCallback`; zwei E2E-Tests halten den Pfad fest.

### Hinzugefügt (Erweiterungsarchitektur)
- **Erweiterungspakete als JSON** (ADR 0007): eine Datei bringt Feldtypen, Bausteine, ein Regionsprofil und überschriebene Begriffe mit. Kein Build, keine Toolchain — eine Bibliothek weiterzugeben heißt, eine Datei weiterzugeben. Format und Beispiel: `beispiele/erweiterungen/`.
- **Lokale Bibliothek** unter **Ansicht → Erweiterungen …**: hinzufügen, ein- und ausschalten, entfernen. Sie liegt im Browser (`jfd_erweiterungen_v1`) und ist wie die Formular-Ablage austauschbar (`ErweiterungsBibliothek`). Der Editor lädt von sich aus nichts nach.
- **Pakete sind unvertraute Eingabe:** `normalisiereErweiterung` entfernt Prototype-Pollution-Schlüssel, prüft Pflichtangaben und verwirft einzelne unbrauchbare Einträge, statt das ganze Paket scheitern zu lassen. Verworfenes steht im Dialog — auch bei teilweise übernommenen Paketen, sonst sucht jemand vergeblich nach dem fehlenden Feldtyp.
- **Ein Paket kann nur hinzufügen:** Eine Feldtyp-id, die der Kern schon führt, wird verworfen und gemeldet. Begriffe und Regionsprofil sind ausdrücklich zum Überschreiben da; ein Textpfad, den es nicht gibt, wird gemeldet statt still zu verpuffen.
- **`setzeZusatzFeldtypen` / `alleFeldtypen`** im Katalog: `getFieldType` findet auch Feldtypen aus Erweiterungen, damit die Reducer sie kennen. Bewusst Modulzustand — der Katalog gilt damit für die ganze Seite.

- **Erweiterungspakete auch von einer Adresse:** `ladeErweiterungVonUrl` holt ein Paket per `fetch` und normalisiert es wie eine Datei; der Dialog hat dafür ein Adressfeld. Damit genügt eine statische Datei im Intranet oder die Rohansicht im Git-Repository. Fehler sind unterschieden — nicht erreichbar (auch: von der CSP geblockt), kein JSON, kein verwertbares Paket —, weil „geht nicht" der Redakteurin nicht sagt, was zu tun ist. Der Editor ruft weiterhin von sich aus nichts ab.
- **Formularvorlagen als fünfte Beitragsart:** Ein Paket kann fertige Formulare mitbringen; sie stehen in der Vorlagenauswahl hinter den mitgelieferten. Eine id, die der Kern schon führt, wird verworfen und gemeldet — wie bei Feldtypen.

### Geändert (Modul-Defaults)
- **FIM und Open CoDE sind im Kern aus** (`enabled: false`). Beides sind Einrichtungen der deutschen Verwaltung; wer nur JSON-Schema-Formulare bauen will, bekam bisher zwei Reiter, die er nicht zuordnen kann. `packages/app` schaltet sie als deutsches Profil ein. **Für einbettende Hosts eine Umstellung:** Wer FIM oder Open CoDE nutzt, setzt `modules.fim.enabled: true` bzw. `modules.openCode.enabled: true`. Bausteine bleiben an.

### Geändert (Neutraler Kern)
- **Der Kern enthält keine Sprache und keine Region mehr** (ADR 0007). Bisher steckten rund dreißig deutsche Feldtyp-Namen, deutsche Vorgabe-Beschriftungen, Platzhalter mit `+49` und `DE89` und eine Pflichtangabe nach deutschem Verwaltungsrecht fest im Code. Wer nicht auf Deutsch und nicht nach deutschem Recht arbeitet, konnte den Editor bisher nur forken.
- **Feldtyp-Katalog trägt nur noch Struktur:** id, Gruppe, Symbol, Schema-Fragment. Name, Vorgabe-Label und Erläuterung stehen unter `i18n.feldtypen[<id>]`. Ein Test hält Katalog und Sprachdateien deckungsgleich in beide Richtungen — eine fehlende Übersetzung und ein verwaister Text fallen beide auf.
- **`Regionsprofil`** als neue, rein datengetriebene Konfiguration: Platzhalter je Feldtyp, engere Schema-Muster und die regionalen Prüfregeln. Mitgeliefert sind `REGION_NEUTRAL` (Default des Kerns) und `REGION_DE`. Ein Profil, das Prüfregeln mitbringt, schaltet sie ein, ohne dass der Host sie zusätzlich in `pruefung` nennen muss.
- **Die Demo-Anwendung ist das deutsche Profil,** nicht der Normalfall: `packages/app` setzt `region: REGION_DE` und bekommt damit die Platzhalter und die Regel zur Rechtsgrundlage zurück. Für die bisherige Nutzerin ändert sich nichts — mit einer Ausnahme: Der Feldtyp heißt jetzt „Betrag" statt „Betrag (€)", weil das Währungszeichen keine Eigenschaft des Feldtyps ist.
- **`ADD_FIELD`, `COLUMN_DROP` und `CHANGE_FIELD_TYPE` tragen ihre Texte selbst.** Reducer sind reine Funktionen ohne Zugriff auf i18n, die auslösende Komponente kennt die Sprache — also reicht sie Label und Platzhalter in der Action mit. `createAddFieldAction` hat dafür einen dritten Parameter `label`.
- **`feldtypLabel` und `FELDTYP_FALLBACK_LABEL` entfallen;** `vorschlagFeldtyp` liefert keinen `feldtypName` mehr, sondern nur die id, und `sucheFeldtypen` bekommt die Namensfunktion hereingereicht. Ein Prüfhinweis trägt statt eines fertigen Feldtypnamens das Feld `feldtypId`.
- **Property-Schlüssel kommen aus der Beschriftung,** nicht mehr aus zwei gepflegten deutschen Tabellen (`deriveKey`, `derivePropertyKey`, je ~30 Einträge): „Vorname" wird `vorname`, „First name" wird `first_name`. Umlaute und Akzente werden ASCII-gefaltet. Für einige Feldtypen ändert sich der Vorgabeschlüssel neuer Felder (`telefon` → `telefonnummer`, `datum_uhrzeit` → `datum_und_uhrzeit`, `auswahl_mehrfach` → `mehrfachauswahl`, `eintraege` → `wiederholungsgruppe`); bestehende Formulare bleiben unberührt. Die Feldkopie hängt kein `_kopie` mehr an — den eindeutigen Namen vergibt `resolveKey`, und der ist sprachfrei.
- **Die Stichwörter des Typvorschlags stehen im Regionsprofil** (`TYPVORSCHLAEGE_DE`), nicht im Kern: „Geburtsdatum" hilft nur, wer auf Deutsch arbeitet. Ohne Profil schlägt der Editor nichts vor, statt falsch zu raten. `vorschlagFeldtyp` und `vorschlagWeichtAb` nehmen die Regeln als Argument; `pruefEinstellungenFuer(config, region)` setzt zusammen, was gilt.
- **Metadaten-Dialog übersetzt** — er trug alle neun Beschriftungen samt Platzhaltern und Hilfetexten fest im Code. „Herausgebende Behörde" heißt jetzt „Herausgebende Stelle"; die **Rechtsgrundlage erscheint nur**, wenn das Regionsprofil sie verlangt, sonst wäre es ein Feld ohne Bedeutung.
- **Export-Dialog übersetzt** — er trug seine Texte fest im Code, obwohl die Schlüssel in `i18n` längst dastanden und ungenutzt waren. Zusätzlich sind **OFM und XDF regionale Exportformate** (`Regionsprofil.exportformate`): Beides sind Standards der deutschen Verwaltung, und wer nur JSON-Schema-Formulare baut, bekommt jetzt drei Reiter statt fünf. Die Reiter stehen in einer Liste statt an festen Indizes, damit ein abgeschaltetes Format keine Lücke hinterlässt.
- **`validatorZuordnung.ts` bleibt, wo es ist:** Open CoDE ist eine Plattform der deutschen Verwaltung, das Modul **ist** der regionale Teil und läuft ohne `modules.openCode.enabled` gar nicht.
- **`fuelleVorlage`** als gemeinsame Stelle für Platzhalter in Übersetzungstexten (`{name}`, `{anzahl}`); `hinweisText` baut darauf auf und nimmt zusätzliche Werte entgegen.

### Geändert (Werkzeugkette)
- **Toolchain-Upgrade in einem Zug:** TypeScript 6.0.3, ESLint 10 (+ `eslint-config-prettier` 10, `simple-import-sort` 14, `react-hooks` 7), Vite 8, `@vitejs/plugin-react` 6, jsdom 30, Vitest 5, JSONForms 3.8, Monaco 0.57, `@types/node` 26, `@testing-library/jest-dom` 7. `@types/uuid` entfernt (uuid ist seit 0.3.0 keine Abhängigkeit mehr), `@eslint/js` ergänzt (ESLint 10 liefert es nicht mehr mit). **`npm audit`: 0 Findings** (vorher 13, davon 7 hoch).
- **Zwei Upgrades sind gescheitert — mit Grund:**
  - **MUI 9** geht nicht: `@jsonforms/material-renderers@3.8.0` fordert `@mui/material ^7.0.0`. Das Upgrade erzeugt zwei MUI-Instanzen und damit zwei Theme-Kontexte; das KERN-Theme erreichte die gerenderten Formularfelder nicht mehr (ADR 0004). Zurückgenommen.
  - **TypeScript 7** geht nicht: `@typescript-eslint` unterstützt in 8.70.1 nur `<6.1.0`. TS 7 hieße, das gesamte TypeScript-Linting zu verlieren, inklusive `no-explicit-any`. Stattdessen TS 6.0.3, das die Plugins tragen.
- **Monaco 0.57 bildet in seiner exports-Karte `"./*"` auf `./esm/vs/*.js` ab.** Die bisherigen Worker-Importe mit `esm/vs/` liefen dadurch ins Leere (`esm/vs/esm/vs/…`) — im Build als Fehler, im Dev-Server als weiße Seite. Die Pfade tragen das Präfix jetzt nicht mehr. Der E2E-Nachweis „Code-Modus lädt Monaco lokal, null CDN-Requests" läuft weiter grün.
- **`react-hooks/set-state-in-effect`** (neu in Plugin 7) trifft an neun Stellen dasselbe Muster und steht vorerst auf `warn` — mit Begründung in der ESLint-Config und einem ROADMAP-Punkt. Der zugehörige Einzelbefund `static-components` ist behoben.

### Hinzugefügt (Formular-Verwaltung)
- **Mehrere benannte Formulare** (ADR 0006): „Neues Formular", „Formular öffnen …", „Umbenennen …" und „Speichern unter …" — erreichbar über den Formularnamen in der Kopfzeile, der damit zugleich der Ort ist, an dem der Titel geändert wird. Vorher kannte der Editor genau ein Formular; wer ein zweites wollte, musste das erste exportieren und überschreiben. Löschen fragt nach, weil es nicht über Rückgängig zurückzuholen ist.
- **`FormularAblage`** als **optionale** Erweiterung von `FieldStateStorageService` (`readonly ablage?`). Fehlt sie im Adapter des Hosts, arbeitet der Editor unverändert im Ein-Dokument-Betrieb und blendet die Menüpunkte nicht ein — bestehende Einbettungen brechen nicht. Der Name eines Formulars ist sein Titel (`schema.title`), kein zweiter davon unabhängiger Name.
- **`LocalStorageFormularAblage`** als Default: ein Index plus je Formular ein eigener Schlüssel. Ein vorhandener Stand unter dem alten Ein-Dokument-Schlüssel wird beim ersten Laden einmalig übernommen; der alte Schlüssel wird weiter mitgeschrieben.

### Geändert (Oberfläche)
- **Leerer Zustand:** statt eines Satzes oben links in einer leeren Fläche eine sichtbare, mittig gesetzte Ablagefläche mit Überschrift, erstem Schritt und dem Hinweis auf den Tastaturweg. Die Drop-Fläche war vorher unsichtbar (`borderColor: transparent`).
- **Startaufteilung der Spalten** von 1 : 1 : 1 auf 20 / 52 / 28 — das Formular ist der Gegenstand der Arbeit und bekommt die Hauptfläche. Per Griff verstellbar, die Wahl wird gespeichert.
- **Qualitäts-Ampel schweigt am leeren Formular:** Titel und Rechtsgrundlage fehlen dort zwangsläufig; ein frisches Formular mit zwei roten Fehlern zu begrüßen ist entmutigend statt hilfreich. Sobald es Inhalt hat, zählen sie wieder.

### Behoben (Barrierefreiheit)
- **Aufklappbare Palette-Überschriften waren nicht per Tastatur bedienbar** („Eingabe", „OPENCODE", „FIM-Bausteine"): klickbare `div`s ohne Rolle und ohne Fokus. Jetzt echte Schaltflächen mit `aria-expanded` (WCAG 2.1.1).
- **Zwei ineinander verschachtelte `banner`-Landmarks** (ein `<header>` um die AppBar, die selbst eines rendert) — die äußere entfällt. `main` hat einen Namen und trägt das Sprungziel des Skip-Links.
- **Die Seite hatte genau eine Überschrift** (den Produktnamen). Palette, Arbeitsfläche und Eigenschaften sind jetzt benannte Bereiche mit `h2`-Überschrift für die Screenreader-Navigation (visuell unverändert).
- **Horizontales Scrollen bei 320 px Breite** (WCAG 1.4.10): Die Kopfzeile passte nicht. Rückgängig/Wiederholen/Weitere zeigen auf schmalen Bildschirmen nur ihr Symbol (zugänglicher Name bleibt), und die Aktionsgruppe darf umbrechen.

### Behoben
- **Verschieben in einen Container verlor das Element:** `moveElementReducer` entfernte das Element aus seiner Position und fügte es nicht wieder ein, wenn der Zielcontainer nicht gefunden wurde — und gefunden wurde er nur eine Ebene tief, eine Gruppe innerhalb einer Spalte also nie. Beides behoben: Das Ziel wird vor dem Entfernen geprüft, und das Einfügen läuft über dieselbe rekursive Hilfsfunktion wie das Ablegen aus der Palette.

### Geändert (Editor-UX)
- **Feldtyp-Wechsel über Basistypgrenzen ist jetzt möglich** (vorher abgelehnt): Die Auswahl im Reiter „Inhalt" zeigt alle Feldtypen, getrennt in „Gleiche Art von Antwort" und „Andere Art von Antwort". Vor einem nicht verlustfreien Wechsel fragt ein Dialog nach und benennt konkret, was wegfällt — Auswahloptionen, nicht mehr passende Prüfungen und Bedingungen anderer Felder, die einen Wert dieses Feldes vergleichen. Die Aufzählung liegt als reine Funktion `wechselFolgen` und ist getestet; der Reducer entfernt beim Wechsel die Prüfungen, die nicht mehr passen, statt sie unsichtbar am Feld zu lassen. Damit kann der Typvorschlag jetzt immer „Übernehmen" anbieten.

### Geändert (Architektur)
- **Baustein-Katalog kommt aus einem austauschbaren Dienst** statt aus dem Editor-Code (ADR 0005): neues `BausteinService`-Interface, konfiguriert über `EditorConfig.modules.bausteine` — dasselbe Muster wie `FimService` und `OpenCodeService`. Eine Behörde pflegt ihre Bausteinbibliothek damit ohne Editor-Build. Default bleibt der `MockBausteinService` mit den drei als Beispiel gekennzeichneten Bausteinen.
- **`HttpBausteinService`** als Referenz-Adapter: liest den Katalog als JSON (Array oder `{ items }`) von einer konfigurierten URL. Eingehende Einträge sind unvertraute Eingabe und laufen durch `normalisiereBaustein` — Prototype-Pollution-Schlüssel raus, Pflichtangaben geprüft, unbrauchbare Einträge einzeln verworfen und über `onEintragVerworfen` gemeldet, statt den ganzen Katalog scheitern zu lassen. Format dokumentiert im README.
- Das Drag-Item der Bausteine trägt jetzt den vollständigen Baustein statt seiner id — ein asynchroner Katalog lässt sich im Drop-Handler nicht synchron nachschlagen (dieselbe Lösung wie bei FIM-Datenfeldgruppen). Der Einfügepfad bleibt `ADD_FIM_GRUPPE`.

### Hinzugefügt (Editor-UX)
- **Typvorschläge aus der Feldbezeichnung:** Eine reine Funktion `vorschlagFeldtyp` liest die Bezeichnung und schlägt über eine deutsche Stichwortliste den passenden Feldtyp vor (Geburtsdatum → Datum, IBAN → IBAN, Postleitzahl → Textfeld mit PLZ-Prüfung …). Weicht der gewählte Typ ab, erscheint im Reiter „Inhalt" ein nicht blockierender Hinweis mit „Übernehmen" und „Ignorieren"; führt der Vorschlag über eine Basistypgrenze, wird er erklärt, aber nicht angeboten. „Ignorieren" wird pro Feld gemerkt — in `FieldAwareState.typvorschlagIgnoriert`, also im gespeicherten Stand und **nicht** im Export. Alt-Stände ohne das Feld laden unverändert.
- **Qualitäts-Ampel:** Eine reine Funktion `pruefeFormular(state): Hinweis[]` prüft Feld ohne Bezeichnung (Fehler), Pflichtfeld ohne Hilfetext (Hinweis), Bezeichnung länger als `MAX_LABEL_LAENGE` = 80 Zeichen (Hinweis), doppelte Bezeichnungen (Fehler), Formular ohne Titel oder ohne Rechtsgrundlage (Fehler), offener Typvorschlag (Hinweis) und Bedingungen auf gelöschte Felder (Fehler). Die Kopfzeile zeigt den Zähler; ein Klick öffnet die Liste, ein Klick auf einen Eintrag wählt das betroffene Feld aus.
- **Geräte-Ansicht auf der Arbeitsfläche** als Prototyp hinter `EditorConfig.features.canvasGeraeteAnsicht` (Default **aus**): Umschalter Desktop/Handy, der die Fläche auf 390 px verengt, damit sich Auswahl und Umsortieren per Overlay auch dort prüfen lassen. Ohne Flag rendert die Arbeitsfläche exakt wie zuvor. In der Demo-Anwendung über `?geraeteansicht=1` erreichbar.

### Dokumentation
- **ADR 0003 „Arbeitsfläche mit dem Produktiv-Renderer" (Entwurf)**: hält Auswahl, Ziehen und Inline-Bearbeitung als Overlay über gerenderten JSONForms-Controls fest, dazu den Umschalter Desktop/Handy und die Abhängigkeit zum gemeinsamen Renderer-Paket, das noch nicht existiert. Status bewusst „Entwurf" — die Entscheidung fällt, wenn das Paket vorliegt.

### Geändert (Design)
- **Visuelle Neuausrichtung am Verwaltungs-Designsystem KERN** (ADR 0004): Farben, Abstände, Radien, Rahmenbreiten und Typografie kommen aus den KERN-Design-Token statt aus einer eigenen Markenpalette; Schrift ist Fira Sans. Betroffen sind die Werkzeug-Oberfläche (Kopfzeile, Palette, Eigenschaften, Dialoge) **und** die KERN-Vorschau-Variante — beide bauen auf derselben Theme-Funktion auf, die frühere Nachempfindung mit geschätzten Farben entfällt.
- **KERN ist vendored, keine Laufzeit-Abhängigkeit:** `scripts/vendor-kern.mjs` zieht `@kern-ux/native` (EUPL-1.2) einmalig, löst die Token des hellen Themes auf, rechnet die oklch-Werte nach sRGB-Hex um (MUI versteht kein oklch) und schreibt sie als generiertes Modul `kernTokens.ts`; dazu kommen drei Fira-Sans-Schnitte als woff2 (~400 KB), getrimmtes `@font-face`-CSS, Lizenz und Herkunftsnotiz. Keine neue Abhängigkeit in `package.json`, kein Laufzeit-CDN, `npm audit` unverändert. Aktualisierung: `node scripts/vendor-kern.mjs <version>`.
- **Kontrast als Gate statt Zusage:** Ein Unit-Test rechnet die Kontraste der tatsächlich verwendeten Farbpaare nach WCAG 2.1 durch — 4,5:1 für Text (Fließtext, gedämpfter Text, Aktionsfarbe, Rückmeldungen) und 3:1 für Fokusindikator und Feldrahmen.
- **Abschnittsfarben** (Auswahl und Vorgabewert für Abschnittsköpfe) kommen aus den KERN-Token. Gespeicherte Alt-Farben bleiben gültig und werden beim Laden weiterhin über `legacyColorToToken` migriert.

### Geändert (Editor-UX)
- **Eigenschaften in Reitern „Inhalt · Prüfung · Bedingungen · Übersetzung"** (vorher „Allgemein · Validierung · Sichtbarkeit · Übersetzung", hart codiert — die Beschriftungen kommen jetzt aus `i18n`). Strukturelemente zeigen nur den passenden Reiter „Inhalt".
- **Art des Feldes wechselbar:** Im Reiter „Inhalt" steht die Art des Feldes als Auswahl. Angeboten werden nur Arten mit demselben JSON-Basistyp (Text ↔ E-Mail ↔ Datum, nicht Text → Ja/Nein). Neue Action `CHANGE_FIELD_TYPE` mit Reducer-Tests; Bezeichnung, Hilfetext, selbst gesetzter Platzhalter, Property-Schlüssel und damit Bedingungen und Übersetzungen bleiben erhalten.
- **Bedingungen als Satz:** „Nur anzeigen / Ausblenden / Sperren, wenn [Feld] [ist gleich / ist nicht gleich] [Wert]" statt drei getrennter Formularteile mit nachgestellter Erklärung. Ausgabe bleibt der JSONForms-`rule`-Eintrag; `ist nicht gleich` wird als `{ not: { const } }` abgebildet und von der Regel-Auswertung im Testmodus unterstützt. „ist ausgefüllt" wird bewusst nicht angeboten (keine feldartübergreifende Abbildung in `rule.condition`).
- **Palette neu gegliedert:** ein Suchfeld über drei Reitern — **Bausteine** (Standard) · **FIM** · **Einzelfelder** — statt einer flachen Liste aus rund dreißig Rohfeldtypen. Die Suche findet Bausteine (auch über enthaltene Felder: „IBAN" findet „Bankverbindung") und Einzelfelder gemeinsam und ist umlautunempfindlich („strasse" findet „Straße"); FIM behält seine eigene, entfernte Suche im FIM-Reiter. Unter „Einzelfelder" stehen die acht häufigsten Feldtypen oben (Konstante `HAEUFIGE_FELDTYP_IDS`), der Rest unter „Weitere Feldtypen".
- **Bausteine:** vorgefertigte Feldgruppen, die als benannte Gruppe in einem Schritt eingefügt werden — über dieselbe Action wie FIM-Datenfeldgruppen (`ADD_FIM_GRUPPE`), es gibt keinen zweiten Einfügepfad. Der Katalog kommt aus einem austauschbaren Dienst (siehe „Geändert (Architektur)"); der Default enthält drei sichtbar als **„Beispiel"** gekennzeichnete Bausteine (Antragsteller, Anschrift, Bankverbindung), deren fachliche Inhalte noch nicht abgestimmt sind.
- **Tastatur-Hinzufügen für FIM-Einträge** (Enter/Leertaste, wie bei den Katalog-Feldtypen) — schließt den offenen ROADMAP-Punkt für FIM. Bausteine sind ebenfalls per Tastatur einfügbar. OpenCode-Einträge bleiben außen vor: Für sie existiert im Editor gar keine Drop-Zone, auch der Maus-Pfad führt zu nichts (im Modulkopf vermerkt).
- **Kopfzeile mit klarer Aufgabe:** Links stehen Produktname, Formularname und der **Speicherstatus** („Entwurf · gespeichert vor 5 s", bei Fehlern „Speichern fehlgeschlagen" in Rot mit `aria-live`), gespeist aus dem Auto-Save des `FieldStateStorageService`. Rechts stehen beschriftete Aktionen — Rückgängig/Wiederholen und **„Ausprobieren"** als Hauptaktion — statt acht unbeschrifteter Symbole. Code-Modus, Schema kopieren, Import/Export, Vorlagen, Metadaten und Editorsprache liegen im Menü **„Weitere"**. Der Platz für die Qualitäts-Ampel ist im Layout vorgesehen (`data-testid="header-slot-qualitaet"`).
- **Produktname konfigurierbar:** neue optionale `EditorConfig.produktName`. Default bleibt unverändert „JSONForms Designer".

### Behoben (Editor-UX)
- **Typ-Angabe in Fachsprache statt JSON-Basistyp:** Der Eigenschaften-Bereich zeigt jetzt „Art des Feldes: Datum" statt des JSON-Typs. Die Ableitung liegt in einer gemeinsamen, getesteten Funktion (`ermittleFeldtyp`/`feldtypLabel`), die den Feldtyp über eine geordnete Regelliste aus `FIELD_TYPE_CATALOG` zurückgewinnt — ein Rundlauftest sichert, dass jeder Katalog-Feldtyp wieder als genau dieser erkannt wird. Fallback ist „Feld", nie „string".
- **Prüfungen sind kontextsensitiv:** `ValidatorSection` bietet nur noch die Validatoren an, die zur Art des Feldes passen (Zuordnungstabelle `VALIDATOR_FELDTYPEN`) — die Steuer-ID-Prüfung erscheint nicht mehr am Geburtsdatum. Bereits gesetzte Prüfungen bleiben sichtbar, Validatoren ohne Tabelleneintrag werden weiterhin überall angeboten.
- **Fehlendes Symbol bei „Mehrfachauswahl":** Der Katalog verwies auf `ti-checkboxes`, das die vendorte Tabler-Schrift nicht enthält — jetzt `ti-list-check`. Ein Test in der App prüft alle Katalog-Symbole gegen das vendorte CSS.
- **Kontrast der Palette-Überschriften** („EINGABE", „OPENCODE", „FIM-BAUSTEINE" …) von 2,4:1 auf 6,9:1 angehoben (`text.disabled` → `text.secondary`).
- **FIM-Screenshot zeigte keine FIM-Bausteine:** Der Generator prüfte nur die Sichtbarkeit im DOM; bei 1600x900 lag die Sektion unterhalb des Bildausschnitts. Sie wird jetzt in den Sichtbereich gescrollt, und der Generator prüft die Lage im Viewport. Screenshots neu erzeugt.

### Dokumentation
- **ADR 0002 „Fachsprachliche Editor-UX"**: hält die Richtung für die Editor-Oberfläche fest (Zielgruppe Formularredakteurin im Fachbereich, Fachsprache statt Technik) samt der sechs verbindlichen Randbedingungen — Repo-Konventionen, stabiles Persistenzformat `jfd_fieldState_v1`, unverändertes Ausgabeformat, keine Verschlechterung der Barrierefreiheit, keine neuen Laufzeit-Abhängigkeiten, Fachsprache aus `i18n`.

### Qualität
- **Coverage-Gate wieder grün** (Branches 69,8 % → 74,1 %): neue Unit-Tests für `sectionColorTokens`, `manifestMeta`, `layoutWidth` sowie elf zusätzliche Fälle für `columnReducer` (Container-Ziele, Einfügeposition, Nicht-Treffer). Der E2E-Smoke „Vorschau" war nach dem Umbau auf den Testmodus tot und prüft jetzt den Testmodus.

### Sicherheit (Supply Chain)
- **Vertrauensaudit aller 44 Direktabhängigkeiten** (Provenance, Maintainer, Aktivität): 4 verwaiste Runtime-Dependencies entfernt (lodash, json-schema-traverse, uuid, @mui/x-tree-view); `react-dnd` (seit 2022 ungepflegt) als Migrationsziel in der ROADMAP bewertet — Empfehlung `@atlaskit/pragmatic-drag-and-drop`.
- **Tabler-Icon-Font vendored** (nur woff2 + getrimmtes CSS, MIT-Lizenz beigelegt): entfernt `@tabler/icons-webfont` samt transitiver nativer Build-Kette (`svgtofont`/`ttf2woff2` mit Install-Script); der App-Build enthält statt drei Font-Formaten (~4 MB) nur noch das woff2 (457 KB).
- **Dependabot** aktiviert (wöchentlich, gruppierte Minor/Patch-PRs, auch GitHub Actions): Abhängigkeits-Updates kommen als reviewbare PRs statt unbemerkt über Caret-Ranges.

---

## [0.3.0] — 2026-06-12

### Geändert (Performance)
- **Code-Modus lädt lazy:** Monaco (≈ 1 MB gzip) liegt jetzt in einem eigenen Chunk, der erst beim Öffnen des Code-Modus geladen wird (racefrei: `loader.config` lebt im selben Chunk). Initial-Bundle: **≈ 0,48 MB gzip** (zwischenzeitlich 1,5 MB, vor der Monaco-Umstellung 0,55 MB). Die toten Baum-Module (Stufe 2) zahlen mit ein. `CodeModePanel` ist kein Public-Export mehr (nötig für den Split).

### Sicherheit
- **Monaco wird lokal gebündelt statt vom CDN geladen** (`packages/app/src/monacoSetup.ts`): `@monaco-editor/loader` erhält eine self-hosted Instanz, die Worker werden über das Vite-`?worker`-Rezept als eigene Dateien emittiert. Damit ist der Code-Modus **intranet-fähig** (kein Laufzeit-Zugriff auf `cdn.jsdelivr.net` mehr); die CSP wurde entsprechend von jsdelivr-Ausnahmen befreit und blockiert CDN-Regressionen aktiv. Trade-off: das Initial-Bundle wächst (gzip ≈ 0,55 MB → ≈ 1,5 MB).
- **Monaco von 0.52.2 auf 0.55.1 angehoben.** Der alte Pin umging die DOMPurify-Advisories der Monaco-Builds ≥ 0.54; stattdessen erzwingt jetzt ein scoped npm-Override `dompurify ≥ 3.4.9` (fixt u. a. GHSA-v2wj-7wpq-c8vv, GHSA-h8r8-wccr-v5f2 — 8 Advisories). `npm audit`: 0 Findings.
- **vitest auf ≥ 3.2.6** (GHSA-5xrq-8626-4rwp, critical: Datei-Lesezugriff über den Vitest-UI-Server).

### Hinzugefügt
- **Unit-Tests für `xdfExport`** (XML-Escaping/Injection-Schutz, Typ-Mapping, Codelisten, Einschränkungen) **und `fimApiService`** (URL-Bau, Header, Normalisierung, Fehlerfälle) — 28 neue Tests.
- **CI-Workflow** (GitHub Actions): Lint, Typecheck, Tests und Build laufen bei jedem Push/PR.
- **E2E-Smoke-Tests** (Playwright, `packages/app/e2e/`): sichern die Kernpfade gegen den **Produktions-Build** ab — App-Start, Drag & Drop (inkl. Auto-Save über Reload), Eigenschaften-Bearbeitung, JSONForms-Vorschau, Code-Modus (verifiziert: Monaco lädt lokal, **null CDN-Requests**) und Export-Dialog. Lokal: `npm run test:e2e`; in der CI nach dem Build.
- **Persistenz-Adapter** (`FieldStateStorageService`): Der Formular-Zustand wird nicht mehr fest in `localStorage` gespeichert, sondern über eine austauschbare Schnittstelle (Prop `fieldStateStorage` am `<JsonFormsEditor>`). Default bleibt localStorage (`LocalStorageFieldStateService`); asynchrone Adapter (REST-Backend) werden nach dem Mount hydriert. README enthält ein HTTP-Adapter-Beispiel.
- **Qualitäts-Gates verschärft:** Coverage-Schwellwerte als Regressions-Gate (`@vitest/coverage-v8`, Werte knapp unter Ist-Stand, werden nur angehoben); erste **Komponenten-Tests** mit Testing Library (Palette-Tastaturpfad, ErrorBoundary→onError, MetadataDialog); E2E-Suite läuft zusätzlich in **Firefox** (16 Läufe gesamt).
- **Betriebsartefakte:** Multi-Stage-`Dockerfile` (node → nginx, Healthcheck, Port 8080), Referenz-`nginx.conf` (SPA-Fallback, Cache-Strategie, Security-Header, auskommentierter FIM-Reverse-Proxy für abgeschottete Netze) und `docs/BETRIEB.md` (Deploy, CSP-Erklärung, Persistenz, Diagnose, Update-Prozess).
- **Betriebs-Diagnostik:** Neue Prop `onError(error, kontext)` als zentraler Fehlerkanal (Laden, Auto-Save, Render-Fehler der ErrorBoundary) — Default bleibt `console.error`. Die Editor-Version (aus `package.json`) wird im Header angezeigt.
- **`HttpFieldStateService`** als Paket-Export: Referenz-Adapter für Server-Persistenz (GET/PUT, debounced, 404-Behandlung, `onSaveError`-Kanal, injizierbares `fetch`) — 5 Unit-Tests.
- **Pre-Commit-Hooks** (husky + lint-staged): Prettier und ESLint-Autofix laufen auf den gestagten Dateien vor jedem Commit — Format-Drift kann nicht mehr einsickern.
- **Projekt-Doku:** `CONTRIBUTING.md` (Setup, Konventionen, Qualitäts-Gates), `ROADMAP.md` und ADR-Verzeichnis (`docs/adr/`). README-Screenshots auf das aktuelle helle Theme aktualisiert — reproduzierbar über einen Playwright-Generator (`GEN_SCREENSHOTS=1`, FIM gemockt).
- **Tastatur-Alternativpfad zum Drag & Drop (BITV):** Palette-Einträge sind fokussierbar (`role="button"`); Enter/Leertaste fügt den Feldtyp ans Formularende an (im aktiven Tab). **Umsortieren per Alt+Pfeiltasten** auf der fokussierten Feld-Zeile (`aria-keyshortcuts`).

### Behoben
- **Bedingte Anzeige wirkte nie in der Vorschau:** `toJsonForms` verwarf die `rule` — JSONForms bekam die Bedingungen nicht zu sehen. `rule` wird jetzt auf allen Konverter-Pfaden (fromLegacy/toLegacy/toJsonForms) erhalten und ist getestet.
- **Einfügen hinter Spalten-/Gruppen-Containern** landete am Listenende statt direkt dahinter (`insertControl` matchte nur `scope`, Container haben aber nur eine `id`).
- **Strukturelle Elemente (Überschriften, Hinweise) in mehrstufigen Formularen** wurden immer Tab 1 zugeordnet (Identitäts-Mismatch zwischen Element-id und Pseudo-Scope der Tab-Zuweisung).
- **Reorder auf die oberste Drop-Zone** sortierte das Element fälschlich ans Ende statt an den Anfang (`reorderElementReducer` ohne `insertAfterKey`) — beim Bau des Tastatur-Umsortierens gefunden, durch 4 neue Reducer-Tests abgesichert.

### Geändert (Architektur)
- **State-Konsolidierung, Stufe 3 (ADR 0001):** `uiSchema.elements` ist jetzt die strikte `UiElement`-Union (ids verpflichtend, Narrowing statt Casts in allen Reducern/Komponenten). Lose Eingangsformen (`FlatElement`/`FieldStateInput`: Templates, Import, Code-Modus, Storage, SchemaService) werden ausschließlich an den Grenzen über `fromLegacy()` normalisiert — alte gespeicherte Stände werden beim Laden automatisch migriert.
- **State-Konsolidierung, Stufe 2 (ADR 0001) — Breaking:** Die komplette geerbte Baum-Welt wurde entfernt (≈ 5.000 LOC): alte Palette, Droppable-Renderer, `SchemaElement`-/`EditorUISchemaElement`-Modell, `schemasUtil`/`tree`/`clone`, `paletteService`/`propertiesService`/`categorizationService` sowie die zugehörigen `JsonFormsEditor`-Props (`schemaProviders`, `schemaDecorators`, `editorRenderers`, `propertyRenderers`, `paletteService`, `categorizationService`, `propertiesServiceProvider`) und Public-Exporte. Alle 30 Action-Cast-Nähte (`as unknown as EditorAction`) sind beseitigt — sie waren nach der Union-Bereinigung überflüssig. Details und vollständige Liste: `docs/adr/0001`.
- **State-Konsolidierung, Stufe 1 (ADR 0001):** `FieldAwareState` ist die einzige Laufzeit-Quelle. Extern geladene Schemas (`schemaService`) werden über `fieldStateFromSchemas()` in den Form-First-Zustand konvertiert statt den geerbten Baum-State aufzubauen; der Baum-Render-Zweig (`Editor.tsx`) und der tote `NEW_UI_SCHEMA_ELEMENT`-Drop (`EmptyEditor`) sind entfernt. Die Prop `editorRenderers` ist deprecated (wirkungslos). Verlustfrei konvertiert: Control, Label, HorizontalLayout/Spalten, Group; Best-Effort für exotische Knoten (z. B. Categorization → Label). Stufe 2 (Entfernung der toten Baum-Module) siehe ADR.

### Geändert (Qualität / Tooling)
- **ESLint 9 Flat-Config** eingerichtet (`eslint.config.mjs`): `typescript-eslint`, `simple-import-sort` und `eslint-plugin-react-hooks` verdrahtet. Zuvor existierte keine Konfiguration — `npm run lint` lief ins Leere.
- **Prettier** als eigenständige Skripte ergänzt (`npm run format` / `format:check`); gesamter `src`-Bestand einmalig formatiert. `eslint-plugin-prettier` entfernt, `eslint-config-prettier` bleibt für Regel-Deduplizierung.
- **`no-explicit-any` vollständig beseitigt**: alle 180 `any`-Vorkommen durch konkrete Typen (`JsonSchema7`, `UISchemaElement`, `FlatElement`, `unknown` mit gezielten Casts) ersetzt. `npm run lint` ist jetzt fehlerfrei.
- **Test-Suite repariert**: die Feldtypen-Katalog-Tests (`fieldTypes.test.ts`, `addFieldReducer.test.ts`) waren gegenüber dem auf 30+ Typen gewachsenen Katalog veraltet (strukturelle Einträge, `integer`, `file-upload`) — angeglichen, 312/312 grün.

---

## [0.2.1] — 2026-06-01

### Sicherheit
- Alle bekannten Abhängigkeits-CVEs behoben (`npm audit`: 7 moderate → 0): `vitest` auf 3.x angehoben; die Monaco-Runtime wird auf die auditierte Version `0.52.2` gepinnt statt ungepinnt vom CDN geladen (umgeht die DOMPurify-Advisories der Monaco-Builds ≥ 0.54).
- **Tabler-Icons** werden self-hosted gebündelt statt ohne Subresource Integrity vom CDN geladen.
- **Content-Security-Policy** für den Produktions-Build ergänzt (greift nur im Build, damit der Dev-HMR funktioniert).
- Schutz gegen **Prototype Pollution** (`__proto__`/`constructor`/`prototype`) beim Datei-Import und beim Laden aus `localStorage`.
- Clipboard nutzt die `navigator.clipboard`-API mit Legacy-Fallback.

### Dokumentiert
- **FimApiService**: Vertrauensanforderung an `baseUrl`/`headers` (Schutz vor SSRF / Credential-Leak) im Code dokumentiert.

---

## [0.2.0] — 2026-05-31

### Hinzugefügt
- **FIM-Bausteine-Integration**: Vollständige Anbindung an das Föderale Informationsmanagement (FIM) über die FitKo-API (`fimportal.de/api/v1`). Datenfelder und Datenfeldgruppen werden per Drag & Drop in den Editor übernommen.
- **EditorConfig**: Props-basierte Konfigurationsschicht am `<JsonFormsEditor>`-Component. Module (FIM, OpenCode) sowie Palette-Defaults sind vollständig konfigurierbar.
- **FimApiService**: HTTP-Client für die FIM-Portal-API mit konfigurierbarer Basis-URL, serverseitiger Suche und Response-Normalisierer.
- **Bedingte Anzeige**: JSONForms-native `rule`-Unterstützung. Im Properties-Panel wird für jedes Feld eine Bedingung mit Quellfeld, Vergleichswert und Effekt (SHOW / HIDE / DISABLE) konfiguriert.
- **Formular-Metadaten**: Dialog für Titel, Beschreibung, herausgebende Behörde, Rechtsgrundlage, Versionsnummer und Gültigkeitsdatum. Gespeichert als JSON-Schema-konforme `x-*`-Felder.
- **XDatenfelder-Export (XDF 2.0)**: Generierung einer XDF-2.0-konformen XML-Datei aus dem aktuellen Formularschema. Abrufbar über den Export-Dialog.
- **Wiederholungsgruppe**: Neuer Feldtyp (`type: array`) mit JSONForms-nativer Add/Remove-Steuerung.
- **Mehrsprachige Formulare**: Übersetzungseditor im Properties-Panel. Feldbezeichnungen, Hilfetexte und Platzhalter werden pro Sprache (EN/FR/PL/TR/AR/UK) in `schema.x-translations` gespeichert.
- **Druckansicht**: Print-CSS-Integration und Drucken-Button in der Vorschau-Toolbar.
- **Seitenumbruch-Stepper**: Mehrstufige Formulare werden in der Vorschau mit einem anklickbaren MUI-Stepper navigiert.
- **Einklappbare Palette**: Alle Feldtyp-Gruppen sowie die OpenCode- und FIM-Sektionen sind einzeln ein- und ausklappbar.
- **Helles Material-Design-Theme**: Weiße Editor-Canvas, hellgraue Seitenleisten, weißer AppBar mit Primärfarb-Akzent. Orientiert an Material Design 3.
- **WCAG-Quickwins**: Skip-Link, `focus-visible`-Outline (3 px, Kontrastverhältnis ≥ 3:1), `lang="de"` am HTML-Element.

### Geändert
- **FimPaletteSection**: Browse-Modus zeigt Datenfeldgruppen als ziehbare Karten mit Feldvorschau. Such-Modus trennt Gruppen und Einzelfelder.
- **Properties-Panel**: Bedingte Anzeige und Übersetzungseditor als zusätzliche Abschnitte.
- **Header**: Formular-Titel wird in der Titelleiste angezeigt. Metadaten-Button (ⓘ) ergänzt.
- **ImportExportDialog**: Neuer XDF-2.0-Tab mit Download-Button.
- **PreviewPanel**: Print-Toolbar, Seitenumbruch-Stepper, Formular-Titel-Badge.
- **fieldPropertiesReducer**: Element-Traversierung ist rekursiv (Felder in Spalten und Gruppen werden korrekt gefunden).

---

## [0.1.0] — 2025-05-01

### Hinzugefügt
- Initiale Veröffentlichung
- Form-First-Architektur mit `FieldAwareState`
- Drag & Drop aus Palette (30+ Feldtypen)
- Spalten-Layouts (2/3/4-spaltig, freie Breiten)
- Mehrstufige Formulare (Tab-System)
- Undo/Redo (50 Schritte)
- Code-Modus (Monaco Editor)
- Vorschau-Modus (JSONForms-Rendering)
- Auto-Save in `localStorage`
- Export/Import als JSON
- OpenCode-Integration (Validatoren, UI-Bausteine)
- DE/EN-Lokalisierung

[Unreleased]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/TheMIghtyNighty/jsonforms-designer/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/TheMIghtyNighty/jsonforms-designer/releases/tag/v0.1.0
