import {
  Box,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { lazy, Suspense, useState } from 'react';
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels';

import { Header } from './core/components/Header';
import { Layout } from './core/components/Layout';
import { useDispatch, useFieldState, useSelectedScope } from './core/context';
import { createSetFieldStateAction } from './core/model/addFieldActions';
import { FieldAwareState } from './core/model/addFieldReducer';
import { EditorPanel } from './editor';
import { EditorMode } from './editor/editorMode';
import { useI18n } from './i18n';
import { FieldPalettePanel } from './palette-panel/FieldPalettePanel';
import { FieldPropertiesPanel } from './properties/FieldPropertiesPanel';

// Code-Modus lazy: Monaco (~1 MB gzip) wird erst beim ersten Öffnen geladen.
// Die Monaco-Konfiguration (loader.config) lebt im selben Chunk — racefrei.
const CodeModePanel = lazy(() =>
  import('./editor/components/CodeModePanel').then((m) => ({
    default: m.CodeModePanel,
  })),
);

const codeModeFallback = (
  <Box
    sx={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <CircularProgress aria-label="Code-Editor wird geladen" />
  </Box>
);

const handleSx = {
  width: '4px',
  height: '100%',
  backgroundColor: 'divider',
  cursor: 'col-resize',
  transition: 'background-color 0.2s',
  '&:hover': { backgroundColor: 'primary.light' },
};

// Gemeinsame Basis für alle Panels
const panelBase = {
  height: '100%',
  minHeight: '200px',
  overflow: 'auto',
} as const;

// Seitenleisten: hellgrau (background.default)
const sidePanelSx = {
  ...panelBase,
  px: 1,
  backgroundColor: 'background.default',
} as const;

// Editor-Canvas: weiß (background.paper) mit subtiler Einrahmung
const centerPanelSx = {
  ...panelBase,
  px: 1.5,
  backgroundColor: 'background.paper',
  borderLeft: '1px solid',
  borderRight: '1px solid',
  borderColor: 'divider',
} as const;

interface JsonFormsEditorUiProps {
  header?: React.ComponentType;
  footer?: React.ComponentType;
}

interface MobileLayoutProps {
  mode: EditorMode;
  testMode: boolean;
  testData: Record<string, unknown>;
  onTestDataChange: (data: Record<string, unknown>) => void;
}

/** Mobile/Tablet-Layout mit Tabs */
function MobileLayout({
  mode,
  testMode,
  testData,
  onTestDataChange,
}: MobileLayoutProps) {
  const [mobileTab, setMobileTab] = useState(1);
  const { t } = useI18n(); // 0=Palette 1=Editor 2=Properties
  const dispatch = useDispatch();
  const fieldState = useFieldState();
  const [selectedScope] = useSelectedScope();

  const handleFieldStateChange = (next: FieldAwareState) => {
    dispatch(createSetFieldStateAction(next));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={mobileTab}
        onChange={(_, v) => setMobileTab(v)}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
          minHeight: 36,
        }}
        variant="fullWidth"
      >
        <Tab
          label={t.mobile.fields}
          sx={{ minHeight: 36, py: 0.5, fontSize: '0.75rem' }}
        />
        <Tab
          label={t.mobile.editor}
          sx={{ minHeight: 36, py: 0.5, fontSize: '0.75rem' }}
        />
        <Tab
          label={t.mobile.properties}
          sx={{ minHeight: 36, py: 0.5, fontSize: '0.75rem' }}
        />
      </Tabs>
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1,
          backgroundColor:
            mobileTab === 1 ? 'background.paper' : 'background.default',
        }}
      >
        {mobileTab === 0 && <FieldPalettePanel />}
        {mobileTab === 1 &&
          (mode === 'code' ? (
            <Suspense fallback={codeModeFallback}>
              <CodeModePanel
                fieldState={fieldState}
                previewData={{}}
                onFieldStateChange={handleFieldStateChange}
                onPreviewDataChange={() => {}}
              />
            </Suspense>
          ) : (
            <EditorPanel
              testMode={testMode}
              testData={testData}
              onTestDataChange={onTestDataChange}
            />
          ))}
        {mobileTab === 2 && (
          <FieldPropertiesPanel
            selectedScope={selectedScope}
            schema={fieldState.schema}
            uiSchema={fieldState.uiSchema}
            dispatch={dispatch}
          />
        )}
      </Box>
    </Box>
  );
}

/**
 * Überschrift eines Arbeitsbereichs. Nur für Screenreader sichtbar: Die drei
 * Spalten sind visuell durch Trennlinien und Inhalt klar unterschieden, für
 * die Landmark- und Überschriften-Navigation fehlte bisher jede Struktur —
 * die Seite hatte genau eine Überschrift (den Produktnamen).
 */
function BereichsUeberschrift({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <Typography
      id={id}
      component="h2"
      // Visuell ausgeblendet, aber vorlesbar und in der
      // Überschriften-Navigation auffindbar (nicht display:none).
      sx={{
        // Achtung: MUI deutet sx-Zahlen zwischen 0 und 1 als Bruchteil —
        // `width: 1` wäre 100 % und riss die Seite auf 3x Breite auf.
        position: 'absolute',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Typography>
  );
}

export const JsonFormsEditorUi = ({ footer }: JsonFormsEditorUiProps) => {
  const theme = useTheme();
  const { t } = useI18n();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    groupId: 'vsp-editor-layout',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  });

  const dispatch = useDispatch();
  const fieldState = useFieldState();
  const [selectedScope] = useSelectedScope();
  const [mode, setMode] = useState<EditorMode>('visual');
  const [testMode, setTestMode] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});

  const handleFieldStateChange = (next: FieldAwareState) => {
    dispatch(createSetFieldStateAction(next));
  };

  const HeaderWithMode = () => (
    <Header
      mode={mode}
      onModeChange={setMode}
      testMode={testMode}
      onTestModeChange={setTestMode}
    />
  );

  return (
    <Layout HeaderComponent={HeaderWithMode} FooterComponent={footer}>
      {isMobile ? (
        <MobileLayout
          mode={mode}
          testMode={testMode}
          testData={previewData}
          onTestDataChange={setPreviewData}
        />
      ) : (
        <Group
          defaultLayout={defaultLayout}
          onLayoutChange={onLayoutChange}
          style={{ height: '100%' }}
        >
          <Panel minSize="15%">
            <Box
              component="section"
              aria-labelledby="bereich-palette"
              sx={sidePanelSx}
            >
              <BereichsUeberschrift id="bereich-palette">
                {t.bereiche.palette}
              </BereichsUeberschrift>
              <FieldPalettePanel />
            </Box>
          </Panel>
          <Separator>
            <Box sx={handleSx} />
          </Separator>
          <Panel minSize="20%">
            <Box
              component="section"
              aria-labelledby="bereich-arbeitsflaeche"
              sx={centerPanelSx}
            >
              <BereichsUeberschrift id="bereich-arbeitsflaeche">
                {t.bereiche.arbeitsflaeche}
              </BereichsUeberschrift>
              {mode === 'code' ? (
                <Suspense fallback={codeModeFallback}>
                  <CodeModePanel
                    fieldState={fieldState}
                    previewData={previewData}
                    onFieldStateChange={handleFieldStateChange}
                    onPreviewDataChange={setPreviewData}
                  />
                </Suspense>
              ) : (
                <EditorPanel
                  testMode={testMode}
                  testData={previewData}
                  onTestDataChange={setPreviewData}
                />
              )}
            </Box>
          </Panel>
          <Separator>
            <Box sx={handleSx} />
          </Separator>
          <Panel minSize="15%">
            <Box
              component="section"
              aria-labelledby="bereich-eigenschaften"
              sx={sidePanelSx}
            >
              <BereichsUeberschrift id="bereich-eigenschaften">
                {t.bereiche.eigenschaften}
              </BereichsUeberschrift>
              <FieldPropertiesPanel
                selectedScope={selectedScope}
                schema={fieldState.schema}
                uiSchema={fieldState.uiSchema}
                dispatch={dispatch}
              />
            </Box>
          </Panel>
        </Group>
      )}
    </Layout>
  );
};
