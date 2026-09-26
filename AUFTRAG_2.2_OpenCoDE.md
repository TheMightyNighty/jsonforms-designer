# AUFTRAG 2.2 — Open-CoDE-Veröffentlichung vorbereiten (beide Repos)

**Für:** Claude Code (nacheinander in: ofm-spec, jsonforms-designer) · **Modell:** Sonnet.
**Zweck:** Beantwortet die Ein-Personen-Projekt-Frage (Pitch-Einwand D1) und liefert den Link für Abschnitt 7 des Positionspapiers. Claude Code bereitet alles vor; das Anlegen des Open-CoDE-Kontos und der eigentliche Push sind manuelle Schritte (Checkliste am Ende erzeugen).

## Je Repo zu erstellen/prüfen

1. **Lizenz-Audit:** ofm-spec: Code MIT (LICENSE), Spezifikationstexte CC BY 4.0 (LICENSE-docs + Hinweis im README). jsonforms-designer: MIT-Kette prüfen — Upstream-Attribution EclipseSource/jsonforms-editor vollständig (LICENSE, NOTICE-Datei mit Fork-Herkunft und Copyright-Zeilen), alle Dependencies auf Lizenzkompatibilität scannen (license-checker; Findings in LIZENZ-AUDIT.md).
2. **Secrets-Scan:** gitleaks über die **gesamte History** beider Repos; Findings dokumentieren. Bei Treffern: nicht selbst rewriten — Fundliste erzeugen und STOPPEN (History-Rewrite ist manuelle Entscheidung).
3. **GOVERNANCE.md:** Maintainer-Modell (aktuell: Einzelmaintainer, benannt), Entscheidungsprozess (Issues/PRs, Registry-Aufnahmen nach OFM-R-342), ausdrückliches Übergabe-Angebot an eine föderale Pflegestelle (Formulierung aus der Spec-Präambel übernehmen), Deprecation-/Versionierungsverweis auf Teil IV.
4. **CONTRIBUTING.md** (Beitragsweg, DCO-Hinweis, Konformitätstests als PR-Gate) und **SECURITY.md** (Meldeweg, Reaktionszusage).
5. **publiccode.yml** nach Standard v0.3 (Open-CoDE-Konvention): Kategorien, Zielgruppe öffentliche Verwaltung, Deutsch als Sprache, Abhängigkeiten, Reifegrad ehrlich („beta"), Maintainer-Kontakt-Platzhalter.
6. **README-Neupositionierung:** ofm-spec als „Offenes Formularmodell — Spezifikation und Referenz-Validator"; jsonforms-designer als „Referenzimplementierung (Produzent) des Offenen Formularmodells" mit Verweis auf ofm-spec. Beide: Status-Abschnitt (Spezifikationsentwurf 1.0, Konformitätsklassen, was v1 kann/nicht kann — Abgrenzungen aus Validator-README übernehmen).
7. **CI-Hinweis:** Open CoDE läuft auf GitLab. Strategie dokumentieren (README-Abschnitt „Repositorien"): Entwicklung auf GitHub, gespiegelte Veröffentlichung auf Open CoDE; `.gitlab-ci.yml` minimal (Testsuite ausführen), damit der Spiegel nicht „tot" wirkt.

## Abschluss-Artefakt

`OPEN-CODE-CHECKLISTE.md` mit den manuellen Restschritten in Reihenfolge: Konto/Organisation auf opencode.de anlegen → Projekte anlegen → Remote hinzufügen → Push → Projektbeschreibung/Topics setzen → Spiegel-Automatik (GitHub Action mirror) aktivieren → Link ins Positionspapier Abschnitt 7 eintragen.

## Definition of Done

Beide Repos enthalten alle sieben Punkte; gitleaks ohne offene Funde (oder dokumentierte Stopp-Liste); Checkliste erzeugt; `npm test` weiterhin grün.
