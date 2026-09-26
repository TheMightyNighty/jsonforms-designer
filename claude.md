# CLAUDE.md

## Projektkontext

Dieses Projekt ist ein Cloud-Programmierprojekt und kann aus einer oder mehreren der folgenden Technologien und Sprachen bestehen:

- Docker Container
- PHP
- Go
- Node.js
- React
- JavaScript
- HTML
- CSS
- JSON
- XML

Nicht jede dieser Technologien muss zwingend verwendet werden. Die Auswahl richtet sich nach dem tatsächlichen Projektbedarf.

Der Fokus liegt auf wartbarem, sicherem und produktionsnahem Code. Entscheidungen sollen nachvollziehbar, sicherheitsbewusst und langfristig tragfähig sein.

## Grundregeln

- Verwende keine Co-Autor-Nennungen in Commits, Dateien, Dokumentation oder generierten Texten.
- Erzeuge keinen Hinweis wie `Co-authored-by`, `Generated with`, `Created by Claude` oder ähnliche Signaturen.
- Schreibe klaren, wartbaren Code.
- Vermeide unnötige Kommentare im Code.
- Kommentare sind nur dort erlaubt, wo sie komplexe Logik, Sicherheitsentscheidungen oder nicht offensichtliche technische Einschränkungen erklären.
- Bevorzuge selbsterklärende Namen, kleine Funktionen und einfache Strukturen gegenüber erklärenden Kommentaren.

## Technologie- und Versionsrichtlinien

Für alle tatsächlich verwendeten Programmiersprachen, Frameworks, Laufzeitumgebungen, Container-Images, Build-Tools, Paketmanager und Bibliotheken sind aktuelle stabile Versionen zu bevorzugen.

Vor dem Hinzufügen oder Aktualisieren von Abhängigkeiten ist zu prüfen:

- Ist das Paket aktiv gepflegt?
- Gibt es bekannte CVEs?
- Gibt es offene Sicherheitswarnungen?
- Ist die Lizenz mit dem Projekt vereinbar?
- Gibt es bessere, aktivere oder sicherere Alternativen?
- Wird das Paket in Produktion breit eingesetzt?
- Ist die letzte Veröffentlichung plausibel aktuell?

Keine veralteten, ungepflegten oder verlassenen Projekte verwenden, außer es gibt eine dokumentierte technische Begründung.

## Node.js-spezifische Sicherheitsregeln

Bei Node.js-Abhängigkeiten besonders kritisch prüfen:

- Ist das Paket noch aktiv gepflegt?
- Gibt es verwaiste Maintainer-Projekte?
- Gibt es Hinweise auf Supply-Chain-Risiken?
- Gibt es bekannte Malware-, Typosquatting- oder Dependency-Confusion-Probleme?
- Sind transitive Dependencies auffällig alt oder unsicher?
- Gibt es unnötig große Dependency-Bäume?
- Ist eine kleinere, native oder besser gepflegte Alternative möglich?

Vor dem Merge müssen Node.js-Abhängigkeiten geprüft werden mit:

```bash
npm audit
npm outdated
```

Falls `pnpm` oder `yarn` verwendet wird, sind die entsprechenden Audit- und Outdated-Befehle zu nutzen.

## Sicherheitsprüfungen

Für alle Komponenten sind regelmäßig Sicherheitsprüfungen durchzuführen.

Empfohlene Prüfungen:

```bash
docker scout cves
trivy image <image-name>
trivy fs .
npm audit
composer audit
govulncheck ./...
```

Sicherheitsprobleme mit hohem oder kritischem Schweregrad müssen vor einem Release behoben oder begründet dokumentiert werden.

## Docker-Richtlinien

- Verwende möglichst schlanke, offizielle und aktuelle Base Images.
- Keine unnötigen Tools in Produktionsimages installieren.
- Multi-Stage-Builds verwenden, wenn sinnvoll.
- Container nicht als Root ausführen, sofern technisch möglich.
- Secrets niemals ins Image schreiben.
- `.dockerignore` aktuell halten.
- Images regelmäßig auf CVEs prüfen.
- Tags nicht blind auf `latest` setzen, wenn reproduzierbare Builds benötigt werden.

## PHP-Richtlinien

- Aktuelle stabile PHP-Version verwenden.
- Composer-Abhängigkeiten regelmäßig aktualisieren und prüfen.
- `composer audit` vor Releases ausführen.
- Strikte Typisierung bevorzugen.
- Eingaben validieren und Ausgaben kontextgerecht escapen.
- Keine sensiblen Daten loggen.

## Go-Richtlinien

- Aktuelle stabile Go-Version verwenden.
- `go mod tidy` sauber halten.
- `govulncheck ./...` regelmäßig ausführen.
- Kleine, klare Packages bevorzugen.
- Fehler explizit behandeln.
- Keine unnötigen globalen Zustände verwenden.
- Nebenläufigkeit nur einsetzen, wenn sie fachlich oder technisch sinnvoll ist.

## React- und Frontend-Richtlinien

- Aktuelle stabile React-Version verwenden.
- Komponenten klein und verständlich halten.
- Wiederverwendbare UI-Logik sauber kapseln.
- Keine unnötigen Abhängigkeiten für einfache Aufgaben hinzufügen.
- Accessibility berücksichtigen.
- Eingaben validieren.
- Keine Secrets im Frontend speichern.
- Build-Größe im Blick behalten.

## Code Reviews

Jede relevante Änderung soll einem Code Review unterzogen werden.

Im Review prüfen:

- Verständlichkeit
- Sicherheit
- Fehlerbehandlung
- Testabdeckung
- Performance
- Wartbarkeit
- Dependency-Auswirkungen
- Dokumentationsbedarf
- Auswirkungen auf Docker, Deployment und Betrieb

Review-Kommentare sollen konkret, sachlich und lösungsorientiert sein.

## Tests und Qualität

Vor dem Merge müssen passende Tests ausgeführt werden. Änderungen ohne ausreichende Tests sollen nicht gemerged werden.

### Unit Tests

Für neue oder geänderte Logik sind Unit Tests zu ergänzen oder anzupassen.

Unit Tests sollen prüfen:

- normale Erfolgsfälle
- Fehlerfälle
- Grenzfälle
- Validierung
- sicherheitsrelevante Logik
- Regressionen für behobene Fehler

Je nach Technologie sind passende Testwerkzeuge zu verwenden, zum Beispiel:

```bash
npm test
composer test
go test ./...
```

Für Go zusätzlich:

```bash
go vet ./...
```

Für Node.js/React zusätzlich:

```bash
npm run lint
npm run build
```

Fehlende Unit Tests müssen im Pull Request begründet werden.

### Playwright Tests

Für zentrale Benutzerflüsse sind Playwright-End-to-End-Tests zu erstellen und aktuell zu halten.

Playwright Tests müssen mindestens in folgenden Browsern laufen:

- Chromium
- Firefox
- WebKit

Empfohlene Playwright-Konfiguration:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

Playwright Tests ausführen:

```bash
npx playwright install
npx playwright test
```

Gezielt pro Browser ausführen:

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

In CI/CD müssen Playwright Tests für Chromium, Firefox und WebKit ausgeführt werden.

### Testabdeckung

Testabdeckung soll bei relevanten Änderungen nicht sinken.

Falls Coverage gemessen wird, sollen Berichte in CI/CD erzeugt werden. Kritische Geschäftslogik, Sicherheitslogik und Datenvalidierung müssen besonders gut getestet sein.

### Testdaten

Testdaten dürfen keine echten Zugangsdaten, Tokens, personenbezogenen Daten oder produktiven Kundendaten enthalten.

Verwende sichere Fixtures, Mocks oder anonymisierte Beispieldaten.

### Fehlgeschlagene Tests

Fehlschlagende Tests dürfen nicht ignoriert werden.

Tests dürfen nur übersprungen werden, wenn es eine dokumentierte technische Begründung gibt. Temporär deaktivierte Tests müssen mit einem TODO, Ticket oder Roadmap-Eintrag nachverfolgbar sein.

## GitHub und Codespaces

Das Projekt soll so eingerichtet sein, dass es lokal, in GitHub Codespaces und in CI/CD reproduzierbar gestartet, getestet und gebaut werden kann.

### Repository-Struktur

Die Projektstruktur soll klar und nachvollziehbar sein. Empfohlene Dateien und Verzeichnisse:

```text
.
├── .devcontainer/
│   └── devcontainer.json
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   └── dependabot.yml
├── docs/
├── tests/
├── scripts/
│   └── setup.sh
├── README.md
├── CHANGELOG.md
├── ROADMAP.md
├── CLAUDE.md
└── .env.example
```

Nicht benötigte Dateien oder Verzeichnisse sollen nicht künstlich angelegt werden.

### GitHub Codespaces

Für GitHub Codespaces soll eine `.devcontainer/devcontainer.json` gepflegt werden.

Sie soll enthalten:

- benötigte Laufzeitumgebungen
- benötigte VS-Code-Erweiterungen
- Setup-Kommandos
- Port-Forwarding
- sinnvolle Standardkonfiguration
- automatische Ausführung von `scripts/setup.sh`, sofern passend

Beispiel:

```json
{
  "name": "Cloud Development",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {},
    "ghcr.io/devcontainers/features/go:1": {},
    "ghcr.io/devcontainers/features/php:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "postCreateCommand": "bash scripts/setup.sh",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-vscode.vscode-typescript-next",
        "golang.go",
        "xdebug.php-debug",
        "ms-playwright.playwright"
      ]
    }
  },
  "forwardPorts": [3000, 5173, 8000, 8080],
  "portsAttributes": {
    "3000": {
      "label": "Node.js"
    },
    "5173": {
      "label": "Vite"
    },
    "8000": {
      "label": "PHP"
    },
    "8080": {
      "label": "Go/API"
    }
  }
}
```

### setup.sh

Das Projekt soll ein Skript `scripts/setup.sh` enthalten, das die Entwicklungsumgebung reproduzierbar vorbereitet.

Das Skript soll:

- fehlende Abhängigkeiten installieren
- Paketmanager sauber ausführen
- Playwright-Browser installieren
- Beispielkonfigurationen vorbereiten
- keine Secrets erzeugen oder committen
- idempotent sein
- bei Fehlern abbrechen
- klare Ausgaben erzeugen

Beispiel:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Setting up development environment..."

if [ -f ".env.example" ] && [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

if [ -f "package.json" ]; then
  npm install
  npx playwright install --with-deps
fi

if [ -f "composer.json" ]; then
  composer install
fi

if [ -f "go.mod" ]; then
  go mod download
  go mod tidy
fi

echo "Setup completed."
```

Das Skript muss ausführbar sein:

```bash
chmod +x scripts/setup.sh
```

### CI/CD Pipeline

Für GitHub Actions soll mindestens eine CI-Pipeline unter `.github/workflows/ci.yml` gepflegt werden.

Die Pipeline soll bei Pull Requests und Pushes laufen und mindestens prüfen:

- Installation der Abhängigkeiten
- Linting
- Unit Tests
- Build
- Playwright Tests mit Chromium, Firefox und WebKit
- Dependency Audits
- Sicherheitsprüfungen
- optional Container-Build
- optional Container-Scan

Beispiel:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read
  security-events: write

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        if: hashFiles('package.json') != ''
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: npm

      - name: Install Node.js dependencies
        if: hashFiles('package.json') != ''
        run: npm ci

      - name: Install Playwright browsers
        if: hashFiles('package.json') != ''
        run: npx playwright install --with-deps

      - name: Node.js audit
        if: hashFiles('package.json') != ''
        run: npm audit --audit-level=high

      - name: Node.js lint
        if: hashFiles('package.json') != ''
        run: npm run lint --if-present

      - name: Node.js unit tests
        if: hashFiles('package.json') != ''
        run: npm test --if-present

      - name: Node.js build
        if: hashFiles('package.json') != ''
        run: npm run build --if-present

      - name: Playwright tests
        if: hashFiles('package.json') != ''
        run: npx playwright test --project=chromium --project=firefox --project=webkit

      - name: Setup PHP
        if: hashFiles('composer.json') != ''
        uses: shivammathur/setup-php@v2
        with:
          php-version: latest
          tools: composer

      - name: Install PHP dependencies
        if: hashFiles('composer.json') != ''
        run: composer install --no-interaction --prefer-dist

      - name: PHP audit
        if: hashFiles('composer.json') != ''
        run: composer audit

      - name: PHP tests
        if: hashFiles('composer.json') != ''
        run: composer test

      - name: Setup Go
        if: hashFiles('go.mod') != ''
        uses: actions/setup-go@v5
        with:
          go-version: stable

      - name: Go dependencies
        if: hashFiles('go.mod') != ''
        run: go mod download

      - name: Go vet
        if: hashFiles('go.mod') != ''
        run: go vet ./...

      - name: Go tests
        if: hashFiles('go.mod') != ''
        run: go test ./...

      - name: Go vulnerability check
        if: hashFiles('go.mod') != ''
        run: |
          go install golang.org/x/vuln/cmd/govulncheck@latest
          govulncheck ./...
```

### Testdaten

Testdaten müssen sicher, reproduzierbar und klar von produktiven Daten getrennt sein.

Regeln für Testdaten:

- keine echten Zugangsdaten
- keine echten Tokens
- keine produktiven Kundendaten
- keine personenbezogenen Daten, sofern nicht anonymisiert
- keine geheimen internen URLs
- keine echten Zahlungsdaten
- keine produktiven API-Keys
- keine sensiblen Logs

Empfohlene Struktur:

```text
tests/
├── fixtures/
├── e2e/
├── unit/
└── README.md
```

Testdaten sollen dokumentiert werden. Eine `tests/README.md` soll erklären:

- Zweck der Testdaten
- wie sie erzeugt werden
- welche Daten künstlich oder anonymisiert sind
- wie Tests lokal ausgeführt werden
- welche Daten nicht verwendet werden dürfen

Beispiel für sichere Testdaten:

```json
{
  "user": {
    "id": "test-user-001",
    "name": "Test User",
    "email": "test.user@example.test",
    "role": "admin"
  }
}
```

### GitHub Security

GitHub-Sicherheitsfunktionen sollen genutzt werden, sofern im Repository verfügbar:

- Dependabot
- Code scanning
- Secret scanning
- Branch protection
- Required reviews
- Required status checks
- Security advisories
- Dependabot security updates

Eine `.github/dependabot.yml` soll gepflegt werden, wenn Paketmanager oder GitHub Actions verwendet werden.

Beispiel:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "composer"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "gomod"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
```

### Pull Requests und Branch Protection

Für `main` oder den produktiven Hauptbranch sollen Schutzregeln eingerichtet werden.

Empfohlene Regeln:

- Pull Request vor Merge erforderlich
- mindestens ein Review erforderlich
- CI muss erfolgreich sein
- veraltete Reviews bei neuen Commits verwerfen
- direkte Pushes auf `main` vermeiden
- Force Pushes verhindern
- Branch muss aktuell sein, bevor gemerged wird

Pull Requests sollen klein und nachvollziehbar sein. Große Änderungen sind nach Möglichkeit in mehrere PRs aufzuteilen.

### GitHub Issues und Roadmap

GitHub Issues sollen für Aufgaben, Fehler, Sicherheitsprobleme und technische Schulden verwendet werden.

Issues sollen enthalten:

- Ziel
- Kontext
- Akzeptanzkriterien
- betroffene Komponenten
- Sicherheits- oder Dokumentationsrelevanz

Roadmap-Einträge sollen mit Issues oder Milestones verknüpft werden, sofern sinnvoll.

## Dokumentation

Die Projektdokumentation ist Bestandteil der Entwicklung und muss aktuell gehalten werden.

Folgende Dokumente sollen gepflegt werden:

- `README.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- Entwicklerhandbuch
- Benutzerhandbuch
- Betriebs- oder Deployment-Handbuch
- Sicherheitsdokumentation, falls vorhanden

Änderungen an Verhalten, API, Konfiguration, Deployment oder Bedienung müssen dokumentiert werden.

## README.md

Die README soll mindestens enthalten:

- Projektbeschreibung
- Voraussetzungen
- Installation
- Lokale Entwicklung
- Docker-Nutzung
- Konfiguration
- Tests
- Build
- Deployment-Hinweise
- Sicherheits- und Update-Hinweise

## CHANGELOG.md

Das Changelog ist bei relevanten Änderungen zu aktualisieren.

Struktur bevorzugt nach:

- Added
- Changed
- Deprecated
- Removed
- Fixed
- Security

Keine unklaren Einträge wie „Update“, „Fix stuff“ oder „Misc changes“.

## Roadmap

Die Roadmap soll realistische nächste Schritte enthalten.

Sie soll unterscheiden zwischen:

- geplant
- in Arbeit
- später
- verworfen

Veraltete Punkte müssen entfernt oder aktualisiert werden.

## Handbücher

Handbücher sollen praxisnah geschrieben sein.

Sie sollen enthalten:

- Zielgruppe
- Voraussetzungen
- Schritt-für-Schritt-Anleitungen
- Konfiguration
- Fehlersuche
- Häufige Probleme
- Sicherheits- und Betriebshinweise

## Umgang mit Abhängigkeiten

Neue Abhängigkeiten nur hinzufügen, wenn sie einen klaren Nutzen haben.

Vor dem Hinzufügen prüfen:

- Kann die Aufgabe mit vorhandenen Mitteln gelöst werden?
- Ist die Bibliothek aktiv gepflegt?
- Gibt es bekannte Sicherheitsprobleme?
- Ist der Dependency-Baum angemessen?
- Ist die API stabil?
- Ist die Lizenz akzeptabel?

Nicht benötigte Abhängigkeiten entfernen.

## Sicherheit und Secrets

- Secrets niemals committen.
- `.env`-Dateien nicht ins Repository aufnehmen, außer als sichere Vorlage wie `.env.example`.
- Zugangsdaten nur über sichere Secret-Mechanismen bereitstellen.
- Logs dürfen keine Passwörter, Tokens, API-Keys oder personenbezogene sensible Daten enthalten.
- Eingaben immer validieren.
- Fehlerausgaben dürfen keine internen Details offenlegen.

## Commit- und PR-Regeln

Commits sollen klar und nachvollziehbar sein.

Keine automatisch erzeugten Co-Autor- oder Generator-Hinweise verwenden.

Pull Requests sollen enthalten:

- Zusammenfassung
- Motivation
- betroffene Komponenten
- Tests
- Sicherheitsauswirkungen
- Dokumentationsänderungen
- bekannte Einschränkungen

## Arbeitsweise für KI-Unterstützung

Beim Erstellen oder Ändern von Code:

1. Bestehende Struktur prüfen.
2. Möglichst kleine, gezielte Änderungen machen.
3. Keine unnötigen Refactorings durchführen.
4. Sicherheitsauswirkungen berücksichtigen.
5. Tests ergänzen oder aktualisieren.
6. Dokumentation aktualisieren.
7. Keine Co-Autor-Hinweise erzeugen.
8. Keine unnötigen Kommentare hinzufügen.

Bei Unsicherheit lieber eine kurze Begründung oder Entscheidungsvorlage erstellen, statt riskante Annahmen direkt umzusetzen.



## Weitere Projektstandards

### Repository-Dateien

Folgende Dateien sollen gepflegt werden, sofern das Projekt öffentlich, produktiv oder teamübergreifend genutzt wird:

- `LICENSE`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`

Die `SECURITY.md` soll beschreiben:

- wie Sicherheitslücken gemeldet werden
- welche Informationen eine Meldung enthalten soll
- welcher Kommunikationsweg verwendet werden soll
- welche Reaktionszeit angestrebt wird
- welche Informationen nicht öffentlich in Issues gepostet werden dürfen

Die `CONTRIBUTING.md` soll beschreiben:

- lokale Einrichtung
- Branch- und Pull-Request-Regeln
- Testanforderungen
- Code-Review-Regeln
- Dokumentationspflichten
- Umgang mit Issues

Die Lizenz muss bewusst gewählt werden. Falls keine öffentliche Nutzung vorgesehen ist, soll die Nutzungs- und Weitergaberegel intern dokumentiert werden.

### Releases und Versionierung

Releases sollen nachvollziehbar, reproduzierbar und rollbackfähig sein.

Es sollen klare Regeln gepflegt werden für:

- Versionierung
- Git Tags
- Release Notes
- Changelog-Einträge
- Migrationshinweise
- Rollback
- Breaking Changes
- Release-Freigabe
- Hotfixes

Semantic Versioning ist zu bevorzugen, sofern es zum Projekt passt.

Breaking Changes müssen klar dokumentiert werden. Dazu gehören geänderte APIs, entfernte Konfigurationen, geändertes Datenbankverhalten, geänderte Authentifizierung, geänderte Berechtigungen oder inkompatible Datenmigrationen.

Ein Release darf nur erfolgen, wenn:

- CI/CD erfolgreich ist
- Tests erfolgreich sind
- Sicherheitsprüfungen durchgeführt wurden
- relevante Dokumentation aktualisiert wurde
- Changelog oder Release Notes aktualisiert wurden
- bekannte Risiken dokumentiert sind
- Rollback oder Wiederherstellung bekannt ist

### Observability und Betrieb

Cloud-Anwendungen müssen im Betrieb beobachtbar sein.

Dazu gehören:

- strukturierte Logs
- Health Checks
- Readiness Checks
- Metriken
- Tracing, falls sinnvoll
- Alerting für kritische Fehler
- nachvollziehbare Fehlercodes
- aussagekräftige Fehlermeldungen ohne sensible Details
- keine sensiblen Daten in Logs

Logs sollen maschinenlesbar und konsistent sein. Sensible Informationen wie Passwörter, Tokens, API-Keys, personenbezogene Daten oder interne Secrets dürfen nicht geloggt werden.

Health Checks sollen prüfen, ob die Anwendung grundsätzlich läuft.

Readiness Checks sollen prüfen, ob die Anwendung bereit ist, produktiven Traffic anzunehmen. Dazu können Datenbankverbindungen, abhängige Services oder Migrationsstatus gehören.

Metriken sollen für zentrale System- und Geschäftsprozesse definiert werden, zum Beispiel:

- Fehlerraten
- Antwortzeiten
- Durchsatz
- Warteschlangenlängen
- Speicherverbrauch
- CPU-Nutzung
- Container-Neustarts
- Login- oder Authentifizierungsfehler

### Datenbank, Migrationen und Backups

Falls eine Datenbank verwendet wird, müssen Migrationen nachvollziehbar, versioniert und getestet sein.

Zu beachten:

- Migrationen müssen getestet werden.
- Migrationen sollen reproduzierbar sein.
- Rollback-Möglichkeiten sollen dokumentiert werden.
- Seed-Daten dürfen keine produktiven Daten enthalten.
- Backups müssen eingeplant werden.
- Restore-Verfahren sollen dokumentiert werden.
- Restore-Verfahren sollen regelmäßig getestet werden.
- Datenlöschung und Datenaufbewahrung müssen berücksichtigt werden.
- Schemaänderungen müssen im Changelog oder in den Release Notes erwähnt werden, wenn sie relevant sind.

Migrationen dürfen keine unkontrollierten Datenverluste verursachen. Destruktive Änderungen müssen besonders geprüft, dokumentiert und möglichst in mehreren Schritten durchgeführt werden.

Test- und Entwicklungsdatenbanken dürfen keine produktiven Secrets oder produktiven personenbezogenen Daten enthalten.

### API-Standards

Falls APIs bereitgestellt werden, sollen sie dokumentiert und konsistent gestaltet sein.

Zu beachten:

- OpenAPI-Dokumentation, sofern sinnvoll
- klare Versionierung
- konsistente Fehlerformate
- Input Validation
- Authentifizierung
- Autorisierung
- Pagination bei Listen
- Sortierung und Filterung bei Listen, sofern sinnvoll
- Rate Limits, falls erforderlich
- eindeutige Statuscodes
- keine Breaking Changes ohne Dokumentation
- keine internen Fehlermeldungen an Clients ausgeben

API-Fehler sollen ein konsistentes Format verwenden.

Beispiel:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": []
  }
}
```

APIs sollen keine sensiblen Implementierungsdetails preisgeben. Validierung muss serverseitig erfolgen, auch wenn bereits im Frontend validiert wird.

### Accessibility und Frontend-Qualität

Frontend-Komponenten sollen barrierearm, robust und verständlich nutzbar sein.

Zu beachten:

- Tastaturbedienung
- Screenreader-Kompatibilität
- ausreichende Kontraste
- semantisches HTML
- responsives Design
- verständliche Fehlermeldungen
- sinnvolle Fokusführung
- Labels für Formularfelder
- Alternativtexte für relevante Bilder
- keine unnötigen Animationen
- reduzierte Bewegung respektieren, sofern relevant
- Internationalisierung, sofern relevant

Frontend-Code soll nicht nur visuell funktionieren, sondern auch mit Tastatur, Screenreadern und unterschiedlichen Bildschirmgrößen nutzbar sein.

Formulare müssen klare Validierungsfehler anzeigen. Fehlermeldungen sollen verständlich und handlungsorientiert sein.

### Supply-Chain-Härtung

Die Software-Lieferkette soll geschützt werden.

Regeln:

- Lockfiles müssen committed werden.
- In CI soll `npm ci` statt `npm install` verwendet werden.
- GitHub Actions müssen geprüft und möglichst vertrauenswürdig sein.
- GitHub Actions sollen nach Möglichkeit auf feste Versionen gepinnt werden.
- Unnötige Dependencies entfernen.
- Transitive Dependencies regelmäßig prüfen.
- Keine ungeprüften Skripte aus dem Internet ausführen.
- Keine unbekannten Paketquellen ohne Begründung verwenden.
- SBOM-Erzeugung prüfen, wenn das Projekt produktiv betrieben wird.
- Container-Images sollen nachvollziehbar gebaut und regelmäßig gescannt werden.
- Container-Base-Images sollen bewusst gewählt und regelmäßig aktualisiert werden.
- Paketmanager-Konfigurationen sollen keine unsicheren Registries verwenden.
- Dependency-Updates sollen getestet und reviewed werden.

Bei neuen Abhängigkeiten ist besonders zu prüfen:

- Maintainer-Aktivität
- Release-Historie
- offene Sicherheitsmeldungen
- Anzahl und Zustand transitiver Abhängigkeiten
- Lizenz
- Notwendigkeit im Projekt
- mögliche kleinere oder native Alternativen

## Definition of Done

Eine Änderung gilt erst als fertig, wenn:

- Code funktioniert.
- Tests erfolgreich sind.
- Sicherheitsprüfung durchgeführt wurde.
- Neue oder geänderte Abhängigkeiten geprüft wurden.
- Dokumentation aktualisiert wurde.
- Changelog aktualisiert wurde, falls relevant.
- Code Review erfolgt ist.
- Keine unnötigen Kommentare oder Signaturen enthalten sind.
- Keine Co-Autor-Nennung enthalten ist.
- `scripts/setup.sh` funktioniert lokal oder in Codespaces.
- CI/CD läuft erfolgreich.
- Playwright Tests laufen für Chromium, Firefox und WebKit.
- Testdaten sind sicher und enthalten keine echten Secrets oder produktiven Daten.
- GitHub Security Alerts oder Dependabot-Warnungen wurden geprüft.
