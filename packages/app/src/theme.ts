/**
 * Theme der Designer-Oberfläche.
 *
 * Seit ADR 0004 stammen Farben, Abstände, Radien und Typografie aus dem
 * Verwaltungs-Designsystem KERN. Die Token liegen vendored im Editor-Paket
 * (`@jsonforms-designer/editor`, `kernTokens.ts`, erzeugt aus
 * `@kern-ux/native`); das Theme selbst wird dort aus ihnen abgeleitet.
 *
 * Diese Datei bleibt der Einstiegspunkt der App, damit ein Host das Theme
 * an einer Stelle austauschen kann.
 *
 * Spacing-Skala: MUI-Basiseinheit 8px (`theme.spacing(n)`), deckungsgleich
 * mit der KERN-Abstandsskala (KERN_ABSTAND: 4/8/16/24/32):
 *   0.5 = 4px  (x-small — Icon-Innenabstände)
 *   1   = 8px  (small — verwandte Elemente)
 *   2   = 16px (default — Blöcke innerhalb einer Karte)
 *   3   = 24px (large — Panel-Abschnitte)
 *   4   = 32px (x-large — Seitenbereiche)
 * Neue Komponenten verwenden ausschließlich Vielfache dieser Skala.
 *
 * Typografie-Stufen und ihre Rolle:
 *   h6        Seitentitel (AppBar)
 *   subtitle1 Dialog-/Panel-Titel
 *   subtitle2 Abschnitts-Überschrift innerhalb eines Panels
 *   body1     Primärer Fließtext und Formularfelder (KERN-Basis 16px)
 *   body2     Sekundärer Fließtext der Werkzeug-Oberfläche
 *   caption   Mikro-Beschriftung
 *   overline  Rubriken-Label
 */
import { erstelleKernWerkzeugTheme } from '@jsonforms-designer/editor';

export const theme = erstelleKernWerkzeugTheme();
