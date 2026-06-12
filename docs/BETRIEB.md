# Betriebs-Runbook

Zielgruppe: Betrieb / Hosting des JSONForms Designers (statisches SPA).

## Deployment-Optionen

**A) Beliebiger statischer Webserver**

```bash
npm ci && npm run build
# Artefakt: packages/app/build/ → auf den Webserver kopieren
```

SPA-Fallback nötig (alle Pfade → `index.html`); gehashte `/assets/` dürfen
mit `immutable` gecacht werden, `index.html` nicht (siehe
`docker/nginx.conf` als Referenz).

**B) Docker**

```bash
docker build -t jsonforms-designer .
docker run --rm -p 8080:8080 jsonforms-designer
```

Multi-Stage-Build (node:22 → nginx:1.27-alpine), Healthcheck auf `/`,
Port 8080 (kein root nötig).

## Netz & Sicherheit

- **Kein Laufzeit-CDN.** Monaco, Icons und alle Chunks sind self-hosted —
  die Anwendung läuft vollständig im Intranet. Der Code-Modus lädt seinen
  Chunk (~1 MB gzip) erst beim ersten Öffnen nach (vom eigenen Origin).
- **CSP** liegt als `<meta>` im Build (Quelle:
  `packages/app/vite.config.ts`). `connect-src` erlaubt nur `'self'` und
  `https://fimportal.de`. `'unsafe-eval'` wird von **AJV** benötigt
  (JSONForms-Schema-Validierung in der Vorschau), nicht von Monaco —
  empirisch per E2E verifiziert.
- **FIM-Portal in abgeschotteten Netzen:** Direktzugriff auf
  `fimportal.de` braucht eine Firewall-Freigabe und serverseitige
  CORS-Header. Alternativ den Reverse-Proxy nutzen — auskommentierter
  `location /fim-api/`-Block in `docker/nginx.conf`; dann in der App
  `new FimApiService({ baseUrl: '/fim-api' })` konfigurieren und
  `fimportal.de` aus der CSP entfernen.

## Persistenz

- Default: localStorage im Browser (`jfd_fieldState_v1`) — Entwürfe liegen
  im Browser-Profil der Nutzer (Datenschutz-Hinweis für die Dienstanweisung).
- Server-Speicherung: `HttpFieldStateService` (im Paket enthalten) gegen
  ein eigenes Backend (`GET`/`PUT` einer JSON-Ressource); Backend-Origin in
  `connect-src` der CSP ergänzen. Details: README → „Persistenz".

## Diagnose & Support

- **Version:** wird im Header der Anwendung angezeigt (z. B. `v0.2.1`) —
  erste Frage im Support-Fall.
- **Fehlerkanal:** Die Host-Anwendung kann über die Editor-Prop
  `onError(error, kontext)` alle Fehler (Laden, Auto-Save, Render) an ein
  Monitoring melden; Default ist `console.error` (Browser-Konsole).
- **E2E-Diagnose:** `npm run test:e2e` prüft die Kernpfade gegen den
  Prod-Build; in der CI wird bei Fehlschlag der Playwright-Report als
  Artefakt hochgeladen.

## Update-Prozess

1. `CHANGELOG.md` lesen (Breaking Changes sind markiert).
2. `npm ci && npm run build && npm run test:e2e` — alles grün?
3. Build-Artefakt austauschen; `index.html` ist no-cache, Nutzer erhalten
   die neue Version beim nächsten Laden (gehashte Assets kollidieren nicht).
