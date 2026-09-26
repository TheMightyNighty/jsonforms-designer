import { createTheme } from '@mui/material/styles';

/**
 * Bundesportal-Stil (Design-Demonstration, keine zertifizierte Umsetzung):
 * ruhige Flächen, deutliche Fokus-Zustände, blaue Primärakzente.
 */
export const portalTheme = createTheme({
  palette: {
    primary: { main: '#004A99' },
    background: { default: '#F5F7FA', paper: '#FFFFFF' },
    text: { primary: '#1A2033' },
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: '"Bundes Sans", "Segoe UI", Arial, sans-serif',
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#004A99',
            borderWidth: 2,
          },
        },
      },
    },
  },
});
