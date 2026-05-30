import { CssBaseline, ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { useMemo } from 'react';
import { JsonFormsEditor } from '@jsonforms-designer/editor';
function buildTheme(mode: 'light' | 'dark') {
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      primary: {
        main:         isLight ? '#004A99' : '#409EE8',
        light:        isLight ? '#009EE0' : '#5DB8F0',
        dark:         isLight ? '#003366' : '#004A99',
        contrastText: '#ffffff',
      },
      secondary: {
        main:         isLight ? '#5A6478' : '#8A9AB8',
        contrastText: '#ffffff',
      },
      background: {
        default: isLight ? '#F5F7FA' : '#0D1421',
        paper:   isLight ? '#FFFFFF'  : '#121D2F',
      },
      text: {
        primary:   isLight ? '#1A2033' : '#DCE6F5',
        secondary: isLight ? '#5A6478' : '#8A9AB8',
      },
      divider: isLight ? '#D0D9E8' : '#1E2D45',
      action: {
        hover:    isLight ? 'rgba(0,74,153,0.06)'  : 'rgba(64,158,232,0.10)',
        selected: isLight ? 'rgba(0,74,153,0.12)'  : 'rgba(64,158,232,0.16)',
      },
      error:   { main: '#CC2222' },
      warning: { main: '#E07A00' },
      success: { main: '#1A7A3C' },
    },
    typography: {
      fontFamily: [
        'BundesSans',
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'sans-serif',
      ].join(','),
      h6:    { fontWeight: 600, letterSpacing: '-0.01em' },
      body1: { fontSize: '0.9rem' },
      body2: { fontSize: '0.8rem' },
    },
    shape: { borderRadius: 4 },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#003366',
            color: '#FFFFFF',
            boxShadow: 'none',
            borderBottom: `3px solid #009EE0`,
          },
        },
      },
      MuiToolbar: {
        styleOverrides: { root: { minHeight: '52px !important' } },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: isLight ? '#009EE0' : '#5DB8F0',
            height: 3,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontSize: '0.78rem',
            fontWeight: 500,
            minHeight: 40,
            textTransform: 'none',
            letterSpacing: 0,
            '&.Mui-selected': {
              color: isLight ? '#004A99' : '#5DB8F0',
              fontWeight: 600,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 4,
            letterSpacing: '0.01em',
          },
          containedPrimary: {
            backgroundColor: '#004A99',
            '&:hover': { backgroundColor: '#003A7A' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${isLight ? '#D0D9E8' : '#1E2D45'}`,
          },
          elevation0: { border: 'none' },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: isLight ? '#D0D9E8' : '#1E2D45' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 4 },
          outlinedPrimary: {
            borderColor: isLight ? '#004A99' : '#409EE8',
            color:        isLight ? '#004A99' : '#409EE8',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          '*::-webkit-scrollbar':            { width: '6px', height: '6px' },
          '*::-webkit-scrollbar-track':      { background: 'transparent' },
          '*::-webkit-scrollbar-thumb':      { background: isLight ? '#B0BDD0' : '#1E2D45', borderRadius: '3px' },
          '*::-webkit-scrollbar-thumb:hover':{ background: '#009EE0' },
        },
      },
    },
  });
}

export function App() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => buildTheme(prefersDark ? 'dark' : 'light'), [prefersDark]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <JsonFormsEditor />
    </ThemeProvider>
  );
}
