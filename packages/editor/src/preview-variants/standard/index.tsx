/**
 * Standard-Variante: reiner Re-Export des bestehenden MUI-Renderer-Sets.
 * Keine eigenen Komponenten — dient als Referenzpunkt für den Vergleich mit
 * portal/ und kern/.
 */
import {
  materialCells,
  materialRenderers,
} from '@jsonforms/material-renderers';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { PreviewVariant } from '../shared/types';

const standardTheme = createTheme();

export function StandardThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider theme={standardTheme}>{children}</ThemeProvider>;
}

export const standardVariant: PreviewVariant = {
  id: 'standard',
  name: 'Standard (Material)',
  description:
    'Das bestehende Material-Design-Renderer-Set des Editors — keine gesonderte Gestaltung.',
  renderers: materialRenderers,
  cells: materialCells,
  ThemeProvider: StandardThemeProvider,
};
