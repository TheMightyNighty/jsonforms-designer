import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import { useDrag } from 'react-dnd';

import { FieldAwareState } from '../../core/model/addFieldReducer';
import { evaluateFieldVisibility } from '../../core/util/evaluateRule';
import { UISchemaRule } from '../../properties/fieldPropertiesActions';
import { RenderedField } from './RenderedField';

// DnD-Typ für interne Reorder-Verschiebung — geteilt mit FieldFormPreview
// und GroupContainerRow, damit ein Feld aus einer Gruppe heraus (und wieder
// hinein) verschoben werden kann.
export const EDITOR_ITEM = 'EDITOR_ITEM' as const;
export interface EditorDragItem {
  key: string;
}

export interface FieldRowProps {
  propertyKey: string;
  scope: string;
  schema: FieldAwareState['schema'];
  uiOptions?: Record<string, unknown>;
  rule?: UISchemaRule;
  isSelected: boolean;
  validators?: string[];
  testMode: boolean;
  testData: Record<string, unknown>;
  onTestDataChange: (data: Record<string, unknown>) => void;
  onSelect: (scope: string) => void;
  onDelete: (scope: string) => void;
  /** Optional — im Kontext einer Gruppe ist Duplizieren (noch) nicht verdrahtet. */
  onDuplicate?: (scope: string) => void;
}

/**
 * Rendert ein Feld im Bau-Modus im echten Formular-Look: im Ruhezustand ist
 * außer dem gerenderten Feld nichts sichtbar. Drag-Handle, Duplizieren- und
 * Löschen-Aktionen liegen absolut positioniert am Rand und erscheinen erst
 * bei Hover oder Selektion (kein Rahmen/keine Kopfzeile, die den
 * Formular-Fluss unterbricht).
 */
export function FieldRow({
  scope,
  schema,
  uiOptions,
  rule,
  isSelected,
  validators = [],
  testMode,
  testData,
  onTestDataChange,
  onSelect,
  onDelete,
  onDuplicate,
}: FieldRowProps) {
  const [{ isDragging }, dragRef, dragPreviewRef] = useDrag<
    EditorDragItem,
    void,
    { isDragging: boolean }
  >(
    () => ({
      type: EDITOR_ITEM,
      item: { key: scope },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [scope],
  );

  const { visible, enabled } = testMode
    ? evaluateFieldVisibility(rule, testData)
    : { visible: true, enabled: true };

  return (
    <Box
      ref={dragPreviewRef as unknown as React.Ref<HTMLDivElement>}
      data-testid="field-row"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(scope)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(scope)}
      sx={{
        position: 'relative',
        px: 0.5,
        py: 0.5,
        borderRadius: 1,
        cursor: 'pointer',
        opacity: isDragging ? 0.3 : !visible ? 0.4 : 1,
        outline: isSelected ? '2px solid' : '1px dashed transparent',
        outlineColor: isSelected ? 'primary.main' : 'action.hover',
        outlineOffset: 2,
        transition: 'outline-color 0.15s, background-color 0.15s',
        '&:hover': {
          outlineColor: isSelected ? 'primary.main' : 'action.disabled',
        },
        '&:hover .row-actions': { opacity: 1 },
        '&:hover .row-handle': { opacity: 1 },
      }}
    >
      <Box
        ref={dragRef as unknown as React.Ref<HTMLDivElement>}
        className="row-handle"
        sx={{
          position: 'absolute',
          left: -22,
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'grab',
          color: 'text.disabled',
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.15s',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragHandleIcon sx={{ fontSize: 16 }} />
      </Box>

      {!visible && (
        <Chip
          label="ausgeblendet"
          size="small"
          sx={{
            position: 'absolute',
            top: 2,
            left: 2,
            fontSize: '0.6rem',
            height: 16,
            borderRadius: '3px',
            zIndex: 1,
          }}
        />
      )}

      <Box
        className="row-actions"
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.15s',
          backgroundColor: 'background.paper',
          borderRadius: 1,
          zIndex: 1,
        }}
      >
        {validators.length > 0 && (
          <Tooltip title={`Validatoren: ${validators.join(', ')}`}>
            <Box
              component="i"
              className="ti ti-shield-check"
              sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }}
            />
          </Tooltip>
        )}
        {onDuplicate && (
          <Tooltip title="Duplizieren">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(scope);
              }}
              sx={{ p: 0.25, opacity: 0.5, '&:hover': { opacity: 1 } }}
            >
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Entfernen">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(scope);
            }}
            sx={{ p: 0.25, opacity: 0.5, '&:hover': { opacity: 1 } }}
          >
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Box>

      <RenderedField
        scope={scope}
        schema={schema}
        uiOptions={uiOptions}
        testMode={testMode}
        data={testData}
        onDataChange={onTestDataChange}
        disabled={!enabled}
      />
    </Box>
  );
}
