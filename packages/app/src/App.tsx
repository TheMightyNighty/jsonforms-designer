import type { EditorConfig } from '@jsonforms-designer/editor';
import {
  erzeugeKatalogLeiste,
  fimPortalService,
  JsonFormsEditor,
  KatalogFieldStateService,
  REGION_DE,
} from '@jsonforms-designer/editor';
import {
  Alert,
  Box,
  CircularProgress,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import { ComponentType, useEffect, useState } from 'react';

import { anmelden, KatalogKonfig, katalogKonfig } from './katalogAnmeldung';
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

type KatalogAnbindung = {
  dienst: KatalogFieldStateService;
  leiste: ComponentType;
};

/**
 * Designer mit Formularkatalog als Ablage: Anmeldung, dann Editor mit
 * Katalog-Adapter und Fußleiste für Stand und Freigabe.
 */
function KatalogEditor({ konfig }: { konfig: KatalogKonfig }) {
  const [anbindung, setAnbindung] = useState<KatalogAnbindung>();
  const [fehler, setFehler] = useState<string>();

  useEffect(() => {
    let abgebrochen = false;
    anmelden(konfig)
      .then((token) => {
        if (abgebrochen) return;
        const dienst = new KatalogFieldStateService({
          basisUrl: konfig.api,
          token,
        });
        setAnbindung({ dienst, leiste: erzeugeKatalogLeiste(dienst) });
      })
      .catch((err: unknown) => {
        if (!abgebrochen) setFehler(String(err));
      });
    return () => {
      abgebrochen = true;
    };
  }, [konfig]);

  if (fehler) {
    return (
      <Alert severity="error" sx={{ m: 4 }}>
        Anmeldung am Formularkatalog fehlgeschlagen: {fehler}
      </Alert>
    );
  }
  if (!anbindung) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress aria-label="Anmeldung läuft" />
      </Box>
    );
  }
  return (
    <JsonFormsEditor
      config={editorConfig}
      fieldStateStorage={anbindung.dienst}
      footer={anbindung.leiste}
    />
  );
}

const katalog = katalogKonfig();

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {katalog ? (
        <KatalogEditor konfig={katalog} />
      ) : (
        <JsonFormsEditor config={editorConfig} />
      )}
    </ThemeProvider>
  );
}
