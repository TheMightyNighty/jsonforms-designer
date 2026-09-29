import { Box, Divider, Tooltip, Typography } from '@mui/material';
import { Dispatch } from 'react';

import { useEditorContext } from '../core/context';
import { EditorAction } from '../core/model/actions';
import { createSetSectionColorAction } from '../core/model/addFieldActions';
import {
  legacyColorToToken,
  SECTION_COLOR_DISPLAY,
  SECTION_COLOR_LABELS,
  SECTION_COLOR_TOKENS,
} from '../core/model/sectionColorTokens';

interface SectionColorPickerProps {
  elementId: string;
  dispatch: Dispatch<EditorAction>;
}

/**
 * Abschnittsfarben-Wähler: genau die sechs `ofm:sectionColor`-Token der
 * Options-Registry (OFM-R-421) — kein Freitext, keine weiteren Farben.
 */
export function SectionColorPicker({
  elementId,
  dispatch,
}: SectionColorPickerProps) {
  const { fieldState } = useEditorContext();
  const stored = fieldState.sectionColors[elementId];
  const current = stored ? legacyColorToToken(stored) : null;

  const set = (token: string | null) => {
    dispatch(createSetSectionColorAction(elementId, token));
  };

  return (
    <Box>
      <Divider sx={{ my: 1 }} />
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          display: 'block',
          mb: 0.75,
        }}
      >
        Abschnittsfarbe (ofm:sectionColor)
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Tooltip title="Keine Farbe">
          <Box
            role="button"
            tabIndex={0}
            aria-label="Keine Abschnittsfarbe"
            aria-pressed={!current}
            onClick={() => set(null)}
            onKeyDown={(e) => e.key === 'Enter' && set(null)}
            sx={{
              width: 26,
              height: 26,
              borderRadius: 1,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: !current ? 'primary.main' : 'divider',
              background:
                'linear-gradient(135deg, #fff 45%, #e00 45%, #e00 55%, #fff 55%)',
              flexShrink: 0,
            }}
          />
        </Tooltip>
        {SECTION_COLOR_TOKENS.map((token) => (
          <Tooltip key={token} title={SECTION_COLOR_LABELS[token]}>
            <Box
              role="button"
              tabIndex={0}
              aria-label={SECTION_COLOR_LABELS[token]}
              aria-pressed={current === token}
              onClick={() => set(token)}
              onKeyDown={(e) => e.key === 'Enter' && set(token)}
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1,
                cursor: 'pointer',
                backgroundColor: SECTION_COLOR_DISPLAY[token],
                border: '2px solid',
                borderColor:
                  current === token ? 'primary.main' : 'rgba(0,0,0,0.15)',
                boxShadow: (t) =>
                  current === token
                    ? `0 0 0 1px ${t.palette.primary.main}`
                    : 'none',
                '&:hover': {
                  transform: 'scale(1.15)',
                  borderColor: 'primary.light',
                },
                transition: 'transform 0.1s, border-color 0.1s',
                flexShrink: 0,
              }}
            />
          </Tooltip>
        ))}
      </Box>
      {current && (
        <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: 0.5,
              backgroundColor: SECTION_COLOR_DISPLAY[current],
              border: '1px solid rgba(0,0,0,0.2)',
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
          >
            {current}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
