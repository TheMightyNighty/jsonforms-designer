/** UI-Schema tab changes are converted back via fromLegacy into the internal ColumnContainer tree. */
import Editor from '@monaco-editor/react';
import { Alert, Box, Tab, Tabs, useTheme } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

import { FieldAwareState } from '../../core/model/addFieldReducer';
import { FlatElement, fromLegacy, toLegacy } from '../../core/model/uiElements';

/** Baut JSONForms-kompatibles uiSchema für Monaco-Anzeige */
function buildDisplayUiSchema(fieldState: FieldAwareState): object {
  function convert(el: FlatElement | null | undefined): object | null {
    if (!el) return null;
    if (el.type === 'ColumnContainer' && el.columns) {
      return {
        type: 'HorizontalLayout',
        elements: el.columns.map((col: FlatElement[]) => ({
          type: 'VerticalLayout',
          elements: col.map(convert).filter(Boolean),
        })),
      };
    }
    if (el.type === 'GroupContainer' && (el.children || el.elements)) {
      return {
        type: 'Group',
        label: el.label ?? '',
        elements: (el.children ?? el.elements ?? [])
          .map(convert)
          .filter(Boolean),
      };
    }
    if (el.type === 'Label') return { type: 'Label', text: el.label ?? '' };
    if (el.type === 'Control') {
      const { id: _id, ...rest } = el;
      return rest;
    }
    return null;
  }
  return {
    type: 'VerticalLayout',
    elements: fieldState.uiSchema.elements.map(convert).filter(Boolean),
  };
}

/** Parst bearbeitetes uiSchema und konvertiert zurück in internes Format */
function parseUiSchema(raw: unknown): FieldAwareState['uiSchema'] {
  const elements = (raw as { elements?: unknown[] })?.elements ?? [];
  const converted = elements.map((el) => {
    const uiEl = fromLegacy(el as FlatElement);
    return toLegacy(uiEl) as FlatElement;
  });
  return { type: 'VerticalLayout', elements: converted };
}

type TabId = 'schema' | 'uischema' | 'data';

interface CodeModePanelProps {
  fieldState: FieldAwareState;
  previewData: Record<string, unknown>;
  onFieldStateChange: (state: FieldAwareState) => void;
  onPreviewDataChange: (data: Record<string, unknown>) => void;
}

export function CodeModePanel({
  fieldState,
  previewData,
  onFieldStateChange,
  onPreviewDataChange,
}: CodeModePanelProps) {
  const theme = useTheme();
  const [tab, setTab] = useState<TabId>('schema');
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const monacoTheme = theme.palette.mode === 'dark' ? 'vs-dark' : 'light';

  const getValue = useCallback((): string => {
    if (tab === 'schema') return JSON.stringify(fieldState.schema, null, 2);
    if (tab === 'uischema')
      return JSON.stringify(buildDisplayUiSchema(fieldState), null, 2);
    return JSON.stringify(previewData, null, 2);
  }, [tab, fieldState, previewData]);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!value) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        try {
          const parsed = JSON.parse(value);
          setError(null);
          if (tab === 'schema') {
            onFieldStateChange({ ...fieldState, schema: parsed });
          } else if (tab === 'uischema') {
            const nextUiSchema = parseUiSchema(parsed);
            onFieldStateChange({ ...fieldState, uiSchema: nextUiSchema });
          } else {
            onPreviewDataChange(parsed);
          }
        } catch {
          setError('Ungültiges JSON');
        }
      }, 600);
    },
    [tab, fieldState, onFieldStateChange, onPreviewDataChange],
  );

  useEffect(() => {
    setError(null);
  }, [tab]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as TabId)}
        sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
      >
        <Tab value="schema" label="JSON Schema" />
        <Tab value="uischema" label="UI Schema" />
        <Tab value="data" label="Vorschau-Daten" />
      </Tabs>
      {error && (
        <Alert severity="warning" sx={{ borderRadius: 0, py: 0.5 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Editor
          key={tab}
          height="100%"
          language="json"
          theme={monacoTheme}
          value={getValue()}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            formatOnPaste: true,
          }}
        />
      </Box>
    </Box>
  );
}
