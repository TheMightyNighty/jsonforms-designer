import { useI18n } from '../i18n';
import { Box, Divider, Typography } from '@mui/material';
import {
  FIELD_GROUPS,
  FieldGroup,
  getFieldTypesByGroup,
} from '../field-types/fieldTypes';
import { FieldPaletteItem } from './FieldPaletteItem';
import { OpenCodePaletteSection } from '../opencode/OpenCodePaletteSection';

function GroupHeader({ label, first = false }: { label: string; first?: boolean }) {
  return (
    <Box sx={{ mt: first ? 1 : 2, mb: 0.5 }}>
      {!first && <Divider sx={{ mb: 1.5 }} />}
      <Typography
        variant="caption"
        sx={{
          px: 1.5, color: 'text.disabled', fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function FieldPaletteGroup({ groupId, label: _label, first }: { groupId: FieldGroup; label: string; first?: boolean }) {
  const { t } = useI18n();
  const label = t.palette.groups[groupId as keyof typeof t.palette.groups] ?? _label;
  const items = getFieldTypesByGroup(groupId);
  return (
    <Box role="group" aria-label={label}>
      <GroupHeader label={label} first={first} />
      {items.map((ft) => (
        <Box key={ft.id} role="listitem">
          <FieldPaletteItem fieldType={ft} />
        </Box>
      ))}
    </Box>
  );
}

export function FieldPalettePanel() {
  return (
    <Box sx={{ height: '100%', overflowY: 'auto', pb: 2 }} role="list" aria-label="Feldtypen-Palette">
      {FIELD_GROUPS.map(({ id, label }, idx) => (
        <FieldPaletteGroup key={id} groupId={id} label={label} first={idx === 0} />
      ))}
      <OpenCodePaletteSection />
    </Box>
  );
}
