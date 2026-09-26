import { createTheme } from '@mui/material/styles';

/**
 * KERN-Stil (Design-Demonstration, keine zertifizierte Umsetzung):
 * reduzierte, dichte Typografie-Hierarchie, großzügige vertikale Abstände,
 * gedeckte Farbtoken statt kräftiger Primärfarben.
 */
export const kernTheme = createTheme({
  palette: {
    primary: { main: '#2C5F4F' },
    background: { default: '#FDFCFA', paper: '#FFFFFF' },
    text: { primary: '#22261F' },
  },
  shape: { borderRadius: 2 },
  typography: {
    fontFamily: '"Source Sans Pro", "Helvetica Neue", Arial, sans-serif',
    body2: { fontSize: '0.9rem', lineHeight: 1.6 },
  },
});
