import type { EditorConfig } from '@jsonforms-designer/editor';
import {
  fimPortalService,
  JsonFormsEditor,
  REGION_DE,
} from '@jsonforms-designer/editor';
import { CssBaseline, ThemeProvider } from '@mui/material';

import { theme } from './theme';

// ---------------------------------------------------------------------------
// Editor-Konfiguration
// ---------------------------------------------------------------------------

/**
 * Prototypen sind per Default aus (ADR 0003). Damit sie sich vorführen und
 * testen lassen, schaltet die Demo-Anwendung sie über die Adresszeile frei:
 * `?geraeteansicht=1`. Ein Betriebs-Host setzt stattdessen das Flag in seiner
 * eigenen EditorConfig.
 */
function flagAusAdresszeile(name: string): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get(name) === '1';
}

const editorConfig: EditorConfig = {
  // FIM und OpenCode sind im Kern aus (ADR 0007) — beides sind
  // Einrichtungen der deutschen Verwaltung. Das deutsche Profil schaltet
  // sie ein.
  modules: {
    fim: { enabled: true, service: fimPortalService },
    openCode: { enabled: true },
  },
  palette: {
    collapsedByDefault: ['struktur', 'layout'],
  },
  features: {
    canvasGeraeteAnsicht: flagAusAdresszeile('geraeteansicht'),
  },
  // Die Demo-Anwendung ist das deutsche Profil, der Kern ist neutral
  // (ADR 0007). Das Profil bringt Platzhalter mit Länderkennung mit und
  // schaltet die Prüfregeln ein, die nur nach deutschem Verwaltungsrecht
  // gelten.
  region: REGION_DE,
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
