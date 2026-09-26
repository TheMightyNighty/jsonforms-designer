import { JsonSchema7, UISchemaElement } from '@jsonforms/core';
import {
  materialCells,
  materialRenderers,
} from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import PrintIcon from '@mui/icons-material/Print';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';

import { FieldAwareState, FormTab } from '../../core/model/addFieldReducer';
import { sectionColorDisplay } from '../../core/model/sectionColorTokens';
import { toJsonForms, UiElement } from '../../core/model/uiElements';
import { buildOfmSchema, buildOfmUiSchema } from '../../core/util/ofmExport';
import { PREVIEW_VARIANTS, PreviewVariant } from '../../preview-variants';
import { KERN_FARBEN } from '../../theme/kernTokens';
import { FormStepperSidebar } from './FormStepperSidebar';

const PREVIEW_VARIANT_STORAGE_KEY = 'jfd_previewVariant_v1';

function isValidVariantId(value: unknown): value is PreviewVariant['id'] {
  return PREVIEW_VARIANTS.some((v) => v.id === value);
}

function readStoredVariantId(): PreviewVariant['id'] {
  try {
    const stored = sessionStorage.getItem(PREVIEW_VARIANT_STORAGE_KEY);
    if (isValidVariantId(stored)) return stored;
  } catch {
    // sessionStorage kann in eingeschränkten Umgebungen fehlen — Fallback.
  }
  return 'standard';
}

/** Kürzt einen Hex-Hash für die Fußzeile: erste 4 + letzte 2 Zeichen. */
function shortHash(hex: string): string {
  if (hex.length <= 6) return hex;
  return `${hex.slice(0, 4)}…${hex.slice(-2)}`;
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}

async function sha256Hex(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Konverter internes → JSONForms
// ---------------------------------------------------------------------------
function convertEl(el: UiElement): object | null {
  if (el.type === 'Label' && el.options?.variant === 'section-header')
    return null; // eigene Darstellung
  if (el.type === 'Label' && el.options?.variant === 'annotation') return null; // eigene Darstellung
  return toJsonForms(el);
}

// ---------------------------------------------------------------------------
// buildPreviewUiSchema
// ---------------------------------------------------------------------------
function buildPreviewUiSchema(fieldState: FieldAwareState): object {
  const { uiSchema, tabs, tabAssignments } = fieldState;
  if (tabs.length === 0) {
    return {
      type: 'VerticalLayout',
      elements: uiSchema.elements.map(convertEl).filter(Boolean),
    };
  }
  const tabBuckets: object[][] = tabs.map(() => []);
  uiSchema.elements.forEach((el) => {
    const id = 'scope' in el ? (el.scope ?? el.id) : el.id;
    const idx = Math.min(tabAssignments[id] ?? 0, tabBuckets.length - 1);
    const jfEl = convertEl(el);
    if (jfEl) tabBuckets[idx].push(jfEl);
  });
  return {
    type: 'Categorization',
    elements: tabs.map((tab: FormTab, i: number) => ({
      type: 'Category',
      label: tab.label,
      elements: [{ type: 'VerticalLayout', elements: tabBuckets[i] ?? [] }],
    })),
  };
}

// ---------------------------------------------------------------------------
// buildTabUiSchemas — pro Schritt ein eigenständiges VerticalLayout, damit
// die Vorschau die Schrittnavigation selbst steuert statt sie dem
// materialRenderers-Categorization-Widget zu überlassen.
// ---------------------------------------------------------------------------
function buildTabUiSchemas(fieldState: FieldAwareState): object[] {
  const { uiSchema, tabs, tabAssignments } = fieldState;
  if (tabs.length === 0) return [];
  const buckets: object[][] = tabs.map(() => []);
  uiSchema.elements.forEach((el) => {
    const id = 'scope' in el ? (el.scope ?? el.id) : el.id;
    const idx = Math.min(tabAssignments[id] ?? 0, buckets.length - 1);
    const jfEl = convertEl(el);
    if (jfEl) buckets[idx].push(jfEl);
  });
  return tabs.map((_, i) => ({
    type: 'VerticalLayout',
    elements: buckets[i] ?? [],
  }));
}

// ---------------------------------------------------------------------------
// buildPreviewSchema
// ---------------------------------------------------------------------------
function buildPreviewSchema(fieldState: FieldAwareState) {
  const { schema } = fieldState;
  if (!schema.properties) return schema;
  const enriched: Record<string, JsonSchema7> = {};
  for (const [key, def] of Object.entries(schema.properties)) {
    const fd = def as JsonSchema7 & { 'x-opencode-validators'?: string[] };
    const validators: string[] = fd['x-opencode-validators'] ?? [];
    enriched[key] =
      validators.length > 0
        ? {
            ...fd,
            description: `${fd.description ? fd.description + ' · ' : ''}Validiert: ${validators.map((v: string) => v.replace('oc-val-', '')).join(', ')}`,
          }
        : fd;
  }
  return { ...schema, properties: enriched };
}

// ---------------------------------------------------------------------------
// Kontrast-Hilfsfunktion
// ---------------------------------------------------------------------------
function getContrastColor(hex: string): string {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55 ? '#1A2033' : '#FFFFFF';
  } catch {
    return '#1A2033';
  }
}

/** Erstellt ein MUI-Theme das auf dem gegebenen Hintergrund gut lesbar ist */
function makeContrastTheme(bgColor: string, baseMode: 'light' | 'dark') {
  const textMain = getContrastColor(bgColor);
  return createTheme({
    palette: {
      mode: baseMode,
      text: {
        primary: textMain,
        secondary:
          textMain === '#FFFFFF'
            ? 'rgba(255,255,255,0.7)'
            : 'rgba(26,32,51,0.65)',
      },
      background: { paper: bgColor, default: bgColor },
    },
  });
}

// ---------------------------------------------------------------------------
// PreviewWrapper
// ---------------------------------------------------------------------------
interface PreviewWrapperProps {
  elements: UiElement[];
  schema: object;
  lineNumbers: boolean;
  sectionColors: Record<string, string>;
}

function PreviewWrapper({
  elements,
  schema,
  lineNumbers,
  sectionColors,
}: PreviewWrapperProps) {
  const theme = useTheme();
  return (
    <Box>
      {elements.map((el, idx: number) => {
        const id = 'scope' in el ? (el.scope ?? el.id) : el.id;
        const storedColor = sectionColors[id];
        const bgColor = storedColor
          ? sectionColorDisplay(storedColor)
          : undefined;
        const numColor = bgColor ? getContrastColor(bgColor) : undefined;
        const isHeader =
          el.type === 'Label' && el.options?.variant === 'section-header';
        const isAnnotation =
          el.type === 'Label' && el.options?.variant === 'annotation';

        if (isHeader) {
          const hBg = (el.options?.bgColor as string) ?? KERN_FARBEN.aktion;
          const hText = (el.options?.textColor as string) ?? '#ffffff';
          return (
            <Box
              key={id}
              sx={{ display: 'flex', alignItems: 'stretch', mb: 0.5 }}
            >
              {lineNumbers && (
                <Box
                  sx={{
                    minWidth: 28,
                    textAlign: 'right',
                    pr: 1,
                    pt: 0.5,
                    flexShrink: 0,
                    color: '#888',
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  {idx + 1}
                </Box>
              )}
              <Box
                sx={{
                  flex: 1,
                  px: 1.5,
                  py: 0.6,
                  borderRadius: 0.5,
                  backgroundColor: hBg,
                }}
              >
                <Box
                  component="span"
                  sx={{ fontWeight: 700, fontSize: '0.85rem', color: hText }}
                >
                  {el.label ?? ''}
                </Box>
              </Box>
            </Box>
          );
        }

        if (isAnnotation) {
          return (
            <Box
              key={id}
              sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}
            >
              {lineNumbers && (
                <Box
                  sx={{
                    minWidth: 28,
                    textAlign: 'right',
                    pr: 1,
                    flexShrink: 0,
                    color: '#888',
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  {idx + 1}
                </Box>
              )}
              <Box
                sx={{
                  flex: 1,
                  borderLeft: '3px solid #D0D9E8',
                  pl: 1,
                  py: 0.25,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontSize: '0.75rem',
                    color: '#5A6478',
                    fontStyle: 'italic',
                  }}
                >
                  {el.label ?? ''}
                </Box>
              </Box>
            </Box>
          );
        }

        const jfEl = convertEl(el);
        if (!jfEl) return null;

        return (
          <Box
            key={id}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              mb: 0.5,
              backgroundColor: bgColor,
              borderRadius: bgColor ? 1 : 0,
              p: bgColor ? 0.75 : 0,
            }}
          >
            {lineNumbers && (
              <Box
                sx={{
                  minWidth: 28,
                  textAlign: 'right',
                  pr: 1,
                  pt: 1.5,
                  flexShrink: 0,
                  color: numColor ?? '#888',
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  // Schatten für Lesbarkeit auf farbigem Hintergrund
                  textShadow: bgColor ? '0 0 3px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {idx + 1}
              </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {bgColor ? (
                <ThemeProvider
                  theme={makeContrastTheme(bgColor, theme.palette.mode)}
                >
                  <JsonForms
                    schema={schema as JsonSchema7}
                    uischema={jfEl as UISchemaElement}
                    data={{}}
                    renderers={materialRenderers}
                    cells={materialCells}
                    onChange={() => {}}
                  />
                </ThemeProvider>
              ) : (
                <JsonForms
                  schema={schema as JsonSchema7}
                  uischema={jfEl as UISchemaElement}
                  data={{}}
                  renderers={materialRenderers}
                  cells={materialCells}
                  onChange={() => {}}
                />
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

export function PreviewPanel({
  fieldState,
  initialData = {},
}: PreviewPanelProps) {
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [activeStep, setActiveStep] = useState(0);
  const [variantId, setVariantId] = useState<PreviewVariant['id']>(() =>
    readStoredVariantId(),
  );
  const [hashLabel, setHashLabel] = useState<string>('');

  const selectedVariant =
    PREVIEW_VARIANTS.find((v) => v.id === variantId) ?? PREVIEW_VARIANTS[0];

  useEffect(() => {
    try {
      sessionStorage.setItem(PREVIEW_VARIANT_STORAGE_KEY, variantId);
    } catch {
      // sessionStorage kann in eingeschränkten Umgebungen fehlen.
    }
  }, [variantId]);

  // Tastaturkürzel 1/2/3 für den Varianten-Wechsel — nur außerhalb von
  // Eingabefeldern, damit Ziffern in Formularfeldern der Vorschau nicht
  // abgefangen werden.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      const isEditable =
        active instanceof HTMLElement &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) ||
          active.isContentEditable);
      if (isEditable) return;
      const index = ['1', '2', '3'].indexOf(e.key);
      if (index === -1) return;
      const variant = PREVIEW_VARIANTS[index];
      if (variant) setVariantId(variant.id);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Hash der tatsächlich exportierten OFM-Artefakte (schema.json/
  // uischema.json) — hängt bewusst nur von fieldState ab, NICHT von der
  // gewählten Variante: der Hash beweist, dass der Variantenwechsel die
  // Artefakte nicht verändert.
  useEffect(() => {
    let cancelled = false;
    async function computeHash() {
      const schemaContent = serializeJson(buildOfmSchema(fieldState));
      const uischemaContent = serializeJson(buildOfmUiSchema(fieldState));
      const [schemaHash, uischemaHash] = await Promise.all([
        sha256Hex(schemaContent),
        sha256Hex(uischemaContent),
      ]);
      if (!cancelled) {
        setHashLabel(
          `schema.json: ${shortHash(schemaHash)} · uischema.json: ${shortHash(uischemaHash)}`,
        );
      }
    }
    computeHash();
    return () => {
      cancelled = true;
    };
  }, [fieldState]);

  const hasContent =
    Object.keys(fieldState.schema.properties ?? {}).length > 0 ||
    fieldState.uiSchema.elements.length > 0;

  const previewSchema = useMemo(
    () => buildPreviewSchema(fieldState),
    [fieldState],
  );
  const previewUiSchema = useMemo(
    () => buildPreviewUiSchema(fieldState),
    [fieldState],
  );
  const tabUiSchemas = useMemo(
    () => buildTabUiSchemas(fieldState),
    [fieldState],
  );
  const showLineNumbers = fieldState.lineNumbersEnabled;
  const hasColors = Object.keys(fieldState.sectionColors).length > 0;
  const hasTabs = fieldState.tabs.length > 1;
  const formTitle = (fieldState.schema as JsonSchema7).title;
  const clampedStep = Math.min(
    activeStep,
    Math.max(fieldState.tabs.length - 1, 0),
  );

  // Schlanke Werkzeugleiste — der Formulartitel wandert als Überschrift in
  // den Inhaltsbereich, damit die Vorschau wie ein eigenständiges Formular
  // wirkt statt wie ein Editor-Werkzeug.
  const toolbar = (
    <Box
      className="no-print"
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        gap: 1,
      }}
    >
      <Tooltip title={selectedVariant.description}>
        <Select
          size="small"
          value={selectedVariant.id}
          onChange={(e) => setVariantId(e.target.value as PreviewVariant['id'])}
          aria-label="Design-Variante"
          sx={{ minWidth: 200 }}
        >
          {PREVIEW_VARIANTS.map((variant, i) => (
            <MenuItem key={variant.id} value={variant.id}>
              {variant.name} ({i + 1})
            </MenuItem>
          ))}
        </Select>
      </Tooltip>
      <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
        {selectedVariant.description}
      </Typography>
      <Box sx={{ flex: 1 }} />
      <Tooltip title="Formular drucken (Strg+P)">
        <Button
          size="small"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
          variant="outlined"
        >
          Drucken
        </Button>
      </Tooltip>
    </Box>
  );

  const hashFooter = (
    <Box
      className="no-print"
      sx={{
        px: 2,
        py: 0.5,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
      >
        {hashLabel}
      </Typography>
    </Box>
  );

  const headline = formTitle ? (
    <Typography variant="h4" sx={{ mb: 3 }}>
      {formTitle}
    </Typography>
  ) : null;

  if (!hasContent) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {toolbar}
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            Noch keine Felder vorhanden. Im visuellen Modus Felder aus der
            Palette hinzufügen.
          </Alert>
        </Box>
      </Box>
    );
  }

  if (showLineNumbers || hasColors) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {toolbar}
        <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }} className="print-area">
          {headline}
          <PreviewWrapper
            elements={fieldState.uiSchema.elements}
            schema={previewSchema}
            lineNumbers={showLineNumbers}
            sectionColors={fieldState.sectionColors}
          />
        </Box>
        {hashFooter}
      </Box>
    );
  }

  if (hasTabs) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {toolbar}
        <Box
          sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}
          className="print-area"
        >
          <FormStepperSidebar
            steps={fieldState.tabs}
            activeStep={clampedStep}
            onStepClick={setActiveStep}
          />
          <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
            {headline}
            <selectedVariant.ThemeProvider>
              <JsonForms
                schema={previewSchema as JsonSchema7}
                uischema={tabUiSchemas[clampedStep] as UISchemaElement}
                data={data}
                renderers={selectedVariant.renderers}
                cells={selectedVariant.cells}
                onChange={({ data: d }) => setData(d)}
              />
            </selectedVariant.ThemeProvider>
          </Box>
        </Box>
        {hashFooter}
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {toolbar}
      <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }} className="print-area">
        {headline}
        <selectedVariant.ThemeProvider>
          <JsonForms
            schema={previewSchema as JsonSchema7}
            uischema={previewUiSchema as UISchemaElement}
            data={data}
            renderers={selectedVariant.renderers}
            cells={selectedVariant.cells}
            onChange={({ data: d }) => setData(d)}
          />
        </selectedVariant.ThemeProvider>
      </Box>
      {hashFooter}
    </Box>
  );
}
