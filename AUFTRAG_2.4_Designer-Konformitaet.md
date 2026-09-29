# AUFTRAG 2.4 — Designer-Export OFM-konform machen (Demo-Voraussetzung)

**Für:** Claude Code (Repo: jsonforms-designer) · **Modell:** Sonnet.
**Warum kritisch:** Der Designer erzeugt heute kein Manifest, schreibt Metadaten als x-Felder ins Schema (verletzt OFM-R-304) und exportiert Freitext-Farben/eigene Breiten. Der Validator würde das eigene Referenzwerkzeug durchfallen lassen — der „KONFORM"-Moment der Demo fiele rot aus. Dieser Auftrag stellt Produzenten-Konformität Klasse A her.

**Grundlage:** Spec-Kapitel im ofm-spec-Repo (Kapitel 2, 3, 4 + Nachträge). Bei Widersprüchen: konservativste Lesart, Befund in SPEC-FINDINGS.md des ofm-spec-Repos melden, Spec nie ändern.

## Umsetzungspunkte

1. **Manifest-Erzeugung (OFM-R-200 ff.):** Beim Export entsteht `form.manifest.json` — formatVersion "1.0.0", form-Block aus dem Metadaten-Dialog (id als URN, version, title, publisher, legalBasis, validFrom, language), conformanceClass "A", artifacts-Block mit relativen Pfaden und SHA-256 der tatsächlich exportierten Dateien (Hash NACH Serialisierung berechnen). Export liefert künftig einen Ordner/ZIP: manifest + schema.json + uischema.json.
2. **Metadaten-Umzug (OFM-R-304):** Der Metadaten-Dialog schreibt in den Manifest-Datenhalter, nicht mehr als x-publisher/x-legal-basis/x-version/x-valid-from ins Schema. **Migration beim Laden:** Findet der Import Alt-Schemata mit diesen x-Feldern, werden sie in den Manifest-Zustand übernommen und aus dem Schema entfernt (mit Hinweis-Toast). x-fim-id/x-fim-version/x-codelist-id bleiben am Feld.
3. **URN-Feld:** Metadaten-Dialog erhält ein Feld „Formular-ID (URN)" mit Muster-Validierung `^urn:[a-z0-9][a-z0-9-]{0,31}:` und Vorschlags-Generator aus Herausgeber+Titel (slugifiziert).
4. **sectionColor-Token (OFM-R-421):** Interne Abschnittsfarben auf die Token-Liste `blue | green | yellow | red | purple | gray` mappen (nächstliegender Token; Zuordnungstabelle im Code dokumentieren). Export schreibt `options["ofm:sectionColor"] = "<token>"`. Der Farbwähler im Editor zeigt künftig genau diese sechs Token.
5. **Breiten-Export (Options-Registry):** Internes Spaltenbreiten-Modell auf `options["ofm:width"]` (Ganzzahl 1–12) exportieren; beim Import zurückmappen.
6. **Plain-Text-Garantie (OFM-R-404):** Sicherstellen, dass Hinweistexte/Labels als reiner Text in `Label`-Elemente exportiert werden; falls der Editor irgendwo HTML zulässt, beim Export strippen und im Editor-UI unterbinden.
7. **Validator im CI (Dogfooding):** CI-Job, der ein Beispielprojekt exportiert und `ofm-validate` (aus dem ofm-spec-Repo, als Git-Referenz oder npm-file-Dependency) darüber laufen lässt. Build rot, wenn nicht KONFORM Klasse A.
8. **Demo-Fixtures:** `demo/bewohnerparkausweis/` (konform, für den Grün-Moment) und `demo/demo-fehler/` (Kopie mit eingebautem if/then → OFM-R-320, für den Rot-Moment) im Repo ablegen; werden im Demo-Drehbuch referenziert.

## Definition of Done

1. Live gebautes Formular → Export → `ofm-validate <ordner>` → **Exit 0, „OFM 1.0, Klasse A: KONFORM"**.
2. Alt-Projekt mit x-publisher im Schema → Laden → Migration greift → erneuter Export konform.
3. CI-Dogfooding-Job grün; demo-fehler-Fixture liefert R-320.
4. Kein x-Metadatenfeld mehr in neu exportierten Schemata; Token statt Freitextfarben im uischema.
