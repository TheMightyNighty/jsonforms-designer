# ADR 0004: KERN als Designsystem, vendored statt als Abhängigkeit

**Status:** Akzeptiert (2026-09)
**Kontext:** packages/app (Werkzeug-Oberfläche), packages/editor (Theme, Vorschau-Varianten)

## Kontext

Der Designer trug bis hierher eine eigene Markenpalette: ein Blau-Set
(`#004A99`, `#009EE0`, `#003366`), die Schrift Inter und ad-hoc gewählte
Grautöne, Radien und Schriftgrößen, verteilt über `packages/app/src/theme.ts`
und einzelne Komponenten. Die KERN-Vorschau-Variante aus Auftrag 2.3 war eine
Nachempfindung mit von Hand geschätzten Werten und im Kommentar auch so
bezeichnet.

Das Briefing „Editor-UX auf Behörden-Niveau" (ADR 0002) hatte die visuelle
Neuausrichtung an einem Verwaltungs-Designsystem ausdrücklich ausgeklammert und
als eigene Entscheidung markiert. Diese Entscheidung ist jetzt getroffen: Der
Designer richtet sich an **KERN** aus, dem Designsystem für die öffentliche
Verwaltung (kern-ux.de).

Zwei Randbedingungen bestimmen das Wie. Erstens ADR 0002/V5: keine neuen
Laufzeit-Abhängigkeiten ohne Begründung. Zweitens die Intranet-Fähigkeit: kein
Laufzeit-Zugriff auf ein CDN, `npm audit` bleibt sauber (CONTRIBUTING).
`@kern-ux/native` liegt auf npm (EUPL-1.2, ohne eigene Abhängigkeiten), bringt
aber 6,8 MB CSS, Schriften und eigene Web-Komponenten mit, wird von einer
einzelnen Person gepflegt und veröffentlicht häufig.

## Entscheidung

KERN wird **vendored, nicht als Laufzeit-Abhängigkeit geführt** — dasselbe
Vorgehen wie bei der Tabler-Icon-Schrift (CHANGELOG 0.3.0) und aus demselben
Grund.

`scripts/vendor-kern.mjs` zieht das Paket einmalig, liest die Design-Token des
hellen Themes aus `dist/kern.css`, löst die `var()`-Ketten auf, rechnet die
oklch-Farbwerte nach sRGB-Hex um und schreibt sie als generiertes
TypeScript-Modul `packages/editor/src/theme/kernTokens.ts`. Dieselbe Ausführung
kopiert die drei tatsächlich genutzten Fira-Sans-Schnitte (Regular, Medium,
SemiBold, nur woff2, zusammen rund 400 KB), erzeugt ein getrimmtes
`@font-face`-CSS und legt Lizenz und Herkunft daneben. Das Skript ist nicht
Teil des Builds; es läuft nur bei einem KERN-Update.

Die Umrechnung nach Hex ist keine Bequemlichkeit: MUI rechnet intern mit Farben
(`alpha`, `darken`, `lighten`) und versteht `oklch()` nicht. Ein Test hält fest,
dass in den Token ausschließlich Hex-Werte stehen.

Aus den Token baut `packages/editor/src/theme/kernTheme.ts` **ein** Theme für
beide Seiten: `erstelleKernWerkzeugTheme()` für die Oberfläche des Werkzeugs
(Kopfzeile, Palette, Eigenschaften, Dialoge) und `erstelleKernVorschauTheme()`
für die KERN-Vorschau-Variante. `packages/app/src/theme.ts` ist nur noch der
Einstiegspunkt, an dem ein Host das Theme austauschen kann; die KERN-Variante in
`preview-variants/kern` bezieht ihre Werte aus derselben Quelle statt aus
geschätzten Farben.

Abweichungen von KERN stehen als Kommentar an der jeweiligen Stelle. Die
wichtigste: KERN ist für einspaltige Bürger-Oberflächen gedacht, der Designer
ist ein dreispaltiges Werkzeug. Fließtext und Formularfelder laufen auf der
KERN-Basisgröße von 16 px — darin liegt die Lesbarkeitszusage des Systems —,
die sekundären Beschriftungen der Werkzeug-Oberfläche eine Stufe darunter
(14 px, ebenfalls ein KERN-Token). Für „deaktivierten Text" hat KERN kein
Token; dafür steht der hellste Grauwert, den KERN noch für Konturen vorsieht.

## Konsequenzen

Die Lieferkette wächst nicht: keine neue Abhängigkeit in `package.json`, kein
Laufzeit-CDN, `npm audit` unverändert. Der Preis ist ein manueller
Aktualisierungsschritt — ein KERN-Update kommt nicht über Dependabot, sondern
über `node scripts/vendor-kern.mjs <version>`. Die Version steht im generierten
Modul (`KERN_VERSION`) und in `packages/app/src/assets/kern/HERKUNFT.md`, damit
der Stand ablesbar bleibt.

Die Barrierefreiheit wird durch die Umstellung nachweisbar besser statt nur
anders: Ein Unit-Test rechnet die Kontraste der tatsächlich verwendeten
Farbpaare nach WCAG 2.1 durch und fordert 4,5:1 für Text sowie 3:1 für
Fokusindikator und Feldrahmen. Damit ist ADR 0002/V4 nicht mehr eine Zusage,
sondern ein Gate.

Der Umstieg ändert das Aussehen bestehender Formulare dort, wo bisher die
Markenfarben als Vorgabewert eingesetzt waren — etwa der Hintergrund neuer
Abschnittsköpfe. **Gespeicherte Stände sind nicht betroffen:** Alt-Farbwerte
bleiben im Zustand und werden beim Laden weiterhin über `legacyColorToToken`
auf die Abschnittsfarb-Token abgebildet (ADR 0002/V2). Die Migrationstabelle
bleibt deshalb unverändert, auch wenn die dort genannten Hex-Werte in der
Oberfläche nicht mehr angeboten werden.

Nicht Teil dieser Entscheidung: die Web-Komponenten aus `@kern-ux/native` (der
Designer bleibt bei MUI und JSONForms), eine zertifizierte KERN-Umsetzung — die
Vorschau nutzt echte Token und echte Schrift, aber eigene Komponenten — sowie
ein dunkles Theme, dessen Token-Satz KERN zwar mitbringt, für den der Designer
aber keinen Bedarf hat. Die Vorschau-Variante „Portal" behält bewusst ihre
eigene Palette; sie zeigt, wie dasselbe Formular in einer anderen Umgebung
aussieht.
