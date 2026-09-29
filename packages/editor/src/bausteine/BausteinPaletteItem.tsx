import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { useDrag } from 'react-dnd';

import { useDispatch, useFieldState } from '../core/context';
import {
  BAUSTEIN_DND_TYPE,
  BausteinDragItem,
  createBausteinAction,
} from './bausteinAktion';
import { Baustein } from './bausteinService';

interface BausteinPaletteItemProps {
  baustein: Baustein;
}

/**
 * Kachel eines Bausteins in der Palette. Zeigt Name, Zweck und die
 * enthaltenen Felder, damit vor dem Einfügen erkennbar ist, was kommt.
 * Nicht abgestimmte Bausteine sind sichtbar als Beispiel gekennzeichnet.
 */
export function BausteinPaletteItem({ baustein }: BausteinPaletteItemProps) {
  const dispatch = useDispatch();
  const fieldState = useFieldState();

  const [{ isDragging }, dragRef] = useDrag<
    BausteinDragItem,
    unknown,
    { isDragging: boolean }
  >(
    () => ({
      type: BAUSTEIN_DND_TYPE,
      item: { dndType: BAUSTEIN_DND_TYPE, baustein },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [baustein],
  );

  // Tastatur-Alternativpfad zum Drag & Drop (BITV) — gleiche Action wie der
  // Drop-Pfad, damit beide Wege dasselbe Ergebnis liefern.
  const perTastatur = () => {
    const tabIndex =
      fieldState.tabs.length > 0 ? fieldState.activeTabIndex : undefined;
    dispatch(createBausteinAction(baustein, undefined, tabIndex));
  };

  const felderListe = baustein.felder.map((f) => f.label).join(', ');

  return (
    <Tooltip
      title={`${baustein.beschreibung} — Enter fügt den Baustein am Ende ein`}
      placement="right"
      enterDelay={600}
    >
      <Box
        ref={dragRef as unknown as React.Ref<HTMLDivElement>}
        data-testid={`palette-baustein-${baustein.id}`}
        role="button"
        tabIndex={0}
        aria-label={`${baustein.name} hinzufügen`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            perTastatur();
          }
        }}
        sx={{
          mx: 1,
          mb: 0.75,
          px: 1.25,
          py: 1,
          border: '1px solid',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 1.5,
          cursor: 'grab',
          userSelect: 'none',
          opacity: isDragging ? 0.45 : 1,
          transition: 'border-color 0.15s, background-color 0.15s',
          '&:hover': {
            borderColor: 'primary.light',
            backgroundColor: 'action.hover',
          },
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            component="i"
            className={`ti ti-${baustein.icon}`}
            sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }}
            aria-hidden="true"
          />
          <Typography
            variant="body2"
            noWrap
            sx={{ fontWeight: 600, fontSize: '0.82rem', flex: 1, minWidth: 0 }}
          >
            {baustein.name}
          </Typography>
          {baustein.istBeispiel && (
            <Chip
              label="Beispiel"
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: '0.6rem' }}
            />
          )}
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            pl: 2.75,
            color: 'text.secondary',
            fontSize: '0.7rem',
            lineHeight: 1.3,
          }}
        >
          {felderListe}
        </Typography>
      </Box>
    </Tooltip>
  );
}
