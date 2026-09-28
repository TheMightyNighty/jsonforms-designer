import { JsonSchema7 } from '@jsonforms/core';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import LayersIcon from '@mui/icons-material/Layers';
import { Box, Button, Typography } from '@mui/material';
import React from 'react';
import { Dispatch } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { EditorAction } from '../../core/model/actions';
import {
  createAddFieldAction,
  createAddTabAction,
  createRemoveFieldAction,
  createReorderElementAction,
} from '../../core/model/addFieldActions';
import { FieldAwareState } from '../../core/model/addFieldReducer';
import { fuelleVorlage } from '../../core/util/textVorlage';
import { FIELD_TYPE_CATALOG } from '../../field-types/fieldTypes';
import { useI18n } from '../../i18n';
import { useFieldDrop } from '../../palette-panel/useFieldDrop';
import { UISchemaRule } from '../../properties/fieldPropertiesActions';
import { ColumnContainerRow } from './ColumnContainerRow';
import { EditorErrorBoundary } from './EditorErrorBoundary';
import { EDITOR_ITEM, EditorDragItem, FieldRow } from './FieldRow';
import { GroupContainerRow } from './GroupContainerRow';
import {
  StructuralElement,
  StructuralElementRow,
} from './StructuralElementRow';
import { TabBar } from './TabBar';

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
    dispatch,
    insertAfterScope,
    tabIndex,
  );

  // Reorder-Drop
  const [{ isOver: isOverReorder }, reorderRef] = useDrop<
    EditorDragItem,
    void,
    { isOver: boolean }
  >(
    () => ({
      accept: EDITOR_ITEM,
      drop: (item) => {
        dispatch(createReorderElementAction(item.key, insertAfterScope));
      },
      collect: (m) => ({ isOver: m.isOver() }),
    }),
    [dispatch, insertAfterScope],
  );

  const isOver = isOverPalette || isOverReorder;

  const setRef = (el: HTMLDivElement | null) => {
    (paletteRef as unknown as React.RefCallback<HTMLDivElement>)(el);
    (reorderRef as unknown as React.RefCallback<HTMLDivElement>)(el);
  };

  return (
    <Box
      ref={setRef}
      data-testid="dropzone"
      sx={{
        height: isOver ? 32 : 8,
        minHeight: 8,
        borderRadius: 1,
        border: '1px dashed',
        borderColor: isOver ? 'primary.main' : 'transparent',
        backgroundColor: isOver ? 'action.selected' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'height 0.15s',
      }}
    >
      {isOver && (
        <Typography variant="caption" color="primary.main">
          hier ablegen
        </Typography>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Drag-fähige Wrapper für StructuralElementRow
// ---------------------------------------------------------------------------
function DraggableStructural({
  el,
  isSelected,
  onSelect,
  dispatch,
  elementKey,
}: {
  el: StructuralElement;
  isSelected: boolean;
  onSelect: (s: string) => void;
  dispatch: Dispatch<EditorAction>;
  elementKey: string;
}) {
  const [{ isDragging }, dragRef, dragPreviewRef] = useDrag<
    EditorDragItem,
    void,
    { isDragging: boolean }
  >(
    () => ({
      type: EDITOR_ITEM,
      item: { key: elementKey },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [elementKey],
  );

  return (
    <Box
      ref={dragPreviewRef as unknown as React.Ref<HTMLDivElement>}
      sx={{ opacity: isDragging ? 0.3 : 1 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Box
          ref={dragRef as unknown as React.Ref<HTMLDivElement>}
          sx={{
            cursor: 'grab',
            color: 'text.disabled',
            mt: 0.75,
            flexShrink: 0,
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <DragHandleIcon sx={{ fontSize: 16 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StructuralElementRow
            el={el}
            isSelected={isSelected}
            onSelect={onSelect}
            dispatch={dispatch}
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
  /** Testen-Modus: gerenderte Felder werden interaktiv statt rein visuell. */
  testMode: boolean;
  testData: Record<string, unknown>;
  onTestDataChange: (data: Record<string, unknown>) => void;
}

export function FieldFormPreview({
  fieldState,
  selectedScope,
  onSelectScope,
  dispatch,
  testMode,
  testData,
  onTestDataChange,
}: FieldFormPreviewProps) {
  const {
    schema,
    uiSchema,
    tabs,
    activeTabIndex,
    tabAssignments,
    lineNumbersEnabled,
  } = fieldState;
  const { t } = useI18n();

  const handleDelete = (scope: string) => {
    dispatch(createRemoveFieldAction(scope));
    if (selectedScope === scope) onSelectScope(null);
  };

  const handleDuplicate = (scope: string) => {
    const key = scope.replace(/^#\/properties\//, '');
    const fs = schema.properties?.[key];
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
    const tabIdx =
      tabs.length > 0 ? (tabAssignments[scope] ?? activeTabIndex) : undefined;
    dispatch(
      createAddFieldAction(
        { ...def, schema: { ...fs } },
        key + '_kopie',
        fuelleVorlage(t.actions.kopieLabel, { label: fs.title ?? key }),
        scope,
        tabIdx,
      ),
    );
  };

  // Alle Elemente klassifizieren. Identität: Controls und Labels über ihren
  // (Pseudo-)Scope — daran hängen Selektion und Tab-Zuordnung —, Container
  // über ihre id.
  const allElements = uiSchema.elements.map((el) => {
    if (el.type === 'ColumnContainer') {
      return { kind: 'column-container' as const, el, scope: el.id };
    }
    if (el.type === 'GroupContainer') {
      return { kind: 'group-container' as const, el, scope: el.id };
    }
    if (el.type === 'Label') {
      return {
        kind: 'structural' as const,
        scope: el.scope ?? el.id,
        type: 'Label',
        label: el.label,
        options: el.options,
      };
    }
    const key = el.scope.replace(/^#\/properties\//, '');
    const fs = schema.properties?.[key] as
      (JsonSchema7 & { 'x-opencode-validators'?: string[] }) | undefined;
    return {
      kind: 'control' as const,
      scope: el.scope,
      propertyKey: key,
      label: fs?.title ?? key,
      schemaType: fs?.type as string | undefined,
      required: schema.required?.includes(key) ?? false,
      validators: fs?.['x-opencode-validators'] ?? [],
      options: el.options,
      rule: el.rule as UISchemaRule | undefined,
    };
  });

  const hasTabs = tabs.length > 0;
  const visibleElements = hasTabs
    ? allElements.filter(
        (el) => (tabAssignments[el.scope] ?? 0) === activeTabIndex,
      )
    : allElements;

  // Formular-Rahmen: Titel aus schema.title, bei mehrstufigen Formularen
  // zusätzlich der aktive Schrittname — wie bei einem echten Amtsformular
  // (Kopfbereich, nicht nur eine flache Feldliste).
  const formTitle = (schema as JsonSchema7).title;
  const activeStepLabel = hasTabs ? tabs[activeTabIndex]?.label : undefined;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {hasTabs && (
        <TabBar
          tabs={tabs}
          activeTabIndex={activeTabIndex}
          dispatch={dispatch}
        />
      )}

      {!hasTabs && allElements.length > 0 && (
        <Box sx={{ px: 1.5, pt: 1, pb: 0 }}>
          <Button
            size="small"
            startIcon={<LayersIcon />}
            variant="text"
            onClick={() => dispatch(createAddTabAction('Seite 1'))}
            sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
          >
            {t.editor.mehrstufig}
          </Button>
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          backgroundColor: 'background.default',
        }}
      >
        <Box
          sx={{
            maxWidth: 760,
            mx: 'auto',
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
            p: 4,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {formTitle && <Typography variant="h4">{formTitle}</Typography>}
          {activeStepLabel && (
            <Typography
              variant="subtitle1"
              sx={{ color: 'text.secondary', mt: 0.5, mb: 3 }}
            >
              {activeStepLabel}
            </Typography>
          )}
          {!activeStepLabel && formTitle && <Box sx={{ mb: 3 }} />}

          {/* Erste Drop-Zone (oben) */}
          <DropZone
            dispatch={dispatch}
            tabIndex={hasTabs ? activeTabIndex : undefined}
          />

          {visibleElements.map((el, idx) => (
            <React.Fragment key={el.scope}>
              {/* Zeilennummer + Element nebeneinander.
                Alt+Pfeil hoch/runter sortiert das fokussierte Element um
                (Tastatur-Alternative zum Drag & Drop, BITV). */}
              <Box
                sx={{ display: 'flex', alignItems: 'flex-start' }}
                aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                onKeyDown={(e) => {
                  if (!e.altKey) return;
                  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.key === 'ArrowUp' && idx > 0) {
                    // Vor den Vorgänger = hinter dessen Vorgänger (oder Anfang)
                    dispatch(
                      createReorderElementAction(
                        el.scope,
                        idx >= 2 ? visibleElements[idx - 2].scope : undefined,
                      ),
                    );
                  } else if (
                    e.key === 'ArrowDown' &&
                    idx < visibleElements.length - 1
                  ) {
                    dispatch(
                      createReorderElementAction(
                        el.scope,
                        visibleElements[idx + 1].scope,
                      ),
                    );
                  }
                }}
              >
                {lineNumbersEnabled && (
                  <Box
                    sx={{
                      minWidth: 22,
                      textAlign: 'right',
                      pr: 0.75,
                      pt: 1.25,
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.disabled',
                        fontSize: '0.65rem',
                        fontFamily: 'monospace',
                      }}
                    >
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
                        testMode={testMode}
                        data={testData}
                        onDataChange={onTestDataChange}
                      />
                    </EditorErrorBoundary>
                  ) : el.kind === 'group-container' ? (
                    <EditorErrorBoundary fallbackLabel="Gruppen-Fehler">
                      <GroupContainerRow
                        container={el.el}
                        schema={schema}
                        selectedId={selectedScope}
                        onSelect={onSelectScope}
                        dispatch={dispatch}
                        testMode={testMode}
                        data={testData}
                        onDataChange={onTestDataChange}
                      />
                    </EditorErrorBoundary>
                  ) : el.kind === 'control' ? (
                    <FieldRow
                      propertyKey={el.propertyKey}
                      scope={el.scope}
                      schema={schema}
                      uiOptions={el.options}
                      rule={el.rule}
                      validators={el.validators}
                      isSelected={selectedScope === el.scope}
                      testMode={testMode}
                      testData={testData}
                      onTestDataChange={onTestDataChange}
                      onSelect={onSelectScope}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                    />
                  ) : (
                    <DraggableStructural
                      el={{
                        scope: el.scope,
                        type: el.type,
                        label: el.label,
                        options: el.options,
                      }}
                      isSelected={selectedScope === el.scope}
                      onSelect={onSelectScope}
                      dispatch={dispatch}
                      elementKey={el.scope}
                    />
                  )}
                </Box>
              </Box>
              <DropZone
                dispatch={dispatch}
                insertAfterScope={el.scope}
                tabIndex={hasTabs ? activeTabIndex : undefined}
              />
            </React.Fragment>
          ))}

          {visibleElements.length === 0 && hasTabs && (
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ pt: 2, textAlign: 'center' }}
            >
              {t.editor.feldHierher}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
