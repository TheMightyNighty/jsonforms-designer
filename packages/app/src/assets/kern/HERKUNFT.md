# Herkunft der KERN-Dateien

Quelle: [`@kern-ux/native`](https://www.npmjs.com/package/@kern-ux/native)
Version 2.8.2, Lizenz EUPL-1.2 (siehe `LICENSE.md`).

KERN ist **keine Laufzeit-Abhängigkeit** des Projekts. Das Paket bringt
6,8 MB CSS, Fonts und eigene Web-Komponenten mit; der Designer braucht
davon die Design-Token und drei Schriftschnitte. Beides liegt deshalb
vendored im Repo — dasselbe Vorgehen wie bei der Tabler-Icon-Schrift
(CHANGELOG 0.3.0) und aus demselben Grund: Intranet-Fähigkeit, kein
Laufzeit-CDN, überschaubare Lieferkette.

Vendored sind:

| Datei | Inhalt |
|---|---|
| `fira-sans/*.woff2` | Fira Sans Regular/Medium/SemiBold, nur woff2 |
| `kern-fonts.css` | getrimmtes `@font-face`-CSS für genau diese Schnitte |
| `../../../../editor/src/theme/kernTokens.ts` | aufgelöste Token des hellen Themes |

Aktualisieren:

```bash
node scripts/vendor-kern.mjs <version>
```

Danach `npm run lint`, `npm run format` und die Screenshots neu erzeugen.
