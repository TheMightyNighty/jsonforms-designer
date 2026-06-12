import { JsonSchema7 } from '@jsonforms/core';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { Dispatch } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { useEditorContext } from '../../core/context';
import { EditorAction } from '../../core/model/actions';
import {
  createMoveElementAction,
  createRemoveFieldAction,
  createReorderInColumnAction,
} from '../../core/model/addFieldActions';
import {
  ColumnContainer,
  ControlElement,
  LabelElement,
  UiElement,
} from '../../core/model/uiElements';
import { useI18n } from '../../i18n';
import { useColumnDrop } from '../../palette-panel/useColumnDrop';

// DnD-Typ für externe Reorder (aus der flachen Liste)
export const EDITOR_ITEM = 'EDITOR_ITEM' as const;
// DnD-Typ für interne Spalten-Reorder
const COLUMN_ITEM = 'COLUMN_ITEM' as const;
interface ColumnDragItem {
  elementId: string;
  containerId: string;
  columnIndex: number;
}

// ---------------------------------------------------------------------------
// Drop-Zone in einer Spalte: Palette + Reorder
// ---------------------------------------------------------------------------
interface ColDropZoneProps {
  containerId: string;
  columnIndex: number;
  insertAfterId?: string;
  dispatch: Dispatch<EditorAction>;
}
function ColDropZone({
  containerId,
  columnIndex,
  insertAfterId,
  dispatch,
}: ColDropZoneProps) {
  // Palette-Drop
  const [{ isOver: isOverPalette }, paletteRef] = useColumnDrop(dispatch, {
    containerId,
    columnIndex,
    insertAfterId,
  });

  // Interne Reorder-Drop
  const [{ isOver: isOverReorder }, reorderRef] = useDrop<
    ColumnDragItem,
    void,
    { isOver: boolean }
  >(
    () => ({
      accept: COLUMN_ITEM,
      drop: (item) => {
        if (
          item.containerId === containerId &&
          item.columnIndex === columnIndex
        ) {
          dispatch(
            createReorderInColumnAction(
              containerId,
              columnIndex,
              item.elementId,
              insertAfterId,
            ),
          );
        }
      },
      collect: (m) => ({ isOver: m.isOver() }),
    }),
    [containerId, columnIndex, insertAfterId, dispatch],
  );

  const isOver = isOverPalette || isOverReorder;

  const setRef = (el: HTMLDivElement | null) => {
    (paletteRef as unknown as React.RefCallback<HTMLDivElement>)(el);
    (reorderRef as unknown as React.RefCallback<HTMLDivElement>)(el);
  };

  return (
    <Box
      ref={setRef}
      sx={{
        minHeight: isOver ? 28 : 6,
        borderRadius: 1,
        border: '1px dashed',
        borderColor: isOver ? 'primary.main' : 'transparent',
        backgroundColor: isOver ? 'action.selected' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'min-height 0.15s',
        my: 0.25,
      }}
    >
      {isOver && (
        <Typography
          variant="caption"
          color="primary.main"
          sx={{ fontSize: '0.65rem' }}
        >
          ablegen
        </Typography>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Einzelnes Element in einer Spalte (mit Drag-Handle)
// ---------------------------------------------------------------------------
interface ColumnItemProps {
  el: UiElement;
  containerId: string;
  columnIndex: number;
  schema: Record<string, JsonSchema7>;
  isSelected: boolean;
  onSelect: (id: string) => void;
  dispatch: Dispatch<EditorAction>;
}

function ColumnItem({
  el,
  containerId,
  columnIndex,
  schema,
  isSelected,
  onSelect,
  dispatch,
}: ColumnItemProps) {
  const [{ isDragging }, dragRef, previewRef] = useDrag<
    ColumnDragItem,
    void,
    { isDragging: boolean }
  >(
    () => ({
      type: COLUMN_ITEM,
      item: { elementId: el.id, containerId, columnIndex },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [el.id, containerId, columnIndex],
  );

  const label =
    el.type === 'Control'
      ? (schema[(el as ControlElement).scope.replace(/^#\/properties\//, '')]
          ?.title ??
        (el as ControlElement).scope.replace(/^#\/properties\//, ''))
      : el.type === 'Label'
        ? (el as LabelElement).label
        : el.type === 'ColumnContainer'
          ? `↳ ${(el as ColumnContainer).widths.join(':')} Spalten`
          : el.type;

  const badge =
    el.type === 'Control'
      ? (schema[(el as ControlElement).scope.replace(/^#\/properties\//, '')]
          ?.type ?? 'Feld')
      : el.type;

  // Verschachtelter ColumnContainer
  if (el.type === 'ColumnContainer') {
    return (
      <Box
        ref={previewRef as unknown as React.Ref<HTMLDivElement>}
        sx={{ opacity: isDragging ? 0.3 : 1, mb: 0.5 }}
      >
        <ColumnContainerRow
          container={el as ColumnContainer}
          schema={schema}
          selectedId={isSelected ? el.id : null}
          onSelect={onSelect}
          dispatch={dispatch}
          dragHandleRef={dragRef as unknown as React.Ref<HTMLDivElement>}
        />
      </Box>
    );
  }

  return (
    <Box
      ref={previewRef as unknown as React.Ref<HTMLDivElement>}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(el.type === 'Control' ? (el as ControlElement).scope : el.id);
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.75,
        py: 0.5,
        mb: 0.5,
        borderRadius: 1,
        cursor: 'pointer',
        opacity: isDragging ? 0.3 : 1,
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        backgroundColor: isSelected ? 'action.selected' : 'background.paper',
        '&:hover': {
          borderColor: 'primary.light',
          backgroundColor: 'action.hover',
        },
      }}
    >
      <Box
        ref={dragRef as unknown as React.Ref<HTMLDivElement>}
        sx={{
          cursor: 'grab',
          color: 'text.disabled',
          flexShrink: 0,
          lineHeight: 0,
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragHandleIcon sx={{ fontSize: 14 }} />
      </Box>
      <Typography
        variant="caption"
        sx={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}
        noWrap
      >
        {label}
      </Typography>
      <Chip
        label={badge}
        size="small"
        variant="outlined"
        sx={{ fontSize: '0.6rem', height: 16, borderRadius: '3px' }}
      />
      <Tooltip title="Aus Spalte herauslösen">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            dispatch(
              createMoveElementAction({
                elementId: el.id,
                targetContainerId: 'root',
              }),
            );
          }}
          sx={{ p: 0.1, opacity: 0.4, '&:hover': { opacity: 1 } }}
        >
          <span style={{ fontSize: 11, lineHeight: 1 }}>↑</span>
        </IconButton>
      </Tooltip>
      <Tooltip title="Entfernen">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            dispatch(createRemoveFieldAction(el.id));
          }}
          sx={{ p: 0.1, opacity: 0.5, '&:hover': { opacity: 1 } }}
        >
          <DeleteIcon sx={{ fontSize: 12 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// ColumnContainerRow Haupt-Komponente
// ---------------------------------------------------------------------------
interface ColumnContainerRowProps {
  container: ColumnContainer;
  schema: Record<string, JsonSchema7>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  dispatch: Dispatch<EditorAction>;
  /** Externer dragRef wenn dieser Container selbst ziehbar ist (Verschachtelung) */
  dragHandleRef?: React.Ref<HTMLDivElement>;
}

export function ColumnContainerRow({
  container,
  schema,
  selectedId,
  onSelect,
  dispatch,
  dragHandleRef,
}: ColumnContainerRowProps) {
  // Eigener Drag-Handle wenn kein externer übergeben
  const [{ isDragging }, ownDragRef, ownPreviewRef] = useDrag<
    { key: string },
    void,
    { isDragging: boolean }
  >(
    () => ({
      type: EDITOR_ITEM,
      item: { key: container.id },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [container.id],
  );

  const activeHandleRef = dragHandleRef ?? ownDragRef;
  const { fieldState } = useEditorContext();
  const bgColor = fieldState.sectionColors[container.id] ?? undefined;
  const { t } = useI18n();

  return (
    <Box
      ref={ownPreviewRef as unknown as React.Ref<HTMLDivElement>}
      sx={{
        border: '1px solid',
        borderColor: selectedId === container.id ? 'primary.main' : 'divider',
        borderRadius: 1,
        p: 0.75,
        backgroundColor: bgColor ?? 'action.hover',
        opacity: isDragging ? 0.3 : 1,
        transition: 'border-color 0.15s, opacity 0.15s',
      }}
    >
      {/* Header mit Drag-Handle bündig */}
      <Box
        role="button"
        tabIndex={0}
        onClick={() => onSelect(container.id)}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(container.id)}
        aria-label={`Layout-Container ${container.widths.join(':')} auswählen`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          mb: 0.75,
          cursor: 'pointer',
        }}
      >
        <Box
          ref={activeHandleRef as unknown as React.Ref<HTMLDivElement>}
          sx={{
            cursor: 'grab',
            color: 'text.disabled',
            flexShrink: 0,
            lineHeight: 0,
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <DragHandleIcon sx={{ fontSize: 16 }} />
        </Box>
        <Box
          component="i"
          className="ti ti-layout-columns"
          sx={{ fontSize: 13, color: 'primary.main' }}
        />
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: 'primary.main', flex: 1 }}
        >
          {container.columns.length} Spalten ({container.widths.join(':')})
        </Typography>
        <Chip
          label="Layout"
          size="small"
          sx={{ height: 16, fontSize: '0.6rem' }}
        />
        <Tooltip title="Container entfernen">
          <IconButton
            size="small"
            onClick={() => dispatch(createRemoveFieldAction(container.id))}
            sx={{ p: 0.1, opacity: 0.5, '&:hover': { opacity: 1 } }}
          >
            <DeleteIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Spalten */}
      <Box sx={{ display: 'flex', gap: 0.75 }}>
        {container.columns.map((col, ci) => (
          <Box
            key={ci}
            sx={{
              flex: container.widths[ci] ?? 1,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 0.5,
              minHeight: 44,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'text.disabled',
                fontSize: '0.6rem',
                display: 'block',
                mb: 0.25,
              }}
            >
              Spalte {ci + 1}
            </Typography>
            <ColDropZone
              containerId={container.id}
              columnIndex={ci}
              dispatch={dispatch}
            />
            {col.map((item: UiElement) => (
              <span key={item.id}>
                <ColumnItem
                  el={item}
                  containerId={container.id}
                  columnIndex={ci}
                  schema={schema}
                  isSelected={selectedId === item.id}
                  onSelect={onSelect}
                  dispatch={dispatch}
                />
                <ColDropZone
                  containerId={container.id}
                  columnIndex={ci}
                  insertAfterId={item.id}
                  dispatch={dispatch}
                />
              </span>
            ))}
            {col.length === 0 && (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{
                  fontSize: '0.65rem',
                  display: 'block',
                  textAlign: 'center',
                  pt: 0.25,
                }}
              >
                {t.editor.feldHierher}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
