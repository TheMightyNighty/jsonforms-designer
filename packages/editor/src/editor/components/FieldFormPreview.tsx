import React from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import LayersIcon from '@mui/icons-material/Layers';
import { Box, Button, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { Dispatch } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import {
  createAddFieldAction,
  createAddTabAction,
  createRemoveFieldAction,
  createReorderElementAction,
} from '../../core/model/addFieldActions';
import { FieldAwareState } from '../../core/model/addFieldReducer';
import { EditorAction } from '../../core/model/actions';
import { FIELD_TYPE_CATALOG } from '../../field-types/fieldTypes';
import { useFieldDrop } from '../../palette-panel/useFieldDrop';
import type { AddFieldAction } from '../../core/model/addFieldActions';
import { TabBar } from './TabBar';
import { useI18n } from '../../i18n';
import { StructuralElementRow } from './StructuralElementRow';
import { ColumnContainerRow } from './ColumnContainerRow';
import { EditorErrorBoundary } from './EditorErrorBoundary';

// DnD-Typ für interne Reorder-Verschiebung
const EDITOR_ITEM = 'EDITOR_ITEM' as const;
interface EditorDragItem { key: string }

// ---------------------------------------------------------------------------
// Typ-Labels
// ---------------------------------------------------------------------------
const TYPE_LABELS: Record<string, string> = {
  string: 'Text', number: 'Zahl', integer: 'Ganzzahl', boolean: 'Bool',
  object: 'Objekt', array: 'Liste',
};
const typeLabel = (t?: string) => t ? (TYPE_LABELS[t] ?? t) : '?';

// ---------------------------------------------------------------------------
// Drop-Zone zwischen Elementen (Palette + Reorder)
// ---------------------------------------------------------------------------
interface DropZoneProps {
  dispatch: Dispatch<EditorAction>;
  insertAfterScope?: string;
  tabIndex?: number;
}
function DropZone({ dispatch, insertAfterScope, tabIndex }: DropZoneProps) {
  // Palette-Drop
  const [{ isOver: isOverPalette }, paletteRef] = useFieldDrop(
    dispatch as Dispatch<AddFieldAction>,
    insertAfterScope,
    tabIndex
  );

  // Reorder-Drop
  const [{ isOver: isOverReorder }, reorderRef] = useDrop<EditorDragItem, void, { isOver: boolean }>(
    () => ({
      accept: EDITOR_ITEM,
      drop: (item) => {
        dispatch(createReorderElementAction(item.key, insertAfterScope) as unknown as EditorAction);
      },
      collect: (m) => ({ isOver: m.isOver() }),
    }),
    [dispatch, insertAfterScope]
  );

  const isOver = isOverPalette || isOverReorder;

  const setRef = (el: HTMLDivElement | null) => {
    (paletteRef as any)(el);
    (reorderRef as any)(el);
  };

  return (
    <Box
      ref={setRef}
      sx={{
        height: isOver ? 32 : 8, minHeight: 8, borderRadius: 1,
        border: '1px dashed', borderColor: isOver ? 'primary.main' : 'transparent',
        backgroundColor: isOver ? 'action.selected' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'height 0.15s',
      }}
    >
      {isOver && <Typography variant="caption" color="primary.main">hier ablegen</Typography>}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Normales Feld (Control) mit Drag-Handle
// ---------------------------------------------------------------------------
interface FieldRowProps {
  propertyKey: string; scope: string; label: string;
  schemaType?: string; required: boolean; isSelected: boolean;
  validators?: string[];
  onSelect: (scope: string) => void;
  onDelete: (scope: string) => void;
  onDuplicate: (scope: string) => void;
}
function FieldRow({ propertyKey, scope, label, schemaType, required, isSelected,
  validators = [], onSelect, onDelete, onDuplicate }: FieldRowProps) {

  const [{ isDragging }, dragRef, dragPreviewRef] = useDrag<EditorDragItem, void, { isDragging: boolean }>(
    () => ({
      type: EDITOR_ITEM,
      item: { key: scope },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [scope]
  );

  return (
    <Box
      ref={dragPreviewRef as any}
      role="button" tabIndex={0}
      onClick={() => onSelect(scope)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(scope)}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        px: 1, py: 0.75, borderRadius: 1, cursor: 'pointer',
        opacity: isDragging ? 0.3 : 1,
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        backgroundColor: isSelected ? 'action.selected' : 'background.paper',
        transition: 'border-color 0.15s, background-color 0.15s',
        '&:hover': { borderColor: 'primary.light', backgroundColor: 'action.hover' },
      }}
    >
      {/* Drag-Handle */}
      <Box ref={dragRef as any} sx={{ cursor: 'grab', color: 'text.disabled', flexShrink: 0, '&:active': { cursor: 'grabbing' } }}>
        <DragHandleIcon sx={{ fontSize: 16 }} />
      </Box>

      {required && (
        <Typography component="span" sx={{ color: 'error.main', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>*</Typography>
      )}
      <Typography variant="body2" sx={{ flex: 1, fontWeight: isSelected ? 500 : 400 }} noWrap>
        {label || propertyKey}
      </Typography>
      <Chip label={typeLabel(schemaType)} size="small" variant="outlined"
        sx={{ fontSize: '0.68rem', height: 20, borderRadius: '4px' }} />
      {validators.length > 0 && (
        <Tooltip title={`Validatoren: ${validators.join(', ')}`}>
          <Box component="i" className="ti ti-shield-check"
            sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }} />
        </Tooltip>
      )}
      <Tooltip title="Duplizieren">
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDuplicate(scope); }}
          sx={{ p: 0.25, opacity: 0.5, '&:hover': { opacity: 1 } }}>
          <ContentCopyIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Entfernen">
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(scope); }}
          sx={{ p: 0.25, opacity: 0.5, '&:hover': { opacity: 1 } }}>
          <DeleteIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Drag-fähige Wrapper für StructuralElementRow
// ---------------------------------------------------------------------------
function DraggableStructural({ el, isSelected, onSelect, dispatch, elementKey }: {
  el: any; isSelected: boolean; onSelect: (s: string) => void;
  dispatch: Dispatch<EditorAction>; elementKey: string;
}) {
  const [{ isDragging }, dragRef, dragPreviewRef] = useDrag<EditorDragItem, void, { isDragging: boolean }>(
    () => ({
      type: EDITOR_ITEM,
      item: { key: elementKey },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [elementKey]
  );

  return (
    <Box ref={dragPreviewRef as any} sx={{ opacity: isDragging ? 0.3 : 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Box ref={dragRef as any}
          sx={{ cursor: 'grab', color: 'text.disabled', mt: 0.75, flexShrink: 0, '&:active': { cursor: 'grabbing' } }}>
          <DragHandleIcon sx={{ fontSize: 16 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StructuralElementRow
            el={el} isSelected={isSelected} onSelect={onSelect} dispatch={dispatch}
          />
        </Box>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Haupt-Komponente
// ---------------------------------------------------------------------------
interface FieldFormPreviewProps {
  fieldState: FieldAwareState;
  selectedScope: string | null;
  onSelectScope: (scope: string | null) => void;
  dispatch: Dispatch<EditorAction>;
}

export function FieldFormPreview({ fieldState, selectedScope, onSelectScope, dispatch }: FieldFormPreviewProps) {
  const { schema, uiSchema, tabs, activeTabIndex, tabAssignments, lineNumbersEnabled } = fieldState;
  const { t } = useI18n();

  const handleDelete = (scope: string) => {
    dispatch(createRemoveFieldAction(scope) as unknown as EditorAction);
    if (selectedScope === scope) onSelectScope(null);
  };

  const handleDuplicate = (scope: string) => {
    const key = scope.replace(/^#\/properties\//, '');
    const fs = schema.properties?.[key] as any;
    if (!fs) return;
    const guessId = () => {
      if (fs.type === 'boolean') return 'checkbox';
      if (fs.type === 'integer') return 'integer';
      if (fs.type === 'number') return 'number';
      if (fs.format === 'date') return 'date';
      if (fs.format === 'time') return 'time';
      if (fs.format === 'date-time') return 'datetime';
      if (fs.format === 'email') return 'email';
      if (fs.type === 'array') return 'checkbox-group';
      if (fs.enum) return 'dropdown';
      return 'text-short';
    };
    const def = FIELD_TYPE_CATALOG.find((f) => f.id === guessId());
    if (!def) return;
    const tabIdx = tabs.length > 0 ? (tabAssignments[scope] ?? activeTabIndex) : undefined;
    dispatch(createAddFieldAction(
      { ...def, schema: { ...fs }, defaults: { ...def.defaults, label: (fs.title ?? key) + ' (Kopie)' } },
      key + '_kopie', scope, tabIdx
    ) as unknown as EditorAction);
  };

  // Alle Elemente klassifizieren
  const allElements = uiSchema.elements.map((el: any) => {
    const id = el.id ?? el.scope ?? '';
    if (el.type === 'ColumnContainer' && el.columns) {
      return { kind: 'column-container' as const, el, scope: id };
    }
    if (el.type === 'GroupContainer' && el.children) {
      return { kind: 'structural' as const, scope: id, type: 'GroupContainer', label: el.label ?? 'Gruppe', options: el.options };
    }
    if (el.type === 'Label' && el.id) {
      return { kind: 'structural' as const, scope: id, type: 'Label', label: el.label ?? '', options: el.options };
    }
    // Legacy Label mit scope (section-header, annotation)
    if (el.type === 'Label') {
      return { kind: 'structural' as const, scope: el.scope ?? id, type: 'Label', label: el.label ?? '', options: el.options };
    }
    if (el.type === 'Control') {
      const key = (el.scope ?? '').replace(/^#\/properties\//, '');
      const fs = schema.properties?.[key] as any;
      return {
        kind: 'control' as const,
        scope: el.scope ?? '',
        propertyKey: key,
        label: fs?.title ?? key,
        schemaType: fs?.type as string | undefined,
        required: schema.required?.includes(key) ?? false,
        validators: (fs?.['x-opencode-validators'] ?? []) as string[],
      };
    }
    // Legacy-Fallback
    return { kind: 'structural' as const, scope: el.scope ?? id, type: el.type, label: (el as any).label ?? el.type, options: el.options };
  });

  const hasTabs = tabs.length > 0;
  const visibleElements = hasTabs
    ? allElements.filter((el) => (tabAssignments[el.scope] ?? 0) === activeTabIndex)
    : allElements;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {hasTabs && <TabBar tabs={tabs} activeTabIndex={activeTabIndex} dispatch={dispatch} />}

      {!hasTabs && allElements.length > 0 && (
        <Box sx={{ px: 1.5, pt: 1, pb: 0 }}>
          <Button size="small" startIcon={<LayersIcon />} variant="text"
            onClick={() => dispatch(createAddTabAction('Seite 1') as unknown as EditorAction)}
            sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {t.editor.mehrstufig}
          </Button>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column' }}>
        {/* Erste Drop-Zone (oben) */}
        <DropZone dispatch={dispatch} tabIndex={hasTabs ? activeTabIndex : undefined} />

        {visibleElements.map((el, idx) => (
          <React.Fragment key={el.scope}>
            {/* Zeilennummer + Element nebeneinander */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              {lineNumbersEnabled && (
                <Box sx={{ minWidth: 22, textAlign: 'right', pr: 0.75, pt: 1.25, flexShrink: 0 }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                    {idx + 1}
                  </Typography>
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {el.kind === 'column-container' ? (
                  <EditorErrorBoundary fallbackLabel="Layout-Fehler">
                    <ColumnContainerRow
                      container={el.el}
                      schema={schema.properties ?? {}}
                      selectedId={selectedScope}
                      onSelect={onSelectScope}
                      dispatch={dispatch}
                    />
                  </EditorErrorBoundary>
                ) : el.kind === 'control' ? (
                  <FieldRow
                    propertyKey={el.propertyKey}
                    scope={el.scope}
                    label={el.label}
                    schemaType={el.schemaType}
                    required={el.required}
                    validators={el.validators}
                    isSelected={selectedScope === el.scope}
                    onSelect={onSelectScope}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                  />
                ) : (
                  <DraggableStructural
                    el={{ scope: el.scope, type: (el as any).type, label: (el as any).label, options: (el as any).options }}
                    isSelected={selectedScope === el.scope}
                    onSelect={onSelectScope}
                    dispatch={dispatch}
                    elementKey={el.scope}
                  />
                )}
              </Box>
            </Box>
            <DropZone dispatch={dispatch} insertAfterScope={el.scope}
              tabIndex={hasTabs ? activeTabIndex : undefined} />
          </React.Fragment>
        ))}

        {visibleElements.length === 0 && hasTabs && (
          <Typography variant="body2" color="text.disabled" sx={{ pt: 2, textAlign: 'center' }}>
            {t.editor.feldHierher}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
