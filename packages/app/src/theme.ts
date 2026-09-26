import { createTheme } from '@mui/material';

/**
 * Design-Fundament: zentrales Theme mit dokumentierter Typografie- und
 * Spacing-Skala. Ziel: konsistente Wirkung über Header, Dialoge und Panels
 * hinweg statt Ad-hoc-sx-Werten pro Komponente.
 *
 * Spacing-Skala (MUI-Basiseinheit 8px, `theme.spacing(n)`):
 *   0.5 = 4px  (Icon-Innenabstände, sehr eng)
 *   1   = 8px  (Standardabstand zwischen verwandten Elementen)
 *   1.5 = 12px (Formularfeld-Abstände)
 *   2   = 16px (Abstand zwischen Blöcken innerhalb einer Karte/eines Panels)
 *   3   = 24px (Abstand zwischen Panel-Abschnitten)
 *   4   = 32px (Abstand zwischen Seitenbereichen)
 * Neue Komponenten sollen ausschließlich Vielfache dieser Skala verwenden
 * (sx={{ p: 2 }} statt sx={{ p: '17px' }}), damit der Rhythmus konsistent
 * bleibt.
 *
 * Typografie-Skala: vollständige Stufen h1–h6, subtitle1/2, body1/2,
 * caption, overline — jede Stufe hat eine klare Rolle, damit Komponenten
 * nicht aus Verlegenheit auf `caption` als Fließtext ausweichen:
 *   h6        Seitentitel (AppBar)
 *   subtitle1 Dialog-/Panel-Titel
 *   subtitle2 Abschnitts-Überschrift innerhalb eines Panels
 *   body1     Primärer Fließtext (Formularfelder, Dialoginhalte)
 *   body2     Sekundärer Fließtext (Hilfetexte, Beschreibungen)
 *   caption   Mikro-Beschriftung (Helper-Text unter Feldern, Badges)
 *   overline  Rubriken-Label (z. B. Trenner-Beschriftung in Dialogen)
 */

const BRAND = {
  blue900: '#003366',
  blue800: '#004A99',
  blue700: '#005CB8',
  blue500: '#0070D8',
  blue100: '#D6E8FF',
  cyan: '#009EE0',
  // Oberflächen
  panelBg: '#F3F6FA', // Palette & Properties
  editorBg: '#FFFFFF', // Canvas
  appBar: '#FFFFFF', // Topbar weiß
  border: '#E2E8F0',
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: BRAND.blue800,
      light: BRAND.blue500,
      dark: BRAND.blue900,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#546E7A',
      contrastText: '#FFFFFF',
    },
    background: {
      default: BRAND.panelBg, // Seitenleisten
      paper: BRAND.editorBg, // Editor-Canvas, Karten, Dialoge
    },
    text: {
      primary: '#1A2033',
      secondary: '#475569',
      disabled: '#94A3B8',
    },
    divider: BRAND.border,
    action: {
      hover: 'rgba(0,74,153,0.06)',
      selected: 'rgba(0,74,153,0.10)',
      focus: 'rgba(0,74,153,0.14)',
    },
    error: { main: '#DC2626' },
    warning: { main: '#D97706' },
    success: { main: '#16A34A' },
    info: { main: BRAND.blue500 },
  },

  shape: { borderRadius: 8 },

  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),

    h1: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: '2.25rem' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: '1.875rem' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.5rem' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.25rem' },
    h5: { fontWeight: 600, fontSize: '1.125rem' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1rem' },

    // Dialog-/Panel-Titel — deutlich abgesetzt vom Fließtext, ohne die
    // Schwere einer h-Überschrift.
    subtitle1: { fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.4 },
    // Abschnitts-Überschrift innerhalb eines Panels (Eigenschaften-Editor,
    // Struktur-Panel) — gedämpfte Farbe, damit sie nicht mit Feld-Labels
    // konkurriert.
    subtitle2: {
      fontWeight: 600,
      fontSize: '0.8125rem',
      letterSpacing: '0.01em',
      color: '#475569',
    },

    body1: { fontSize: '0.875rem', lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },

    // Rubriken-Label, z. B. Trenner-Beschriftung in Dialogen
    // ("Behördeninformationen") statt Zweckentfremdung von caption.
    overline: {
      fontWeight: 600,
      fontSize: '0.6875rem',
      letterSpacing: '0.08em',
      lineHeight: 1.6,
    },
  },

  components: {
    // ── AppBar: weiß mit Akzentlinie ──────────────────────────────────────
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND.appBar,
          color: BRAND.blue800,
          boxShadow: 'none',
          borderBottom: `1px solid ${BRAND.border}`,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '52px !important',
          paddingLeft: 16,
          paddingRight: 16,
        },
      },
    },

    // ── IconButton im Header ──────────────────────────────────────────────
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          color: '#475569',
          '&:hover': {
            backgroundColor: 'rgba(0,74,153,0.06)',
            color: BRAND.blue800,
          },
          '&.Mui-disabled': { color: '#CBD5E1' },
        },
      },
    },

    // ── Buttons ───────────────────────────────────────────────────────────
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          letterSpacing: '0.01em',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          '&:hover': { filter: 'brightness(0.92)' },
        },
        containedPrimary: {
          backgroundColor: BRAND.blue800,
          '&:hover': { backgroundColor: BRAND.blue800 },
        },
        outlined: {
          borderColor: BRAND.border,
          '&:hover': {
            borderColor: BRAND.blue500,
            backgroundColor: 'rgba(0,74,153,0.04)',
          },
        },
        text: {
          '&:hover': { backgroundColor: 'rgba(0,74,153,0.06)' },
        },
      },
    },

    // ── TextField ─────────────────────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: BRAND.blue500,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: BRAND.blue800,
            borderWidth: 2,
          },
        },
        notchedOutline: { borderColor: BRAND.border },
      },
    },

    // ── Paper / Cards ─────────────────────────────────────────────────────
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 8,
          border: `1px solid ${BRAND.border}`,
        },
        elevation0: { border: 'none', boxShadow: 'none' },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
          border: 'none',
        },
        elevation2: {
          boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)',
          border: 'none',
        },
      },
    },

    // ── Dialoge mit Elevation ─────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '0.95rem', fontWeight: 600 },
      },
    },

    // ── Tabs ──────────────────────────────────────────────────────────────
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: BRAND.blue800, height: 2 },
        root: { borderBottom: `1px solid ${BRAND.border}` },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8rem',
          minHeight: 40,
          letterSpacing: 0,
          color: '#64748B',
          '&.Mui-selected': { color: BRAND.blue800, fontWeight: 600 },
        },
      },
    },

    // ── Chip ──────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
        outlinedPrimary: { borderColor: BRAND.blue500, color: BRAND.blue800 },
      },
    },

    // ── Divider ───────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: { root: { borderColor: BRAND.border } },
    },

    // ── Tooltip ───────────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1E293B',
          borderRadius: 6,
          fontSize: '0.72rem',
          padding: '6px 10px',
        },
        arrow: { color: '#1E293B' },
      },
    },

    // ── Scrollbar + WCAG Focus (global) ──────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: {
        '*::-webkit-scrollbar': { width: '6px', height: '6px' },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          background: '#CBD5E1',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' },
        body: { backgroundColor: BRAND.panelBg },
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
        // WCAG 2.4.11: sichtbarer Fokusindikator (3:1 Kontrastverhältnis)
        '*:focus-visible': {
          outline: `3px solid ${BRAND.cyan}`,
          outlineOffset: '2px',
        },
        // Skip-Link für Screenreader (WCAG 2.4.1)
        '.skip-link': {
          position: 'absolute',
          top: '-40px',
          left: 0,
          background: BRAND.blue800,
          color: '#fff',
          padding: '8px 16px',
          zIndex: 9999,
          borderRadius: '0 0 4px 0',
          fontWeight: 600,
          '&:focus': { top: 0 },
        },
      },
    },
  },
});
