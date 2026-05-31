import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { Box, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import { useI18n } from './i18n';
import { useState } from 'react';
import {
  Group, Panel, Separator, useDefaultLayout,
} from 'react-resizable-panels';

import { useDispatch, useFieldState, useSelectedScope } from './core/context';
import { createSetFieldStateAction } from './core/model/addFieldActions';
import { EditorAction } from './core/model/actions';
import { FieldAwareState } from './core/model/addFieldReducer';
import { Layout } from './core/components/Layout';
import { Header } from './core/components/Header';
import { EditorPanel } from './editor';
import { EditorMode } from './editor/editorMode';
import { CodeModePanel } from './editor/components/CodeModePanel';
import { PreviewPanel } from './editor/components/PreviewPanel';
import { FieldPalettePanel } from './palette-panel/FieldPalettePanel';
import { FieldPropertiesPanel } from './properties/FieldPropertiesPanel';

const handleSx = {
  width: '4px', height: '100%',
  backgroundColor: 'divider',
  cursor: 'col-resize', transition: 'background-color 0.2s',
  '&:hover': { backgroundColor: 'primary.light' },
};

// Gemeinsame Basis für alle Panels
const panelBase = { height: '100%', minHeight: '200px', overflow: 'auto' } as const;

// Seitenleisten: hellgrau (background.default)
const sidePanelSx = { ...panelBase, px: 1, backgroundColor: 'background.default' } as const;

// Editor-Canvas: weiß (background.paper) mit subtiler Einrahmung
const centerPanelSx = {
  ...panelBase,
  px: 1.5,
  backgroundColor: 'background.paper',
  borderLeft:  '1px solid',
  borderRight: '1px solid',
  borderColor: 'divider',
} as const;

interface JsonFormsEditorUiProps {
  editorRenderers: JsonFormsRendererRegistryEntry[];
  propertyRenderers?: JsonFormsRendererRegistryEntry[];
  header?: React.ComponentType;
  footer?: React.ComponentType;
}

/** Mobile/Tablet-Layout mit Tabs */
function MobileLayout({ editorRenderers, mode }: { editorRenderers: JsonFormsRendererRegistryEntry[]; mode: EditorMode }) {
  const [mobileTab, setMobileTab] = useState(1);
  const { t } = useI18n(); // 0=Palette 1=Editor 2=Properties
  const dispatch = useDispatch();
  const fieldState = useFieldState();
  const [selectedScope] = useSelectedScope();

  const handleFieldStateChange = (next: FieldAwareState) => {
    (dispatch as any)(createSetFieldStateAction(next));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs value={mobileTab} onChange={(_, v) => setMobileTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0, minHeight: 36 }}
        variant="fullWidth">
        <Tab label={t.mobile.fields} sx={{ minHeight: 36, py: 0.5, fontSize: '0.75rem' }} />
        <Tab label={t.mobile.editor} sx={{ minHeight: 36, py: 0.5, fontSize: '0.75rem' }} />
        <Tab label={t.mobile.properties} sx={{ minHeight: 36, py: 0.5, fontSize: '0.75rem' }} />
      </Tabs>
      <Box sx={{ flex: 1, overflow: 'auto', p: 1, backgroundColor: mobileTab === 1 ? 'background.paper' : 'background.default' }}>
        {mobileTab === 0 && <FieldPalettePanel />}
        {mobileTab === 1 && (
          mode === 'code'
            ? <CodeModePanel fieldState={fieldState} previewData={{}} onFieldStateChange={handleFieldStateChange} onPreviewDataChange={() => {}} />
            : mode === 'preview'
            ? <PreviewPanel fieldState={fieldState} />
            : <EditorPanel editorRenderers={editorRenderers} />
        )}
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

export const JsonFormsEditorUi = ({
  editorRenderers,
  footer,
}: JsonFormsEditorUiProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    groupId: 'vsp-editor-layout',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  });

  const dispatch = useDispatch();
  const fieldState = useFieldState();
  const [selectedScope] = useSelectedScope();
  const [mode, setMode] = useState<EditorMode>('visual');
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});

  const handleFieldStateChange = (next: FieldAwareState) => {
    (dispatch as React.Dispatch<EditorAction>)(
      createSetFieldStateAction(next) as unknown as EditorAction
    );
  };

  const HeaderWithMode = () => <Header mode={mode} onModeChange={setMode} />;

  const isPreview = mode === 'preview';

  return (
    <Layout HeaderComponent={HeaderWithMode} FooterComponent={footer}>
      {isPreview ? (
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <PreviewPanel fieldState={fieldState} initialData={previewData} />
        </Box>
      ) : isMobile ? (
        <MobileLayout editorRenderers={editorRenderers} mode={mode} />
      ) : (
        <Group defaultLayout={defaultLayout} onLayoutChange={onLayoutChange} style={{ height: '100%' }}>
          <Panel minSize="15%">
            <Box sx={sidePanelSx}><FieldPalettePanel /></Box>
          </Panel>
          <Separator><Box sx={handleSx} /></Separator>
          <Panel minSize="20%">
            <Box sx={centerPanelSx}>
              {mode === 'code'
                ? <CodeModePanel fieldState={fieldState} previewData={previewData}
                    onFieldStateChange={handleFieldStateChange} onPreviewDataChange={setPreviewData} />
                : <EditorPanel editorRenderers={editorRenderers} />
              }
            </Box>
          </Panel>
          <Separator><Box sx={handleSx} /></Separator>
          <Panel minSize="15%">
            <Box sx={sidePanelSx}>
              <FieldPropertiesPanel selectedScope={selectedScope} schema={fieldState.schema}
                uiSchema={fieldState.uiSchema} dispatch={dispatch} />
            </Box>
          </Panel>
        </Group>
      )}
    </Layout>
  );
};
