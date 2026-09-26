# AUFTRAG 2.3 — Theme-Switcher in der Vorschau (Renderer-Set-Architektur)

**Für:** Claude Code (Repo: jsonforms-designer) · **Modell:** Fable für Schritt 1–2 (Architektur), Sonnet ab Schritt 3.
**Strategischer Zweck:** Der Umschalter ist der Demo-Höhepunkt und muss Renderer-Unabhängigkeit **beweisen**, nicht simulieren. Deshalb gilt die harte Architekturvorgabe: Der Wechsel tauscht das komplette JSONForms-Renderer-Set — niemals nur Stylesheets.

## Architekturvorgaben (nicht verhandelbar)

1. **Varianten sind eigenständige Renderer-Sets.** Struktur:
   ```
   src/preview-variants/
   ├── standard/   → { renderers, cells, ThemeProvider }  (bestehendes MUI-Set, nur re-exportiert)
   ├── portal/     → { renderers, cells, ThemeProvider }  („Bundesportal-Stil")
   └── kern/       → { renderers, cells, ThemeProvider }  („KERN-Stil")
   ```
   Jede Variante exportiert dieselbe Schnittstelle; die Vorschau übergibt das gewählte Set vollständig an `<JsonForms renderers={…} cells={…}>`. Gemeinsamer Code nur über ein kleines `shared/`-Modul (Layout-Mathematik für ofm:width, rule-Auswertung bleibt JSONForms-Kern).
2. **Die Artefakte sind über den Wechsel hinweg byte-identisch.** Einbauen: Die Vorschau zeigt in der Fußzeile den SHA-256 der aktuellen schema.json + uischema.json (gekürzt, z. B. `a3f2…9c` ). Beim Umschalten ändert sich das Design — der Hash nicht. Das ist der sichtbare Beweis und wird im Demo-Drehbuch referenziert. Dev-Assertion: Variantenwechsel darf die Artefakt-Objekte nicht mutieren.
3. **Claim-Hygiene in der UI:** Die Varianten heißen im Umschalter „Standard (Material)", „Bundesportal-Stil" und „KERN-Stil". Im Tooltip/Info: „Design-Demonstration auf Basis der jeweiligen Gestaltungsprinzipien — keine zertifizierte Umsetzung des Design-Systems." Nirgends „BITV-konform" oder „offizielles Bundesportal-Design" behaupten.
4. **Profil-Vollständigkeit:** Jede Variante MUSS alle Elemente des OFM-UI-Profils rendern (VerticalLayout, HorizontalLayout, Group, Categorization/Category, Control aller Feldtypen, Label) und die registrierten Options honorieren oder definiert degradieren (ofm:width → Spaltenbreite oder Gleichverteilung; ofm:sectionColor → Token-Farbe oder neutral).

## Umsetzungsschritte

1. **(Fable)** Schnittstelle `PreviewVariant` definieren (renderers, cells, ThemeProvider, name, description) und die Vorschau-Komponente auf Varianten-Injektion umbauen; Standard-Variante als Re-Export des Bestands.
2. **(Fable)** Portal-Variante: eigenes Renderer-Set — abgeleitete Controls mit Bundesportal-typischer Anmutung (ruhige Flächen, klare Labels oberhalb, blaue Primärakzente, deutliche Fokus-Zustände). Getrennte Komponenten, kein CSS-Override des MUI-Sets.
3. **(Sonnet)** KERN-Variante analog: Gestaltungsprinzipien des KERN-Designsystems (Typografie-Hierarchie, Abstände, Farbtoken) als eigenes Set.
4. **(Sonnet)** Umschalter-UI in der Vorschau-Toolbar (Dropdown, Tastaturkürzel 1/2/3 für die Demo), Hash-Fußzeile, Persistenz der Auswahl in der Session.
5. **(Sonnet)** Formularzustand (eingegebene Daten) überlebt den Wechsel — dasselbe data-Objekt wird an alle Varianten gereicht; Test dafür.

## Definition of Done

1. Demo-Formular „Bewohnerparkausweis": Umschalten 1→2→3, sichtbar unterschiedliches Rendering, Hash unverändert, eingegebene Daten bleiben stehen.
2. Alle Profil-Elemente in allen drei Varianten gerendert (Storybook-Seite oder Testformular mit jedem Elementtyp).
3. Wechsel < 300 ms, keine Konsolen-Fehler.
4. README-Abschnitt „Design-Varianten" mit der Claim-Hygiene-Formulierung.
