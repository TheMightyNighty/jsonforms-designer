import { Box, Divider, TextField, Typography } from '@mui/material';
import { Dispatch } from 'react';

import { useEditorContext } from '../core/context';
import { EditorAction } from '../core/model/actions';
import { createSetFieldStateAction } from '../core/model/addFieldActions';
import { FieldAwareState } from '../core/model/addFieldReducer';
import { FlatElement } from '../core/model/uiElements';
import { useI18n } from '../i18n';
import { SectionColorPicker } from './SectionColorPicker';

const HEADER_COLORS = [
  { bg: '#004A99', text: '#ffffff', label: 'Dunkelblau' },
  { bg: '#009EE0', text: '#ffffff', label: 'Hellblau' },
  { bg: '#003366', text: '#ffffff', label: 'Dunkelblau (tief)' },
  { bg: '#1A7A3C', text: '#ffffff', label: 'Grün' },
  { bg: '#5A6478', text: '#ffffff', label: 'Grau' },
  { bg: '#C8D8F0', text: '#1A2033', label: 'Hellblau' },
  { bg: '#F5F5F5', text: '#1A2033', label: 'Hellgrau' },
];

interface StructuralPropertiesPanelProps {
  selectedScope: string;
  uiSchema: FieldAwareState['uiSchema'];
  dispatch: Dispatch<EditorAction>;
}

export function StructuralPropertiesPanel({
  selectedScope,
  uiSchema,
  dispatch,
}: StructuralPropertiesPanelProps) {
  const { fieldState } = useEditorContext();
  const { t } = useI18n();

  function findElDeep(
    elements: FlatElement[],
    key: string,
  ): FlatElement | undefined {
    for (const e of elements) {
      if (e.scope === key || e.id === key) return e;
      if (e.columns)
        for (const col of e.columns) {
          const f = findElDeep(col, key);
          if (f) return f;
        }
      if (e.children) {
        const f = findElDeep(e.children, key);
        if (f) return f;
      }
    }
  }
  const el = findElDeep(uiSchema.elements as FlatElement[], selectedScope);
  if (!el) return null;

  const isLabel = el.type === 'Label' && !el.options?.variant;
  const isHeader =
    el.type === 'Label' && el.options?.variant === 'section-header';
  const isAnnotation =
    el.type === 'Label' && el.options?.variant === 'annotation';
  const isGroup = el.type === 'Group' || el.type === 'GroupContainer';
  const isLayout =
    el.type === 'HorizontalLayout' || el.type === 'ColumnContainer';

  const updateElement = (patch: Record<string, unknown>) => {
    function patchDeep(elements: FlatElement[]): FlatElement[] {
      return elements.map((e) => {
        if (e.scope === selectedScope || e.id === selectedScope)
          return { ...e, ...patch };
        if (e.columns)
          return {
            ...e,
            columns: e.columns.map((col) => patchDeep(col)),
          };
        if (e.children) return { ...e, children: patchDeep(e.children) };
        return e;
      });
    }
    dispatch(
      createSetFieldStateAction({
        ...fieldState,
        uiSchema: {
          ...uiSchema,
          elements: patchDeep(uiSchema.elements as FlatElement[]),
        },
      }),
    );
  };

  const updateOptions = (optPatch: Record<string, unknown>) => {
    updateElement({ options: { ...(el.options ?? {}), ...optPatch } });
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{ color: 'text.secondary', fontWeight: 500 }}
      >
        {isHeader
          ? 'Abschnittskopf'
          : isAnnotation
            ? 'Annotation'
            : isGroup
              ? t.properties.gruppe
              : isLayout
                ? t.properties.spaltenLayout
                : t.properties.textElement}
      </Typography>
      <Divider />

      {(isLabel || isHeader || isAnnotation || isGroup) && (
        <TextField
          label={isGroup ? t.properties.gruppenTitle : t.properties.textInhalt}
          value={el.label ?? ''}
          onChange={(e) => updateElement({ label: e.target.value })}
          size="small"
          fullWidth
          multiline={isLabel || isAnnotation}
          minRows={isLabel || isAnnotation ? 2 : 1}
        />
      )}

      {isHeader && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              display: 'block',
              mb: 0.75,
            }}
          >
            Kopffarbe
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {HEADER_COLORS.map(({ bg, text, label }) => (
              <Box
                key={bg}
                role="button"
                tabIndex={0}
                title={label}
                onClick={() => updateOptions({ bgColor: bg, textColor: text })}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  updateOptions({ bgColor: bg, textColor: text })
                }
                sx={{
                  width: 32,
                  height: 22,
                  borderRadius: 1,
                  cursor: 'pointer',
                  backgroundColor: bg,
                  border: '2px solid',
                  borderColor:
                    el.options?.bgColor === bg ? 'primary.main' : 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': { transform: 'scale(1.1)' },
                  transition: 'transform 0.1s',
                }}
              >
                <Typography
                  sx={{ fontSize: '0.55rem', color: text, fontWeight: 700 }}
                >
                  Aa
                </Typography>
              </Box>
            ))}
          </Box>
          <Box
            sx={{
              mt: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: 1,
              backgroundColor: (el.options?.bgColor as string) ?? '#004A99',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: (el.options?.textColor as string) ?? '#fff',
                fontWeight: 700,
              }}
            >
              {el.label || 'Abschnittstitel'}
            </Typography>
          </Box>
        </Box>
      )}

      {isLayout && (
        <Box>
          <TextField
            label="Spaltenbreiten (z.B. 1:2:1 oder 1:3:2)"
            value={(el.widths ?? [1, 1]).join(':')}
            onChange={(e) => {
              const parts = e.target.value
                .split(':')
                .map((v) => parseInt(v.trim(), 10))
                .filter((n) => !isNaN(n) && n > 0);
              if (parts.length >= 2) {
                updateElement({ widths: parts, columns: parts.map(() => []) });
              }
            }}
            size="small"
            fullWidth
            helperText="Verhältnis der Spaltenbreiten, z.B. 1:2:1 = schmal-breit-schmal"
          />
          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, height: 20 }}>
            {(el.widths ?? [1, 1]).map((w: number, i: number) => (
              <Box
                key={i}
                sx={{
                  flex: w,
                  backgroundColor: 'primary.light',
                  borderRadius: 0.5,
                  opacity: 0.6,
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.55rem',
                    textAlign: 'center',
                    lineHeight: '20px',
                    color: 'white',
                    fontWeight: 700,
                  }}
                >
                  {w}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {(isGroup || isLayout) && (
        <SectionColorPicker elementId={selectedScope} dispatch={dispatch} />
      )}
    </Box>
  );
}
