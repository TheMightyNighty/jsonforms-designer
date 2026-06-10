import { Box, Collapse, Divider, Typography } from '@mui/material';
import { useState } from 'react';

import { useEditorConfig } from '../config/EditorConfigContext';
import {
  FIELD_GROUPS,
  FieldGroup,
  getFieldTypesByGroup,
} from '../field-types/fieldTypes';
import { FimPaletteSection } from '../fim/FimPaletteSection';
import { useI18n } from '../i18n';
import { OpenCodePaletteSection } from '../opencode/OpenCodePaletteSection';
import { FieldPaletteItem } from './FieldPaletteItem';

// ---------------------------------------------------------------------------
// Einklappbare Feldtyp-Gruppe
// ---------------------------------------------------------------------------

interface CollapsibleGroupProps {
  groupId: FieldGroup;
  defaultOpen: boolean;
}

function CollapsibleFieldGroup({
  groupId,
  defaultOpen,
}: CollapsibleGroupProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);
  const label =
    t.palette.groups[groupId as keyof typeof t.palette.groups] ?? groupId;
  const items = getFieldTypesByGroup(groupId);

  return (
    <Box>
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
            flex: 1,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', fontSize: '0.68rem' }}
        >
          ({items.length})
        </Typography>
      </Box>

      <Collapse in={open} timeout={150}>
        <Box role="group" aria-label={label}>
          {items.map((ft) => (
            <Box key={ft.id} role="listitem">
              <FieldPaletteItem fieldType={ft} />
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Palette Panel
// ---------------------------------------------------------------------------

export function FieldPalettePanel() {
  const config = useEditorConfig();
  const collapsedByDefault = config.palette?.collapsedByDefault ?? [];

  return (
    <Box
      sx={{ height: '100%', overflowY: 'auto', pb: 2 }}
      role="list"
      aria-label="Feldtypen-Palette"
    >
      {FIELD_GROUPS.map(({ id }, idx) => (
        <Box key={id} role="listitem">
          {idx > 0 && <Divider sx={{ my: 0.5 }} />}
          <CollapsibleFieldGroup
            groupId={id}
            defaultOpen={!collapsedByDefault.includes(id)}
          />
        </Box>
      ))}

      {config.modules?.openCode?.enabled && (
        <OpenCodePaletteSection service={config.modules.openCode.service} />
      )}

      {config.modules?.fim?.enabled && (
        <FimPaletteSection service={config.modules.fim.service} />
      )}
    </Box>
  );
}
