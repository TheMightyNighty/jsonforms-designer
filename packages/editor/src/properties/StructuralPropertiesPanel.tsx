import { Box, Divider, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Dispatch } from 'react';

import { useEditorContext } from '../core/context';
import { EditorAction } from '../core/model/actions';
import { createSetFieldStateAction } from '../core/model/addFieldActions';
import { FieldAwareState } from '../core/model/addFieldReducer';
import { UiElement } from '../core/model/uiElements';
import { stripHtml } from '../core/util/plainText';
import { useI18n } from '../i18n';
import { KERN_FARBEN } from '../theme/kernTokens';
import { SectionColorPicker } from './SectionColorPicker';

/**
 * Hintergrundfarben für Abschnittsköpfe. Seit ADR 0004 aus den
 * KERN-Token statt aus einer eigenen Markenpalette. Gespeicherte
 * Alt-Farben bleiben gültig — sie werden beim Laden über
 * `legacyColorToToken` migriert (ADR 0002/V2).
 */
const HEADER_COLORS = [
  { bg: KERN_FARBEN.aktion, text: KERN_FARBEN.aufAktion, label: 'Blau' },
  { bg: KERN_FARBEN.info, text: KERN_FARBEN.aufAktion, label: 'Hellblau' },
  { bg: KERN_FARBEN.text, text: KERN_FARBEN.aufAktion, label: 'Anthrazit' },
  { bg: KERN_FARBEN.erfolg, text: KERN_FARBEN.aufAktion, label: 'Grün' },
  {
    bg: KERN_FARBEN.textGedaempft,
    text: KERN_FARBEN.aufAktion,
    label: 'Grau',
  },
  {
    bg: KERN_FARBEN.infoHintergrund,
    text: KERN_FARBEN.text,
    label: 'Hellblau (hell)',
  },
  { bg: KERN_FARBEN.flaeche, text: KERN_FARBEN.text, label: 'Hellgrau' },
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
    elements: UiElement[],
    key: string,
  ): UiElement | undefined {
    for (const e of elements) {
      if (e.id === key || ('scope' in e && e.scope === key)) return e;
      if (e.type === 'ColumnContainer')
        for (const col of e.columns) {
          const f = findElDeep(col, key);
          if (f) return f;
        }
      if (e.type === 'GroupContainer') {
        const f = findElDeep(e.children, key);
        if (f) return f;
      }
    }
  }
  const el = findElDeep(uiSchema.elements, selectedScope);
  if (!el) return null;

  const isLabel = el.type === 'Label' && !el.options?.variant;
  const isHeader =
    el.type === 'Label' && el.options?.variant === 'section-header';
  const isAnnotation =
    el.type === 'Label' && el.options?.variant === 'annotation';
  const isGroup = el.type === 'GroupContainer';
  const isLayout = el.type === 'ColumnContainer';

  const updateElement = (patch: Record<string, unknown>) => {
    function patchDeep(elements: UiElement[]): UiElement[] {
      return elements.map((e) => {
        if (
          e.id === selectedScope ||
          ('scope' in e && e.scope === selectedScope)
        )
          return { ...e, ...patch } as UiElement;
        if (e.type === 'ColumnContainer')
          return { ...e, columns: e.columns.map((col) => patchDeep(col)) };
        if (e.type === 'GroupContainer')
          return { ...e, children: patchDeep(e.children) };
        return e;
      });
    }
    dispatch(
      createSetFieldStateAction({
        ...fieldState,
        uiSchema: {
          ...uiSchema,
          elements: patchDeep(uiSchema.elements),
        },
      }),
    );
  };

  const updateOptions = (optPatch: Record<string, unknown>) => {
    updateElement({ options: { ...(el.options ?? {}), ...optPatch } });
  };

  return (
    <Box>
      {/*
        Strukturelemente (Überschrift, Hinweis, Gruppe, Spalten) tragen keine
        Antwort: Prüfungen, Bedingungen und Übersetzungen greifen an ihnen
        nicht. Nach ADR 0002 zeigt das Panel deshalb nur den passenden
        Reiter „Inhalt" — dieselbe Leiste wie bei Feldern, damit der Wechsel
        zwischen beiden nicht wie ein anderer Editor wirkt.
      */}
      <Tabs
        value={0}
        sx={{ px: 1, minHeight: 36 }}
        aria-label={t.properties.tabs.inhalt}
      >
        <Tab label={t.properties.tabs.inhalt} sx={{ minHeight: 36, py: 0.5 }} />
      </Tabs>

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
            label={
              isGroup ? t.properties.gruppenTitle : t.properties.textInhalt
            }
            value={el.label ?? ''}
            onChange={(e) =>
              updateElement({ label: stripHtml(e.target.value) })
            }
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
                  onClick={() =>
                    updateOptions({ bgColor: bg, textColor: text })
                  }
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
                backgroundColor:
                  (el.options?.bgColor as string) ?? KERN_FARBEN.aktion,
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
                  updateElement({
                    widths: parts,
                    columns: parts.map(() => []),
                  });
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
    </Box>
  );
}
