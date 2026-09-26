/**
 * MUI-Theme aus den KERN-Design-Token (ADR 0004).
 *
 * Eine Quelle für beide Seiten: die Editor-Oberfläche der App und die
 * KERN-Vorschau-Variante bauen auf derselben Funktion auf. Alle Farben,
 * Abstände, Radien und Schriftgrößen stammen aus `kernTokens.ts` — Hex-Werte
 * im Theme sind ein Fehler, nicht eine Abkürzung.
 *
 * Bewusste Abweichungen von KERN und ihr Grund stehen als Kommentar an der
 * jeweiligen Stelle. KERN ist für Bürger-Oberflächen mit einer Spalte
 * gedacht; der Designer ist ein Werkzeug mit drei Spalten. Wo das
 * kollidiert, gewinnt die Lesbarkeit im Formular, nicht die der Werkzeug-
 * Beschriftung.
 */
import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';

import {
  KERN_ABSTAND,
  KERN_FARBEN,
  KERN_RADIUS,
  KERN_RAHMENBREITE,
  KERN_SCHRIFT,
  KERN_SCHRIFTGROESSEN,
} from './kernTokens';

/** Schriftfamilie mit systemnahen Rückfallebenen (falls Fira Sans fehlt). */
export const KERN_FONT_STACK = [
  KERN_SCHRIFT.familie,
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'sans-serif',
].join(', ');

const px = (n: number) => `${n}px`;

/**
 * Grundlagen (Farben, Typografie, Form) — gemeinsam für Werkzeug und
 * Vorschau. Die Komponenten-Feinheiten der Werkzeug-Oberfläche liegen in
 * `kernWerkzeugTheme`.
 */
export function kernBasisOptionen(): ThemeOptions {
  return {
    palette: {
      mode: 'light',
      primary: {
        main: KERN_FARBEN.aktion,
        contrastText: KERN_FARBEN.aufAktion,
      },
      secondary: {
        main: KERN_FARBEN.textGedaempft,
        contrastText: KERN_FARBEN.aufAktion,
      },
      background: {
        default: KERN_FARBEN.flaeche,
        paper: KERN_FARBEN.hintergrund,
      },
      text: {
        primary: KERN_FARBEN.text,
        secondary: KERN_FARBEN.textGedaempft,
        // KERN kennt kein eigenes Token für deaktivierten Text. Der
        // Rahmen-Ton ist der hellste Grauwert, den KERN noch für Kontur
        // vorsieht — heller wäre außerhalb des Systems.
        disabled: KERN_FARBEN.rahmen,
      },
      divider: KERN_FARBEN.rahmenDekorativ,
      error: { main: KERN_FARBEN.gefahr },
      warning: { main: KERN_FARBEN.warnung },
      success: { main: KERN_FARBEN.erfolg },
      info: { main: KERN_FARBEN.info },
    },

    shape: { borderRadius: KERN_RADIUS.standard },

    typography: {
      fontFamily: KERN_FONT_STACK,

      // KERN kennt statische Stufen 16/18/21 und eine adaptive Skala für
      // große Überschriften. Die Oberfläche nutzt die statischen Stufen und
      // die primitiven Zwischengrößen — beides sind KERN-Token.
      h1: {
        fontSize: px(KERN_SCHRIFTGROESSEN.g48),
        fontWeight: KERN_SCHRIFT.gewichtHalbfett,
      },
      h2: {
        fontSize: px(KERN_SCHRIFTGROESSEN.g32),
        fontWeight: KERN_SCHRIFT.gewichtHalbfett,
      },
      h3: {
        fontSize: px(KERN_SCHRIFTGROESSEN.g26),
        fontWeight: KERN_SCHRIFT.gewichtHalbfett,
      },
      h4: {
        fontSize: px(KERN_SCHRIFTGROESSEN.g24),
        fontWeight: KERN_SCHRIFT.gewichtHalbfett,
      },
      h5: {
        fontSize: px(KERN_SCHRIFT.groesseGross),
        fontWeight: KERN_SCHRIFT.gewichtHalbfett,
        lineHeight: KERN_SCHRIFT.zeilenhoeheGross / KERN_SCHRIFT.groesseGross,
      },
      h6: {
        fontSize: px(KERN_SCHRIFT.groesseMittel),
        fontWeight: KERN_SCHRIFT.gewichtHalbfett,
        lineHeight: KERN_SCHRIFT.zeilenhoeheMittel / KERN_SCHRIFT.groesseMittel,
      },

      subtitle1: {
        fontSize: px(KERN_SCHRIFT.groesseKlein),
        fontWeight: KERN_SCHRIFT.gewichtHalbfett,
        lineHeight: KERN_SCHRIFT.zeilenhoeheMittel / KERN_SCHRIFT.groesseKlein,
      },
      subtitle2: {
        fontSize: px(KERN_SCHRIFTGROESSEN.g14),
        fontWeight: KERN_SCHRIFT.gewichtHalbfett,
      },

      // Fließtext und Formularfelder auf KERN-Basisgröße (16px) — das ist
      // der Kern der Lesbarkeitszusage des Designsystems.
      body1: {
        fontSize: px(KERN_SCHRIFT.groesseKlein),
        lineHeight: KERN_SCHRIFT.zeilenhoeheMittel / KERN_SCHRIFT.groesseKlein,
      },
      // Sekundärer Text der Werkzeug-Oberfläche (Panel-Beschriftungen,
      // Listeneinträge) eine Stufe kleiner — sonst passt die dreispaltige
      // Oberfläche nicht mehr auf einen Laptop-Bildschirm.
      body2: {
        fontSize: px(KERN_SCHRIFTGROESSEN.g14),
        lineHeight: 20 / KERN_SCHRIFTGROESSEN.g14,
      },
      caption: {
        fontSize: px(KERN_SCHRIFTGROESSEN.g12),
        lineHeight: 16 / KERN_SCHRIFTGROESSEN.g12,
      },
      overline: {
        fontSize: px(KERN_SCHRIFTGROESSEN.g12),
        fontWeight: KERN_SCHRIFT.gewichtHalbfett,
        letterSpacing: '0.08em',
        lineHeight: 16 / KERN_SCHRIFTGROESSEN.g12,
      },
      button: {
        fontSize: px(KERN_SCHRIFTGROESSEN.g14),
        fontWeight: KERN_SCHRIFT.gewichtHalbfett,
        textTransform: 'none',
      },
    },
  };
}

/**
 * Vollständiges Theme der Werkzeug-Oberfläche: Kopfzeile, Palette,
 * Eigenschaften-Panels, Dialoge.
 */
export function erstelleKernWerkzeugTheme(): Theme {
  const basis = kernBasisOptionen();

  return createTheme({
    ...basis,
    components: {
      // ── Kopfzeile ────────────────────────────────────────────────────────
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: KERN_FARBEN.hintergrund,
            color: KERN_FARBEN.text,
            boxShadow: 'none',
            // KERN setzt auf sichtbare Konturen statt Schatten.
            borderBottom: `${px(KERN_RAHMENBREITE.leicht)} solid ${KERN_FARBEN.rahmenDekorativ}`,
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: '56px !important',
            paddingLeft: KERN_ABSTAND.m,
            paddingRight: KERN_ABSTAND.m,
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: KERN_RADIUS.standard,
            color: KERN_FARBEN.textGedaempft,
            '&:hover': {
              backgroundColor: KERN_FARBEN.flaeche,
              color: KERN_FARBEN.aktion,
            },
            '&.Mui-disabled': { color: KERN_FARBEN.rahmen },
          },
        },
      },

      // ── Schaltflächen ────────────────────────────────────────────────────
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: KERN_SCHRIFT.gewichtHalbfett,
            borderRadius: KERN_RADIUS.standard,
            boxShadow: 'none',
            minHeight: 40,
            '&:hover': { boxShadow: 'none' },
          },
          contained: { '&:hover': { boxShadow: 'none' } },
          outlined: {
            // KERN zeichnet Konturen zweifach — dünne Linien verschwinden
            // auf Verwaltungsmonitoren.
            borderWidth: KERN_RAHMENBREITE.standard,
            borderColor: KERN_FARBEN.aktion,
            '&:hover': { borderWidth: KERN_RAHMENBREITE.standard },
          },
        },
      },

      // ── Eingabefelder ────────────────────────────────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: KERN_RADIUS.standard,
            backgroundColor: KERN_FARBEN.hintergrund,
            fontSize: px(KERN_SCHRIFT.groesseKlein),
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: KERN_FARBEN.aktion,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: KERN_FARBEN.aktion,
              borderWidth: KERN_RAHMENBREITE.standard,
            },
          },
          notchedOutline: {
            borderColor: KERN_FARBEN.feldRahmen,
            borderWidth: KERN_RAHMENBREITE.leicht,
          },
          input: { paddingTop: 10, paddingBottom: 10 },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: px(KERN_SCHRIFTGROESSEN.g14),
            color: KERN_FARBEN.textGedaempft,
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            fontSize: px(KERN_SCHRIFTGROESSEN.g12),
            color: KERN_FARBEN.textGedaempft,
          },
        },
      },

      // ── Flächen ──────────────────────────────────────────────────────────
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: KERN_RADIUS.standard,
            border: `${px(KERN_RAHMENBREITE.leicht)} solid ${KERN_FARBEN.rahmenDekorativ}`,
          },
          elevation0: { border: 'none', boxShadow: 'none' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: KERN_RADIUS.gross,
            border: `${px(KERN_RAHMENBREITE.leicht)} solid ${KERN_FARBEN.rahmenDekorativ}`,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: px(KERN_SCHRIFT.groesseMittel),
            fontWeight: KERN_SCHRIFT.gewichtHalbfett,
          },
        },
      },

      // ── Reiter ───────────────────────────────────────────────────────────
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: KERN_FARBEN.aktion,
            height: KERN_RAHMENBREITE.standard,
          },
          root: {
            borderBottom: `${px(KERN_RAHMENBREITE.leicht)} solid ${KERN_FARBEN.rahmenDekorativ}`,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: KERN_SCHRIFT.gewichtRegulaer,
            fontSize: px(KERN_SCHRIFTGROESSEN.g14),
            minHeight: 40,
            color: KERN_FARBEN.textGedaempft,
            '&.Mui-selected': {
              color: KERN_FARBEN.aktion,
              fontWeight: KERN_SCHRIFT.gewichtHalbfett,
            },
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: KERN_RADIUS.klein,
            fontSize: px(KERN_SCHRIFTGROESSEN.g12),
          },
          outlined: { borderColor: KERN_FARBEN.rahmenDekorativ },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: KERN_FARBEN.rahmenDekorativ } },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: KERN_FARBEN.text,
            color: KERN_FARBEN.textInvers,
            borderRadius: KERN_RADIUS.standard,
            fontSize: px(KERN_SCHRIFTGROESSEN.g12),
            padding: `${px(KERN_ABSTAND.xs)} ${px(KERN_ABSTAND.s)}`,
          },
          arrow: { color: KERN_FARBEN.text },
        },
      },

      // ── Global ───────────────────────────────────────────────────────────
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: KERN_FARBEN.flaeche },
          '*::-webkit-scrollbar': { width: '8px', height: '8px' },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: KERN_FARBEN.rahmenDekorativ,
            borderRadius: KERN_RADIUS.standard,
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: KERN_FARBEN.rahmen,
          },
          '@media print': {
            'header, .no-print': { display: 'none !important' },
            '.print-area': {
              width: '100% !important',
              margin: '0 !important',
              padding: '0 !important',
              boxShadow: 'none !important',
              border: 'none !important',
            },
            '@page': { margin: '2cm' },
          },
          // WCAG 2.4.11: sichtbarer Fokusindikator, Farbe aus dem
          // KERN-Fokus-Token.
          '*:focus-visible': {
            outline: `3px solid ${KERN_FARBEN.fokus}`,
            outlineOffset: '2px',
          },
          // Skip-Link für Screenreader (WCAG 2.4.1)
          '.skip-link': {
            position: 'absolute',
            top: '-40px',
            left: 0,
            background: KERN_FARBEN.aktion,
            color: KERN_FARBEN.aufAktion,
            padding: `${px(KERN_ABSTAND.s)} ${px(KERN_ABSTAND.m)}`,
            zIndex: 9999,
            borderRadius: `0 0 ${px(KERN_RADIUS.standard)} 0`,
            fontWeight: KERN_SCHRIFT.gewichtHalbfett,
            '&:focus': { top: 0 },
          },
        },
      },
    },
  });
}

/**
 * Theme der KERN-Vorschau: dasselbe Fundament, aber ohne die
 * Werkzeug-Feinheiten — die Vorschau soll aussehen wie ein
 * Bürger-Formular, nicht wie der Editor.
 */
export function erstelleKernVorschauTheme(): Theme {
  const basis = kernBasisOptionen();
  return createTheme({
    ...basis,
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: KERN_RADIUS.standard,
            backgroundColor: KERN_FARBEN.feldHintergrund,
            fontSize: px(KERN_SCHRIFT.groesseKlein),
          },
          notchedOutline: {
            borderColor: KERN_FARBEN.feldRahmen,
            borderWidth: KERN_RAHMENBREITE.leicht,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: KERN_RADIUS.standard,
            minHeight: 48,
            fontSize: px(KERN_SCHRIFT.groesseKlein),
            fontWeight: KERN_SCHRIFT.gewichtHalbfett,
            boxShadow: 'none',
          },
        },
      },
    },
  });
}
