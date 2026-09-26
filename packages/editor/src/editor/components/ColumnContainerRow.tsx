import { JsonSchema7 } from '@jsonforms/core';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
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
import { flexBasisFor } from '../../preview-variants/shared/layoutWidth';
import { RenderedField } from './RenderedField';

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
  testMode: boolean;
  data: Record<string, unknown>;
  onDataChange: (data: Record<string, unknown>) => void;
}

function ColumnItem({
  el,
  containerId,
  columnIndex,
  schema,
  isSelected,
  onSelect,
  dispatch,
  testMode,
  data,
  onDataChange,
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
    el.type === 'Label'
      ? (el as LabelElement).label
      : el.type === 'ColumnContainer'
        ? `↳ ${(el as ColumnContainer).widths.join(':')} Spalten`
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
          testMode={testMode}
          data={data}
          onDataChange={onDataChange}
        />
      </Box>
    );
  }

  // Aus-Spalte-herauslösen und Entfernen-Aktionen (für beide Untervarianten gleich)
  const actionButtons = (
    <>
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
    </>
  );

  if (el.type === 'Control') {
    const scope = (el as ControlElement).scope;
    const wrapperSchema = { type: 'object' as const, properties: schema };
    return (
      <Box
        ref={previewRef as unknown as React.Ref<HTMLDivElement>}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(scope);
        }}
        sx={{
          position: 'relative',
          px: 0.5,
          py: 0.25,
          borderRadius: 1,
          cursor: 'pointer',
          opacity: isDragging ? 0.3 : 1,
          outline: isSelected ? '2px solid' : '1px dashed transparent',
          outlineColor: isSelected ? 'primary.main' : 'action.hover',
          outlineOffset: 2,
          transition: 'outline-color 0.15s',
          '&:hover': {
            outlineColor: isSelected ? 'primary.main' : 'action.disabled',
          },
          '&:hover .colitem-actions': { opacity: 1 },
          '&:hover .colitem-handle': { opacity: 1 },
        }}
      >
        <Box
          ref={dragRef as unknown as React.Ref<HTMLDivElement>}
          className="colitem-handle"
          sx={{
            position: 'absolute',
            left: -18,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'grab',
            color: 'text.disabled',
            opacity: isSelected ? 1 : 0,
            transition: 'opacity 0.15s',
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <DragHandleIcon sx={{ fontSize: 14 }} />
        </Box>
        <Box
          className="colitem-actions"
          sx={{
            position: 'absolute',
            top: 2,
            right: 2,
            display: 'flex',
            opacity: isSelected ? 1 : 0,
            transition: 'opacity 0.15s',
            backgroundColor: 'background.paper',
            borderRadius: 1,
            zIndex: 1,
          }}
        >
          {actionButtons}
        </Box>
        <RenderedField
          scope={scope}
          schema={wrapperSchema}
          uiOptions={(el as ControlElement).options}
          testMode={testMode}
          data={data}
          onDataChange={onDataChange}
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
        onSelect(el.id);
      }}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.5,
        py: 0.25,
        mb: 0.25,
        borderRadius: 1,
        cursor: 'pointer',
        opacity: isDragging ? 0.3 : 1,
        outline: isSelected ? '2px solid' : '1px dashed transparent',
        outlineColor: isSelected ? 'primary.main' : 'action.hover',
        outlineOffset: 2,
        transition: 'outline-color 0.15s',
        '&:hover': {
          outlineColor: isSelected ? 'primary.main' : 'action.disabled',
        },
        '&:hover .colitem-actions': { opacity: 1 },
        '&:hover .colitem-handle': { opacity: 1 },
      }}
    >
      <Box
        ref={dragRef as unknown as React.Ref<HTMLDivElement>}
        className="colitem-handle"
        sx={{
          cursor: 'grab',
          color: 'text.disabled',
          flexShrink: 0,
          lineHeight: 0,
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.15s',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragHandleIcon sx={{ fontSize: 14 }} />
      </Box>
      <Typography
        variant="body2"
        sx={{ flex: 1, fontStyle: 'italic', color: 'text.secondary' }}
        noWrap
      >
        {label}
      </Typography>
      <Box
        className="colitem-actions"
        sx={{
          display: 'flex',
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
      >
        {actionButtons}
      </Box>
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
  testMode: boolean;
  data: Record<string, unknown>;
  onDataChange: (data: Record<string, unknown>) => void;
}

export function ColumnContainerRow({
  container,
  schema,
  selectedId,
  onSelect,
  dispatch,
  dragHandleRef,
  testMode,
  data,
  onDataChange,
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
  const isSelected = selectedId === container.id;

  // container.widths sind Verhältnis-Zahlen (z. B. [1,2] = 1:2-Split), keine
  // ofm:width-Rasterwerte (1–12) — auf die 12er-Skala normalisiert, damit
  // sich die geteilte flexBasisFor-Mathematik (Options-Registry, Kapitel 4)
  // konsistent für beide Fälle verwenden lässt.
  const totalWidth = container.widths.reduce((sum, w) => sum + w, 0) || 1;
  const scaledWidths = container.widths.map((w) =>
    Math.max(1, Math.round((w / totalWidth) * 12)),
  );

  return (
    <Box
      ref={ownPreviewRef as unknown as React.Ref<HTMLDivElement>}
      sx={{
        position: 'relative',
        borderRadius: 1,
        p: 0.5,
        backgroundColor: bgColor ?? 'transparent',
        outline: isSelected ? '2px solid' : '1px dashed transparent',
        outlineColor: isSelected ? 'primary.main' : 'action.hover',
        outlineOffset: 2,
        opacity: isDragging ? 0.3 : 1,
        transition: 'outline-color 0.15s, opacity 0.15s',
        '&:hover': {
          outlineColor: isSelected ? 'primary.main' : 'action.disabled',
        },
        '&:hover .col-actions': { opacity: 1 },
        '&:hover .col-handle': { opacity: 1 },
      }}
    >
      <Box
        ref={activeHandleRef as unknown as React.Ref<HTMLDivElement>}
        className="col-handle"
        role="button"
        tabIndex={0}
        onClick={() => onSelect(container.id)}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(container.id)}
        aria-label={`Layout-Container ${container.widths.join(':')} auswählen`}
        sx={{
          position: 'absolute',
          left: -22,
          top: 4,
          cursor: 'grab',
          color: 'text.disabled',
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.15s',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragHandleIcon sx={{ fontSize: 16 }} />
      </Box>

      <Box
        className="col-actions"
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.15s',
          zIndex: 1,
        }}
      >
        <Tooltip title="Container entfernen">
          <IconButton
            size="small"
            onClick={() => dispatch(createRemoveFieldAction(container.id))}
            sx={{ p: 0.25, opacity: 0.5, '&:hover': { opacity: 1 } }}
          >
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Spalten im echten Seitenverhältnis */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {container.columns.map((col, ci) => (
          <Box
            key={ci}
            sx={{
              flexBasis: flexBasisFor(
                scaledWidths[ci],
                container.columns.length,
              ),
              flexGrow: 0,
              minWidth: 0,
              borderRadius: 1,
              minHeight: 32,
              ...(col.length === 0
                ? {
                    border: '1px dashed',
                    borderColor: 'divider',
                    p: 0.5,
                  }
                : {}),
            }}
          >
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
                  testMode={testMode}
                  data={data}
                  onDataChange={onDataChange}
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
