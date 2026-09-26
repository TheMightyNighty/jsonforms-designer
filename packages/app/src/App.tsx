import type { EditorConfig } from '@jsonforms-designer/editor';
import { fimPortalService, JsonFormsEditor } from '@jsonforms-designer/editor';
import { CssBaseline, ThemeProvider } from '@mui/material';

import { theme } from './theme';

// ---------------------------------------------------------------------------
// Editor-Konfiguration
// ---------------------------------------------------------------------------

const editorConfig: EditorConfig = {
  modules: {
    fim: { enabled: true, service: fimPortalService },
    openCode: { enabled: true },
  },
  palette: {
    collapsedByDefault: ['struktur', 'layout'],
  },
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <JsonFormsEditor config={editorConfig} />
    </ThemeProvider>
  );
}
