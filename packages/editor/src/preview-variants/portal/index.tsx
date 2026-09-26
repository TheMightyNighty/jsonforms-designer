import { ThemeProvider } from '@mui/material/styles';

import { PreviewVariant } from '../shared/types';
import { portalCells } from './cells';
import { portalControlRenderers } from './controls';
import { portalLayoutRenderers } from './layouts';
import { portalTheme } from './theme';

export function PortalThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider theme={portalTheme}>{children}</ThemeProvider>;
}

export const portalVariant: PreviewVariant = {
  id: 'portal',
  name: 'Bundesportal-Stil',
  description:
    'Design-Demonstration auf Basis der jeweiligen Gestaltungsprinzipien — keine zertifizierte Umsetzung des Design-Systems.',
  renderers: [...portalLayoutRenderers, ...portalControlRenderers],
  cells: portalCells,
  ThemeProvider: PortalThemeProvider,
};
