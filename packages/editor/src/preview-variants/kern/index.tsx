import { ThemeProvider } from '@mui/material/styles';

import { PreviewVariant } from '../shared/types';
import { kernCells } from './cells';
import { kernControlRenderers } from './controls';
import { kernLayoutRenderers } from './layouts';
import { kernTheme } from './theme';

export function KernThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={kernTheme}>{children}</ThemeProvider>;
}

export const kernVariant: PreviewVariant = {
  id: 'kern',
  name: 'KERN-Stil',
  description:
    'Design-Demonstration auf Basis der jeweiligen Gestaltungsprinzipien — keine zertifizierte Umsetzung des Design-Systems.',
  renderers: [...kernLayoutRenderers, ...kernControlRenderers],
  cells: kernCells,
  ThemeProvider: KernThemeProvider,
};
