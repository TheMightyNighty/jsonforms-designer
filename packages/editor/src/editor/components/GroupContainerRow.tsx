import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Dispatch } from 'react';
import { useDrag } from 'react-dnd';

import { useEditorContext } from '../../core/context';
import { EditorAction } from '../../core/model/actions';
import { createRemoveFieldAction } from '../../core/model/addFieldActions';
import { FieldAwareState } from '../../core/model/addFieldReducer';
import { sectionColorDisplay } from '../../core/model/sectionColorTokens';
import { GroupContainer, UiElement } from '../../core/model/uiElements';
import { useI18n } from '../../i18n';
import { useColumnDrop } from '../../palette-panel/useColumnDrop';
import { UISchemaRule } from '../../properties/fieldPropertiesActions';
import { ColumnContainerRow } from './ColumnContainerRow';
import { EDITOR_ITEM, EditorDragItem, FieldRow } from './FieldRow';
import { StructuralElementRow } from './StructuralElementRow';

// ---------------------------------------------------------------------------
// Drop-Zone am Ende der Gruppen-Kinderliste (Palette + Reorder)
// ---------------------------------------------------------------------------
interface GroupDropZoneProps {
  containerId: string;
  insertAfterId?: string;
  dispatch: Dispatch<EditorAction>;
}
function GroupDropZone({
  containerId,
  insertAfterId,
  dispatch,
}: GroupDropZoneProps) {
  // columnIndex wird vom Group-Zweig des Reducers ignoriert — eine Gruppe
  // hat nur eine flache Kinderliste, kein Spaltenraster.
  const [{ isOver }, dropRef] = useColumnDrop(dispatch, {
    containerId,
    columnIndex: 0,
    insertAfterId,
  });

  return (
    <Box
      ref={dropRef as unknown as React.Ref<HTMLDivElement>}
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
// GroupContainerRow Haupt-Komponente
// ---------------------------------------------------------------------------
export interface GroupContainerRowProps {
  container: GroupContainer;
  schema: FieldAwareState['schema'];
  selectedId: string | null;
  onSelect: (id: string) => void;
  dispatch: Dispatch<EditorAction>;
  /** Externer dragRef wenn dieser Container selbst ziehbar ist (Verschachtelung) */
  dragHandleRef?: React.Ref<HTMLDivElement>;
  testMode: boolean;
  data: Record<string, unknown>;
  onDataChange: (data: Record<string, unknown>) => void;
}

/**
 * Rendert einen GroupContainer mitsamt seinen Kindern im echten
 * Formular-Look — ein Abschnitt mit Überschrift und Hintergrundfarbe, wie
 * ihn der Bürger im fertigen Formular sieht. Editor-Chrome (Drag-Handle für
 * die Gruppe, Löschen-Button) erscheint nur bei Hover/Selektion.
 */
export function GroupContainerRow({
  container,
  schema,
  selectedId,
  onSelect,
  dispatch,
  dragHandleRef,
  testMode,
  data,
  onDataChange,
}: GroupContainerRowProps) {
  const [{ isDragging }, ownDragRef, ownPreviewRef] = useDrag<
    EditorDragItem,
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
  const { t } = useI18n();
  const storedColor = fieldState.sectionColors[container.id];
  const bgColor = storedColor ? sectionColorDisplay(storedColor) : undefined;
  const isSelected = selectedId === container.id;

  return (
    <Box
      ref={ownPreviewRef as unknown as React.Ref<HTMLDivElement>}
      sx={{
        position: 'relative',
        borderRadius: 1,
        p: 2,
        mb: 1,
        backgroundColor: bgColor ?? 'transparent',
        outline: isSelected ? '2px solid' : '1px dashed transparent',
        outlineColor: isSelected ? 'primary.main' : 'action.hover',
        outlineOffset: 2,
        opacity: isDragging ? 0.3 : 1,
        transition: 'outline-color 0.15s, opacity 0.15s',
        '&:hover': {
          outlineColor: isSelected ? 'primary.main' : 'action.disabled',
        },
        '&:hover .group-actions': { opacity: 1 },
        '&:hover .group-handle': { opacity: 1 },
      }}
    >
      <Box
        ref={activeHandleRef as unknown as React.Ref<HTMLDivElement>}
        className="group-handle"
        sx={{
          position: 'absolute',
          left: -22,
          top: 8,
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
        className="group-actions"
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.15s',
          zIndex: 1,
        }}
      >
        <Tooltip title="Gruppe entfernen">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              dispatch(createRemoveFieldAction(container.id));
            }}
            sx={{ p: 0.25, opacity: 0.5, '&:hover': { opacity: 1 } }}
          >
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Box>

      {container.label && (
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, mb: 1.5, cursor: 'pointer' }}
          onClick={() => onSelect(container.id)}
        >
          {container.label}
        </Typography>
      )}

      {container.children.map((child) => (
        <GroupChild
          key={child.id}
          child={child}
          containerId={container.id}
          schema={schema}
          selectedId={selectedId}
          onSelect={onSelect}
          dispatch={dispatch}
          testMode={testMode}
          data={data}
          onDataChange={onDataChange}
        />
      ))}

      {container.children.length === 0 && (
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block', textAlign: 'center', py: 1 }}
        >
          {t.editor.feldHierher}
        </Typography>
      )}

      <GroupDropZone
        containerId={container.id}
        insertAfterId={container.children.at(-1)?.id}
        dispatch={dispatch}
      />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Ein Kind der Gruppe (Control, verschachtelter Container, Label)
// ---------------------------------------------------------------------------
interface GroupChildProps {
  child: UiElement;
  containerId: string;
  schema: FieldAwareState['schema'];
  selectedId: string | null;
  onSelect: (id: string) => void;
  dispatch: Dispatch<EditorAction>;
  testMode: boolean;
  data: Record<string, unknown>;
  onDataChange: (data: Record<string, unknown>) => void;
}
function GroupChild({
  child,
  containerId: _containerId,
  schema,
  selectedId,
  onSelect,
  dispatch,
  testMode,
  data,
  onDataChange,
}: GroupChildProps) {
  const handleDelete = (id: string) => dispatch(createRemoveFieldAction(id));

  if (child.type === 'Control') {
    const scope = child.scope;
    const key = scope.replace(/^#\/properties\//, '');
    const fieldSchema = schema.properties?.[key] as
      | { 'x-opencode-validators'?: string[] }
      | undefined;
    return (
      <FieldRow
        propertyKey={key}
        scope={scope}
        schema={schema}
        uiOptions={child.options}
        rule={child.rule as UISchemaRule | undefined}
        validators={fieldSchema?.['x-opencode-validators'] ?? []}
        isSelected={selectedId === scope}
        testMode={testMode}
        testData={data}
        onTestDataChange={onDataChange}
        onSelect={onSelect}
        onDelete={handleDelete}
      />
    );
  }

  if (child.type === 'ColumnContainer') {
    return (
      <ColumnContainerRow
        container={child}
        schema={schema.properties ?? {}}
        selectedId={selectedId}
        onSelect={onSelect}
        dispatch={dispatch}
        testMode={testMode}
        data={data}
        onDataChange={onDataChange}
      />
    );
  }

  if (child.type === 'GroupContainer') {
    return (
      <GroupContainerRow
        container={child}
        schema={schema}
        selectedId={selectedId}
        onSelect={onSelect}
        dispatch={dispatch}
        testMode={testMode}
        data={data}
        onDataChange={onDataChange}
      />
    );
  }

  // Label
  const labelScope = child.scope ?? child.id;
  return (
    <StructuralElementRow
      el={{
        scope: labelScope,
        type: child.type,
        label: child.label,
        options: child.options,
      }}
      isSelected={selectedId === labelScope}
      onSelect={onSelect}
      dispatch={dispatch}
    />
  );
}
