import { materialCells, materialRenderers } from '@jsonforms/material-renderers';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import { JsonForms } from '@jsonforms/react';
import { Alert, Box, Button, Chip, Step, StepLabel, Stepper, Tooltip } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { useState, useMemo } from 'react';

import { FieldAwareState, FormTab } from '../../core/model/addFieldReducer';
import { toJsonForms, FlatElement } from '../../core/model/uiElements';

// ---------------------------------------------------------------------------
// Konverter internes → JSONForms
// ---------------------------------------------------------------------------
function convertEl(el: any): object | null {
  if (el.type === 'Label' && el.options?.variant === 'section-header') return null; // eigene Darstellung
  if (el.type === 'Label' && el.options?.variant === 'annotation') return null;     // eigene Darstellung
  return toJsonForms(el as FlatElement);
}

// ---------------------------------------------------------------------------
// buildPreviewUiSchema
// ---------------------------------------------------------------------------
function buildPreviewUiSchema(fieldState: FieldAwareState): object {
  const { uiSchema, tabs, tabAssignments } = fieldState;
  if (tabs.length === 0) {
    return { type: 'VerticalLayout', elements: uiSchema.elements.map(convertEl).filter(Boolean) };
  }
  const tabBuckets: object[][] = tabs.map(() => []);
  uiSchema.elements.forEach((el: any) => {
    const id = el.id ?? el.scope ?? '';
    const idx = Math.min(tabAssignments[id] ?? 0, tabBuckets.length - 1);
    const jfEl = convertEl(el);
    if (jfEl) tabBuckets[idx].push(jfEl);
  });
  return {
    type: 'Categorization',
    elements: tabs.map((tab: FormTab, i: number) => ({
      type: 'Category', label: tab.label,
      elements: [{ type: 'VerticalLayout', elements: tabBuckets[i] ?? [] }],
    })),
  };
}

// ---------------------------------------------------------------------------
// buildPreviewSchema
// ---------------------------------------------------------------------------
function buildPreviewSchema(fieldState: FieldAwareState) {
  const { schema } = fieldState;
  if (!schema.properties) return schema;
  const enriched: Record<string, any> = {};
  for (const [key, def] of Object.entries(schema.properties)) {
    const fd = def as any;
    const validators: string[] = fd['x-opencode-validators'] ?? [];
    enriched[key] = validators.length > 0
      ? { ...fd, description: `${fd.description ? fd.description + ' · ' : ''}Validiert: ${validators.map((v: string) => v.replace('oc-val-', '')).join(', ')}` }
      : fd;
  }
  return { ...schema, properties: enriched };
}

// ---------------------------------------------------------------------------
// Kontrast-Hilfsfunktion
// ---------------------------------------------------------------------------
function getContrastColor(hex: string): string {
  try {
    const h = hex.replace('#','');
    const r = parseInt(h.slice(0,2), 16);
    const g = parseInt(h.slice(2,4), 16);
    const b = parseInt(h.slice(4,6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55 ? '#1A2033' : '#FFFFFF';
  } catch { return '#1A2033'; }
}

/** Erstellt ein MUI-Theme das auf dem gegebenen Hintergrund gut lesbar ist */
function makeContrastTheme(bgColor: string, baseMode: 'light' | 'dark') {
  const textMain = getContrastColor(bgColor);
  return createTheme({
    palette: {
      mode: baseMode,
      text: {
        primary: textMain,
        secondary: textMain === '#FFFFFF' ? 'rgba(255,255,255,0.7)' : 'rgba(26,32,51,0.65)',
      },
      background: { paper: bgColor, default: bgColor },
    },
  });
}

// ---------------------------------------------------------------------------
// PreviewWrapper
// ---------------------------------------------------------------------------
interface PreviewWrapperProps {
  elements: any[];
  schema: object;
  lineNumbers: boolean;
  sectionColors: Record<string, string>;
}

function PreviewWrapper({ elements, schema, lineNumbers, sectionColors }: PreviewWrapperProps) {
  const theme = useTheme();
  return (
    <Box>
      {elements.map((el: any, idx: number) => {
        const id = el.id ?? el.scope ?? String(idx);
        const bgColor = sectionColors[id] ?? undefined;
        const numColor = bgColor ? getContrastColor(bgColor) : undefined;
        const isHeader   = el.type === 'Label' && el.options?.variant === 'section-header';
        const isAnnotation = el.type === 'Label' && el.options?.variant === 'annotation';

        if (isHeader) {
          const hBg   = (el.options?.bgColor as string) ?? '#004A99';
          const hText = (el.options?.textColor as string) ?? '#ffffff';
          return (
            <Box key={id} sx={{ display: 'flex', alignItems: 'stretch', mb: 0.5 }}>
              {lineNumbers && (
                <Box sx={{ minWidth: 28, textAlign: 'right', pr: 1, pt: 0.5, flexShrink: 0,
                  color: '#888', fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 600 }}>
                  {idx + 1}
                </Box>
              )}
              <Box sx={{ flex: 1, px: 1.5, py: 0.6, borderRadius: 0.5, backgroundColor: hBg }}>
                <Box component="span" sx={{ fontWeight: 700, fontSize: '0.85rem', color: hText }}>
                  {el.label ?? ''}
                </Box>
              </Box>
            </Box>
          );
        }

        if (isAnnotation) {
          return (
            <Box key={id} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
              {lineNumbers && (
                <Box sx={{ minWidth: 28, textAlign: 'right', pr: 1, flexShrink: 0,
                  color: '#888', fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 600 }}>
                  {idx + 1}
                </Box>
              )}
              <Box sx={{ flex: 1, borderLeft: '3px solid #D0D9E8', pl: 1, py: 0.25 }}>
                <Box component="span" sx={{ fontSize: '0.75rem', color: '#5A6478', fontStyle: 'italic' }}>
                  {el.label ?? ''}
                </Box>
              </Box>
            </Box>
          );
        }

        const jfEl = convertEl(el);
        if (!jfEl) return null;

        return (
          <Box key={id} sx={{
            display: 'flex', alignItems: 'flex-start', mb: 0.5,
            backgroundColor: bgColor, borderRadius: bgColor ? 1 : 0,
            p: bgColor ? 0.75 : 0,
          }}>
            {lineNumbers && (
              <Box sx={{
                minWidth: 28, textAlign: 'right', pr: 1, pt: 1.5, flexShrink: 0,
                color: numColor ?? '#888',
                fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700,
                // Schatten für Lesbarkeit auf farbigem Hintergrund
                textShadow: bgColor ? '0 0 3px rgba(0,0,0,0.3)' : 'none',
              }}>
                {idx + 1}
              </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {bgColor ? (
                <ThemeProvider theme={makeContrastTheme(bgColor, theme.palette.mode)}>
                  <JsonForms schema={schema as any} uischema={jfEl as any} data={{}}
                    renderers={materialRenderers} cells={materialCells} onChange={() => {}} />
                </ThemeProvider>
              ) : (
                <JsonForms schema={schema as any} uischema={jfEl as any} data={{}}
                  renderers={materialRenderers} cells={materialCells} onChange={() => {}} />
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Haupt-Komponente
// ---------------------------------------------------------------------------
interface PreviewPanelProps {
  fieldState: FieldAwareState;
  initialData?: Record<string, unknown>;
}

export function PreviewPanel({ fieldState, initialData = {} }: PreviewPanelProps) {
  const [data, setData]       = useState<Record<string, unknown>>(initialData);
  const [activeStep, setActiveStep] = useState(0);

  const hasContent =
    Object.keys(fieldState.schema.properties ?? {}).length > 0 ||
    fieldState.uiSchema.elements.length > 0;

  const previewSchema   = useMemo(() => buildPreviewSchema(fieldState), [fieldState]);
  const previewUiSchema = useMemo(() => buildPreviewUiSchema(fieldState), [fieldState]);
  const showLineNumbers = fieldState.lineNumbersEnabled;
  const hasColors       = Object.keys(fieldState.sectionColors).length > 0;
  const hasTabs         = fieldState.tabs.length > 1;
  const formTitle       = (fieldState.schema as any).title;

  // Toolbar (Print + Formular-Titel)
  const toolbar = (
    <Box
      className="no-print"
      sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', gap: 1 }}
    >
      {formTitle && (
        <Chip label={formTitle} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
      )}
      <Box sx={{ flex: 1 }} />
      <Tooltip title="Formular drucken (Strg+P)">
        <Button size="small" startIcon={<PrintIcon />} onClick={() => window.print()} variant="outlined">
          Drucken
        </Button>
      </Tooltip>
    </Box>
  );

  if (!hasContent) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {toolbar}
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            Noch keine Felder vorhanden. Im visuellen Modus Felder aus der Palette hinzufügen.
          </Alert>
        </Box>
      </Box>
    );
  }

  // Seitenumbruch-Stepper (mehrstufige Formulare)
  const stepper = hasTabs ? (
    <Box className="no-print" sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {fieldState.tabs.map((tab, i) => (
          <Step key={i} completed={i < activeStep} onClick={() => setActiveStep(i)}
            sx={{ cursor: 'pointer' }}>
            <StepLabel>{tab.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  ) : null;

  if (showLineNumbers || hasColors) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {toolbar}
        {stepper}
        <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }} className="print-area">
          <PreviewWrapper
            elements={fieldState.uiSchema.elements as any[]}
            schema={previewSchema}
            lineNumbers={showLineNumbers}
            sectionColors={fieldState.sectionColors}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {toolbar}
      {stepper}
      <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }} className="print-area">
        <JsonForms
          schema={previewSchema as any}
          uischema={previewUiSchema as any}
          data={data}
          renderers={materialRenderers}
          cells={materialCells}
          onChange={({ data: d }) => setData(d)}
        />
      </Box>
    </Box>
  );
}
