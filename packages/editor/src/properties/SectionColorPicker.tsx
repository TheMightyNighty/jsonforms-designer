import { Box, Divider, Tooltip, Typography } from '@mui/material';
import { Dispatch } from 'react';
import { createSetSectionColorAction } from '../core/model/addFieldActions';
import { EditorAction } from '../core/model/actions';
import { useEditorContext } from '../core/context';

const SWATCHES = [
  { color: '#C8D8F0', label: 'Blau' },
  { color: '#C8E8C8', label: 'Grün' },
  { color: '#F5E6A0', label: 'Gelb' },
  { color: '#F5C8C8', label: 'Rot' },
  { color: '#DFC8F5', label: 'Lila' },
  { color: '#C8EAE8', label: 'Türkis' },
  { color: '#D8D8D8', label: 'Grau' },
  { color: '#FFFFFF', label: 'Weiß' },
  { color: '#004A99', label: 'Dunkelblau', textColor: '#fff' },
  { color: '#009EE0', label: 'Hellblau', textColor: '#fff' },
];

interface SectionColorPickerProps {
  elementId: string;
  dispatch: Dispatch<EditorAction | any>;
}

export function SectionColorPicker({ elementId, dispatch }: SectionColorPickerProps) {
  const { fieldState } = useEditorContext();
  const current = fieldState.sectionColors[elementId] ?? null;

  const set = (color: string | null) => {
    dispatch(createSetSectionColorAction(elementId, color) as unknown as EditorAction);
  };

  return (
    <Box>
      <Divider sx={{ my: 1 }} />
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mb: 0.75 }}>
        Hintergrundfarbe
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Tooltip title="Keine Farbe">
          <Box
            role="button" tabIndex={0} aria-label="Keine Hintergrundfarbe" aria-pressed={!current}
            onClick={() => set(null)}
            onKeyDown={(e) => e.key === 'Enter' && set(null)}
            sx={{
              width: 26, height: 26, borderRadius: 1, cursor: 'pointer',
              border: '2px solid', borderColor: !current ? 'primary.main' : 'divider',
              background: 'linear-gradient(135deg, #fff 45%, #e00 45%, #e00 55%, #fff 55%)',
              flexShrink: 0,
            }}
          />
        </Tooltip>
        {SWATCHES.map(({ color, label }) => (
          <Tooltip key={color} title={label}>
            <Box
              role="button" tabIndex={0} aria-label={label} aria-pressed={current === color}
              onClick={() => set(color)}
              onKeyDown={(e) => e.key === 'Enter' && set(color)}
              sx={{
                width: 26, height: 26, borderRadius: 1, cursor: 'pointer',
                backgroundColor: color,
                border: '2px solid',
                borderColor: current === color ? 'primary.main' : 'rgba(0,0,0,0.15)',
                boxShadow: current === color ? '0 0 0 1px #004A99' : 'none',
                '&:hover': { transform: 'scale(1.15)', borderColor: 'primary.light' },
                transition: 'transform 0.1s, border-color 0.1s',
                flexShrink: 0,
              }}
            />
          </Tooltip>
        ))}
      </Box>
      {current && (
        <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: 0.5, backgroundColor: current, border: '1px solid rgba(0,0,0,0.2)' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{current}</Typography>
        </Box>
      )}
    </Box>
  );
}
