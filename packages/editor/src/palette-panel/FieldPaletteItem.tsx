import { Box, Tooltip, Typography } from '@mui/material';
import { useDrag } from 'react-dnd';

import { useEditorConfig } from '../config/EditorConfigContext';
import { useDispatch, useFieldState } from '../core/context';
import { fuelleVorlage } from '../core/util/textVorlage';
import { feldtypTexte } from '../field-types/feldtypTexte';
import { FieldTypeDefinition } from '../field-types/fieldTypes';
import { useI18n } from '../i18n';
import { createPaletteFieldAction } from './useFieldDrop';

// ---------------------------------------------------------------------------
// DnD-Konstante — exportiert damit der Drop-Handler (Editor) sie importieren kann
// ---------------------------------------------------------------------------

export const FIELD_TYPE_DND_TYPE = 'FIELD_TYPE' as const;

export interface FieldTypeDragItem {
  dndType: typeof FIELD_TYPE_DND_TYPE;
  fieldTypeId: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FieldPaletteItemProps {
  fieldType: FieldTypeDefinition;
}

// ---------------------------------------------------------------------------
// Komponente
// ---------------------------------------------------------------------------

export function FieldPaletteItem({ fieldType }: FieldPaletteItemProps) {
  const dispatch = useDispatch();
  const fieldState = useFieldState();
  const { t } = useI18n();
  const { region } = useEditorConfig();
  const texte = feldtypTexte(t, fieldType.id);

  const [{ isDragging }, dragRef] = useDrag<
    FieldTypeDragItem,
    unknown,
    { isDragging: boolean }
  >(() => ({
    type: FIELD_TYPE_DND_TYPE,
    item: {
      dndType: FIELD_TYPE_DND_TYPE,
      fieldTypeId: fieldType.id,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Tastatur-Alternativpfad zum Drag & Drop (BITV): Enter/Leertaste fügt den
  // Feldtyp ans Formularende an — im aktiven Tab, falls Tabs existieren.
  const addViaKeyboard = () => {
    const tabIndex =
      fieldState.tabs.length > 0 ? fieldState.activeTabIndex : undefined;
    dispatch(
      createPaletteFieldAction(
        fieldType.id,
        texte.label,
        undefined,
        tabIndex,
        region,
      ),
    );
  };

  return (
    <Tooltip
      title={fuelleVorlage(t.palette.feldTooltip, { name: texte.name })}
      placement="right"
      enterDelay={600}
    >
      <Box
        ref={dragRef as unknown as React.Ref<HTMLDivElement>}
        data-testid={`palette-item-${fieldType.id}`}
        role="button"
        tabIndex={0}
        aria-label={fuelleVorlage(t.palette.feldHinzufuegen, {
          name: texte.name,
        })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            addViaKeyboard();
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          borderRadius: 1,
          cursor: 'grab',
          userSelect: 'none',
          opacity: isDragging ? 0.4 : 1,
          transition: 'background-color 0.15s, opacity 0.15s',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      >
        {/* Icon via Tabler (CSS-Klassen, kein Import nötig) */}
        <Box
          component="i"
          className={`ti ti-${fieldType.icon}`}
          sx={{
            fontSize: 18,
            color: 'text.secondary',
            flexShrink: 0,
            lineHeight: 1,
          }}
          aria-hidden="true"
        />
        <Typography
          variant="body2"
          sx={{
            color: 'text.primary',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {texte.name}
        </Typography>
      </Box>
    </Tooltip>
  );
}
