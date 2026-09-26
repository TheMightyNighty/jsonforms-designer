/**
 * Theme der KERN-Vorschau-Variante.
 *
 * Seit ADR 0004 stammen die Werte nicht mehr aus von Hand geschätzten
 * Farben, sondern aus den vendorten KERN-Design-Token — derselben Quelle,
 * aus der auch die Editor-Oberfläche gebaut wird. Die Vorschau zeigt damit,
 * was das Formular im Bürger-Portal tatsächlich für Farben und Schrift
 * bekommt.
 *
 * Der Hinweis in `index.tsx` bleibt bestehen: Token und Schrift sind echt,
 * eine zertifizierte KERN-Umsetzung ist die Vorschau damit nicht — dafür
 * müssten auch die Komponenten aus KERN kommen.
 */
import { erstelleKernVorschauTheme } from '../../theme/kernTheme';

export const kernTheme = erstelleKernVorschauTheme();
