import { JsonSchema7 } from '@jsonforms/core';
import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Dispatch, useEffect, useState } from 'react';

import { EditorAction } from '../core/model/actions';
import { FieldAwareState } from '../core/model/addFieldReducer';
import { FlatElement } from '../core/model/uiElements';
import {
  createSetFieldRuleAction,
  RuleEffect,
  UISchemaRule,
} from './fieldPropertiesActions';

interface ConditionEditorProps {
  selectedScope: string;
  schema: FieldAwareState['schema'];
  uiSchema: FieldAwareState['uiSchema'];
  dispatch: Dispatch<EditorAction>;
}

function findRule(
  uiSchema: FieldAwareState['uiSchema'],
  scope: string,
): UISchemaRule | null {
  type RuleElement = FlatElement & { rule?: UISchemaRule | null };
  function search(elements: RuleElement[]): UISchemaRule | null {
    for (const el of elements) {
      if (el.scope === scope) return el.rule ?? null;
      if (el.columns) {
        for (const col of el.columns) {
          const found = search(col);
          if (found !== null) return found;
        }
      }
      if (el.children) {
        const found = search(el.children);
        if (found !== null) return found;
      }
    }
    return null;
  }
  return search(uiSchema.elements as RuleElement[]);
}

/** Alle Felder aus dem Schema als Auswahlliste */
function getAvailableFields(
  schema: FieldAwareState['schema'],
  excludeScope: string,
): Array<{ scope: string; label: string; enumValues?: unknown[] }> {
  const excludeKey = excludeScope.replace('#/properties/', '');
  return Object.entries(schema.properties ?? {}).flatMap(
    ([key, fieldSchema]) => {
      if (key === excludeKey) return [];
      const fs = fieldSchema as JsonSchema7 & {
        title?: string;
        enum?: unknown[];
      };
      return [
        {
          scope: `#/properties/${key}`,
          label: fs.title ?? key,
          enumValues: Array.isArray(fs.enum) ? fs.enum : undefined,
        },
      ];
    },
  );
}

export function ConditionEditor({
  selectedScope,
  schema,
  uiSchema,
  dispatch,
}: ConditionEditorProps) {
  const existingRule = findRule(uiSchema, selectedScope);
  const fields = getAvailableFields(schema, selectedScope);

  const [enabled, setEnabled] = useState(!!existingRule);
  const [sourceScope, setSourceScope] = useState(
    existingRule?.condition.scope ?? '',
  );
  const [condValue, setCondValue] = useState<string>(
    String(existingRule?.condition.schema.const ?? ''),
  );
  const [effect, setEffect] = useState<RuleEffect>(
    existingRule?.effect ?? 'HIDE',
  );

  // Sync wenn das selektierte Feld wechselt
  useEffect(() => {
    const r = findRule(uiSchema, selectedScope);
    setEnabled(!!r);
    setSourceScope(r?.condition.scope ?? '');
    setCondValue(String(r?.condition.schema.const ?? ''));
    setEffect(r?.effect ?? 'HIDE');
  }, [selectedScope, uiSchema]);

  function applyRule() {
    if (!sourceScope || condValue === '') return;
    const rule: UISchemaRule = {
      effect,
      condition: { scope: sourceScope, schema: { const: condValue } },
    };
    dispatch(createSetFieldRuleAction(selectedScope, rule));
  }

  function removeRule() {
    dispatch(createSetFieldRuleAction(selectedScope, null));
    setEnabled(false);
    setSourceScope('');
    setCondValue('');
    setEffect('HIDE');
  }

  function handleToggle(active: boolean) {
    setEnabled(active);
    if (!active) removeRule();
  }

  function handleSourceChange(scope: string) {
    setSourceScope(scope);
    setCondValue('');
  }

  // Sofort anwenden wenn alle Werte gesetzt
  useEffect(() => {
    if (!enabled || !sourceScope || condValue === '') return;
    applyRule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sourceScope, condValue, effect]);

  const sourceField = fields.find((f) => f.scope === sourceScope);
  const hasEnums = !!sourceField?.enumValues?.length;

  return (
    <Box>
      <Divider sx={{ mb: 2 }} />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ color: 'text.secondary', fontWeight: 600 }}
        >
          Bedingte Anzeige
        </Typography>
        <Switch
          size="small"
          checked={enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          disabled={fields.length === 0}
          inputProps={{ 'aria-label': 'Bedingung aktivieren' }}
        />
      </Box>

      {fields.length === 0 && (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Erst weitere Felder hinzufügen, um Bedingungen zu definieren.
        </Typography>
      )}

      {enabled && fields.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Quellfeld */}
          <FormControl size="small" fullWidth>
            <InputLabel id="cond-source-label">Wenn Feld</InputLabel>
            <Select
              labelId="cond-source-label"
              label="Wenn Feld"
              value={sourceScope}
              onChange={(e) => handleSourceChange(e.target.value)}
            >
              {fields.map((f) => (
                <MenuItem key={f.scope} value={f.scope}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Wert */}
          {sourceScope &&
            (hasEnums ? (
              <FormControl size="small" fullWidth>
                <InputLabel id="cond-value-label">den Wert hat</InputLabel>
                <Select
                  labelId="cond-value-label"
                  label="den Wert hat"
                  value={condValue}
                  onChange={(e) => setCondValue(String(e.target.value))}
                >
                  {sourceField!.enumValues!.map((v) => (
                    <MenuItem key={String(v)} value={String(v)}>
                      {String(v)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                size="small"
                fullWidth
                label="den Wert hat"
                value={condValue}
                onChange={(e) => setCondValue(e.target.value)}
                placeholder='z. B. "ja" oder "DE"'
              />
            ))}

          {/* Effekt */}
          {sourceScope && condValue !== '' && (
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 500 }}
              >
                Dann dieses Feld:
              </Typography>
              <RadioGroup
                row
                value={effect}
                onChange={(e) => setEffect(e.target.value as RuleEffect)}
                aria-label="Effekt"
              >
                <FormControlLabel
                  value="SHOW"
                  control={<Radio size="small" />}
                  label={<Typography variant="caption">Anzeigen</Typography>}
                />
                <FormControlLabel
                  value="HIDE"
                  control={<Radio size="small" />}
                  label={<Typography variant="caption">Ausblenden</Typography>}
                />
                <FormControlLabel
                  value="DISABLE"
                  control={<Radio size="small" />}
                  label={
                    <Typography variant="caption">Deaktivieren</Typography>
                  }
                />
              </RadioGroup>
            </Box>
          )}

          {/* Vorschau */}
          {sourceScope && condValue !== '' && (
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: 'action.selected',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontStyle: 'italic' }}
              >
                {effect === 'SHOW' &&
                  `Dieses Feld wird nur angezeigt, wenn „${sourceField?.label}" = „${condValue}"`}
                {effect === 'HIDE' &&
                  `Dieses Feld wird ausgeblendet, wenn „${sourceField?.label}" = „${condValue}"`}
                {effect === 'DISABLE' &&
                  `Dieses Feld wird deaktiviert, wenn „${sourceField?.label}" = „${condValue}"`}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
