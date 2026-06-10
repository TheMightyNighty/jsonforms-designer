/**
 * Eigene Sektion in der linken Palette: „OpenCode-Bausteine".
 * Validator-Items sind drag-fähig (werden an Felder im Properties-Panel gehängt).
 * UI-Baustein-Items sind drag-fähig (werden als Custom-Renderer-Referenz ins fieldState eingefügt).
 *
 * DnD-Typ: 'OPENCODE_BAUSTEIN' — getrennt von 'FIELD_TYPE'.
 */
import {
  Box,
  CircularProgress,
  Collapse,
  Divider,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';

import { useI18n } from '../i18n';
import { defaultOpenCodeService } from './mockOpenCodeService';
import { OpenCodeBaustein, OpenCodeService } from './openCodeService';

// ---------------------------------------------------------------------------
// DnD-Typ
// ---------------------------------------------------------------------------

export const OPENCODE_DND_TYPE = 'OPENCODE_BAUSTEIN' as const;

export interface OpenCodeDragItem {
  dndType: typeof OPENCODE_DND_TYPE;
  bausteinId: string;
  kategorie: OpenCodeBaustein['kategorie'];
}

// ---------------------------------------------------------------------------
// Einzelner Baustein
// ---------------------------------------------------------------------------

function OpenCodeItem({ baustein }: { baustein: OpenCodeBaustein }) {
  const [{ isDragging }, dragRef] = useDrag<
    OpenCodeDragItem,
    unknown,
    { isDragging: boolean }
  >(() => ({
    type: OPENCODE_DND_TYPE,
    item: {
      dndType: OPENCODE_DND_TYPE,
      bausteinId: baustein.id,
      kategorie: baustein.kategorie,
    },
    collect: (m) => ({ isDragging: m.isDragging() }),
  }));

  return (
    <Tooltip title={baustein.description} placement="right" enterDelay={600}>
      <Box
        ref={dragRef as unknown as React.Ref<HTMLDivElement>}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          borderRadius: 1,
          cursor: 'grab',
          userSelect: 'none',
          opacity: isDragging ? 0.4 : 1,
          transition: 'background-color 0.15s, opacity 0.15s',
          '&:hover': { backgroundColor: 'action.hover' },
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <Box
          component="i"
          className={`ti ti-${baustein.icon}`}
          sx={{ fontSize: 16, color: 'secondary.main', flexShrink: 0 }}
          aria-hidden
        />
        <Typography
          variant="body2"
          noWrap
          sx={{ color: 'text.primary', fontSize: '0.8rem' }}
        >
          {baustein.displayName}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Sektion
// ---------------------------------------------------------------------------

interface OpenCodePaletteSectionProps {
  service?: OpenCodeService;
}

export function OpenCodePaletteSection({
  service = defaultOpenCodeService,
}: OpenCodePaletteSectionProps) {
  const { t } = useI18n();
  const [bausteine, setBausteine] = useState<OpenCodeBaustein[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    service.getBausteine().then((b) => {
      setBausteine(b);
      setLoading(false);
    });
  }, [service]);

  const validators = bausteine.filter((b) => b.kategorie === 'validator');
  const uiBausteine = bausteine.filter((b) => b.kategorie === 'ui-baustein');

  return (
    <Box>
      <Divider sx={{ my: 1.5 }} />

      {/* Einklappbarer Header */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          cursor: 'pointer',
          userSelect: 'none',
          borderRadius: 1,
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        <Box
          component="i"
          className={`ti ti-chevron-${open ? 'down' : 'right'}`}
          sx={{ fontSize: 12, color: 'text.disabled', flexShrink: 0 }}
        />
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            flex: 1,
          }}
        >
          OpenCode
        </Typography>
        {!loading && (
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', fontSize: '0.68rem' }}
          >
            ({bausteine.length})
          </Typography>
        )}
      </Box>

      <Collapse in={open} timeout={150}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={18} />
          </Box>
        )}

        {!loading && validators.length > 0 && (
          <Box role="group" aria-label="Validatoren">
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                color: 'text.disabled',
                display: 'block',
                mt: 1,
                mb: 0.25,
                fontSize: '0.68rem',
              }}
            >
              {t.palette.validators}
            </Typography>
            {validators.map((b) => (
              <OpenCodeItem key={b.id} baustein={b} />
            ))}
          </Box>
        )}

        {!loading && uiBausteine.length > 0 && (
          <Box role="group" aria-label="UI-Bausteine" sx={{ mt: 1 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                color: 'text.disabled',
                display: 'block',
                mb: 0.25,
                fontSize: '0.68rem',
              }}
            >
              {t.palette.uiBausteine}
            </Typography>
            {uiBausteine.map((b) => (
              <OpenCodeItem key={b.id} baustein={b} />
            ))}
          </Box>
        )}
      </Collapse>
    </Box>
  );
}
