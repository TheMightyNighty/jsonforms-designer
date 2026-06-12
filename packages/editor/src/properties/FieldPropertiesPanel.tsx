/**
 * Rechte Spalte — zeigt strukturelle Eigenschaften des selektierten Feldes:
 *   - Label (schema.title)
 *   - Hinweistext (schema.description)
 *   - Platzhalter (uischema options.placeholder, nur bei string-Feldern)
 *   - Pflicht-Flag (schema.required)
 *
 * OpenCode-Validatoren werden separat in ValidatorSection konfiguriert.
 *
 * Props:
 *   selectedScope  — scope des selektierten Controls ("#/properties/vorname")
 *                    oder null wenn nichts selektiert
 *   schema         — aktuelles JSON Schema (gelesen, nicht geschrieben)
 *   uiSchema       — aktuelles UI Schema (gelesen)
 *   onUpdate       — Callback mit UpdateFieldPropertyAction, wird nach oben
 *                    gereicht und vom Haupt-Reducer verarbeitet
 */

import { JsonSchema7 } from '@jsonforms/core';
import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import { Dispatch } from 'react';

import { useEditorContext } from '../core/context';
import { EditorAction } from '../core/model/actions';
import { FieldAwareState } from '../core/model/addFieldReducer';
import { UiElement } from '../core/model/uiElements';
import { useI18n } from '../i18n';
import { ConditionEditor } from './ConditionEditor';
import { EnumEditor } from './EnumEditor';
import {
  createUpdateFieldPropertyAction,
  propertyKeyFromScope,
  UpdateFieldPropertyAction,
} from './fieldPropertiesActions';
import { StructuralPropertiesPanel } from './StructuralPropertiesPanel';
import { TranslationEditor } from './TranslationEditor';
import { ValidatorSection } from './ValidatorSection';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FieldPropertiesPanelProps {
  selectedScope: string | null;
  schema: FieldAwareState['schema'];
  uiSchema: FieldAwareState['uiSchema'];
  dispatch: Dispatch<UpdateFieldPropertyAction | EditorAction>;
}

// ---------------------------------------------------------------------------
// Hilfsfunktion: aktuelle Feldwerte aus State lesen
// ---------------------------------------------------------------------------

interface FieldValues {
  label: string;
  description: string;
  placeholder: string;
  required: boolean;
  isStringType: boolean;
  hasEnum: boolean;
}

function readFieldValues(
  scope: string,
  schema: FieldAwareState['schema'],
  uiSchema: FieldAwareState['uiSchema'],
): FieldValues {
  const key = propertyKeyFromScope(scope);
  const fieldSchema = (schema.properties?.[key] ?? {}) as JsonSchema7 & {
    title?: string;
    description?: string;
  };
  const control = uiSchema.elements.find(
    (el) => el.type === 'Control' && el.scope === scope,
  );

  return {
    label: fieldSchema.title ?? '',
    description: fieldSchema.description ?? '',
    placeholder: (control?.options?.['placeholder'] as string) ?? '',
    required: schema.required?.includes(key) ?? false,
    isStringType: fieldSchema.type === 'string',
    hasEnum: Array.isArray(fieldSchema.enum),
  };
}

// ---------------------------------------------------------------------------
// Leer-Zustand
// ---------------------------------------------------------------------------

function EmptyState() {
  const { t } = useI18n();
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Typography variant="body2" color="text.disabled" textAlign="center">
        {t.properties.emptyHint.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i === 0 && <br />}
          </span>
        ))}
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Haupt-Komponente
// ---------------------------------------------------------------------------

export function FieldPropertiesPanel({
  selectedScope,
  schema,
  uiSchema,
  dispatch,
}: FieldPropertiesPanelProps) {
  const { fieldState } = useEditorContext();
  const { t } = useI18n();
  if (!selectedScope) return <EmptyState />;

  // Strukturelle Elemente → eigenes Panel. Suche rekursiv auch in Spalten.
  function findEl(elements: UiElement[], key: string): UiElement | undefined {
    for (const el of elements) {
      if (el.id === key || ('scope' in el && el.scope === key)) return el;
      if (el.type === 'ColumnContainer')
        for (const col of el.columns) {
          const f = findEl(col, key);
          if (f) return f;
        }
      if (el.type === 'GroupContainer') {
        const f = findEl(el.children, key);
        if (f) return f;
      }
    }
  }
  const selectedEl = findEl(uiSchema.elements, selectedScope);
  // Element nicht mehr gefunden (z.B. nach dem Löschen) → leeres Panel
  if (!selectedEl) return <EmptyState />;
  const isStructural = selectedEl.type !== 'Control';
  if (isStructural) {
    return (
      <StructuralPropertiesPanel
        selectedScope={selectedScope}
        uiSchema={uiSchema}
        dispatch={dispatch}
      />
    );
  }

  const values = readFieldValues(selectedScope, schema, uiSchema);

  const update = (
    property: Parameters<typeof createUpdateFieldPropertyAction>[1],
    value: string | boolean,
  ) => {
    dispatch(createUpdateFieldPropertyAction(selectedScope, property, value));
  };

  return (
    <Box
      sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}
      role="form"
      aria-label="Feldeigenschaften"
    >
      <Typography
        variant="subtitle2"
        sx={{ color: 'text.secondary', fontWeight: 500 }}
      >
        Feldeigenschaften
      </Typography>

      <Divider />

      {/* Label */}
      <TextField
        label="Label"
        value={values.label}
        onChange={(e) => update('label', e.target.value)}
        size="small"
        fullWidth
        inputProps={{ 'aria-label': 'Label des Feldes' }}
      />

      {/* Hinweistext */}
      <TextField
        label={t.properties.description}
        value={values.description}
        onChange={(e) => update('description', e.target.value)}
        size="small"
        fullWidth
        multiline
        minRows={2}
        inputProps={{ 'aria-label': 'Hinweistext des Feldes' }}
        helperText="Wird unter dem Feld angezeigt"
      />

      {/* Platzhalter — nur bei String-Feldern sinnvoll */}
      {values.isStringType && (
        <TextField
          label={t.properties.placeholder}
          value={values.placeholder}
          onChange={(e) => update('placeholder', e.target.value)}
          size="small"
          fullWidth
          inputProps={{ 'aria-label': 'Platzhalter-Text des Feldes' }}
          helperText="Beispieltext im leeren Feld"
        />
      )}

      {/* Enum-Optionen für Dropdown/Radio */}
      {values.hasEnum && (
        <EnumEditor
          selectedScope={selectedScope}
          schema={schema}
          uiSchema={uiSchema}
          tabs={fieldState.tabs}
          activeTabIndex={fieldState.activeTabIndex}
          tabAssignments={fieldState.tabAssignments}
          dispatch={dispatch}
        />
      )}

      <Divider />

      {/* Pflicht-Flag */}
      <FormControlLabel
        control={
          <Checkbox
            checked={values.required}
            onChange={(e) => update('required', e.target.checked)}
            size="small"
          />
        }
        label={<Typography variant="body2">Pflichtfeld</Typography>}
      />
      <ValidatorSection
        selectedScope={selectedScope}
        schema={schema}
        uiSchema={uiSchema}
        dispatch={dispatch}
      />

      <ConditionEditor
        selectedScope={selectedScope}
        schema={schema}
        uiSchema={uiSchema}
        dispatch={dispatch}
      />

      <TranslationEditor
        selectedScope={selectedScope}
        schema={schema}
        dispatch={dispatch}
      />
    </Box>
  );
}
