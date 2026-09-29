/**
 * Bedingte Anzeige als Satz:
 *
 *   „Nur anzeigen / Ausblenden / Sperren, wenn [Feld] [ist gleich /
 *    ist nicht gleich] [Wert]"
 *
 * Vorher standen Effekt, Quellfeld und Wert als drei getrennte Formularteile
 * untereinander, mit einer nachgestellten Erklärung in Prosa. Der Satz ist
 * dieselbe Information in der Reihenfolge, in der sie gedacht wird.
 *
 * Ausgabe bleibt der bestehende JSONForms-`rule`-Eintrag (ADR 0002/V3).
 * Angeboten werden nur Operatoren, die `rule.condition` abbilden kann:
 * „ist gleich" (`{ const }`) und „ist nicht gleich" (`{ not: { const } }`).
 *
 * [RÜCKFRAGE AN FABLE: „ist ausgefüllt" ist bewusst nicht dabei. Es gibt kein
 * Bedingungs-Schema, das „hat einen Wert" über alle Feldarten hinweg
 * ausdrückt — `minLength: 1` greift nur bei Text, und ein fehlender Wert
 * erfüllt in JSON Schema jede Einschränkung. Soll der Operator auf
 * Textfelder beschränkt angeboten werden, oder braucht es dafür eine
 * JSONLogic-Bedingung (eigener Auftrag)?]
 */
import { JsonSchema7 } from '@jsonforms/core';
import { Box, MenuItem, Switch, TextField, Typography } from '@mui/material';
import { Dispatch, useEffect, useState } from 'react';

import { EditorAction } from '../core/model/actions';
import { FieldAwareState } from '../core/model/addFieldReducer';
import { UiElement } from '../core/model/uiElements';
import { useI18n } from '../i18n';
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

/** Vergleichsoperatoren, die `rule.condition` abbilden kann. */
type Operator = 'gleich' | 'ungleich';

function findRule(
  uiSchema: FieldAwareState['uiSchema'],
  scope: string,
): UISchemaRule | null {
  function search(elements: UiElement[]): UISchemaRule | null {
    for (const el of elements) {
      if ('scope' in el && el.scope === scope) {
        return (el.rule as UISchemaRule | undefined) ?? null;
      }
      if (el.type === 'ColumnContainer') {
        for (const col of el.columns) {
          const found = search(col);
          if (found !== null) return found;
        }
      }
      if (el.type === 'GroupContainer') {
        const found = search(el.children);
        if (found !== null) return found;
      }
    }
    return null;
  }
  return search(uiSchema.elements);
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

/** Operator und Vergleichswert aus einer gespeicherten Regel lesen. */
function leseBedingung(rule: UISchemaRule | null): {
  operator: Operator;
  wert: string;
} {
  const bedingung = rule?.condition.schema;
  if (bedingung?.not && 'const' in bedingung.not) {
    return { operator: 'ungleich', wert: String(bedingung.not.const ?? '') };
  }
  return { operator: 'gleich', wert: String(bedingung?.const ?? '') };
}

export function ConditionEditor({
  selectedScope,
  schema,
  uiSchema,
  dispatch,
}: ConditionEditorProps) {
  const { t } = useI18n();
  const texte = t.properties.bedingung;
  const existingRule = findRule(uiSchema, selectedScope);
  const fields = getAvailableFields(schema, selectedScope);

  const [enabled, setEnabled] = useState(!!existingRule);
  const [sourceScope, setSourceScope] = useState(
    existingRule?.condition.scope ?? '',
  );
  const [operator, setOperator] = useState<Operator>(
    leseBedingung(existingRule).operator,
  );
  const [condValue, setCondValue] = useState(leseBedingung(existingRule).wert);
  const [effect, setEffect] = useState<RuleEffect>(
    existingRule?.effect ?? 'SHOW',
  );

  // Die Eingaben zeigen die Bedingung des gewählten Feldes. Wechselt das
  // Feld oder ändert sich das uiSchema (auch durch Rückgängig), werden sie
  // neu gelesen. Angleichen im Render statt im Effekt: Sonst stünde für
  // einen Durchlauf die Bedingung des vorigen Feldes da.
  const [quelle, setQuelle] = useState({ uiSchema, selectedScope });
  if (quelle.uiSchema !== uiSchema || quelle.selectedScope !== selectedScope) {
    setQuelle({ uiSchema, selectedScope });
    const r = findRule(uiSchema, selectedScope);
    const gelesen = leseBedingung(r);
    setEnabled(!!r);
    setSourceScope(r?.condition.scope ?? '');
    setOperator(gelesen.operator);
    setCondValue(gelesen.wert);
    setEffect(r?.effect ?? 'SHOW');
  }

  function removeRule() {
    dispatch(createSetFieldRuleAction(selectedScope, null));
    setEnabled(false);
    setSourceScope('');
    setCondValue('');
    setOperator('gleich');
    setEffect('SHOW');
  }

  function handleToggle(active: boolean) {
    setEnabled(active);
    if (!active) removeRule();
  }

  function handleSourceChange(scope: string) {
    setSourceScope(scope);
    setCondValue('');
  }

  // Sofort anwenden, wenn alle Teile des Satzes gesetzt sind
  useEffect(() => {
    if (!enabled || !sourceScope || condValue === '') return;
    const bedingungsSchema =
      operator === 'ungleich'
        ? { not: { const: condValue } }
        : { const: condValue };
    dispatch(
      createSetFieldRuleAction(selectedScope, {
        effect,
        condition: { scope: sourceScope, schema: bedingungsSchema },
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sourceScope, condValue, operator, effect]);

  const sourceField = fields.find((f) => f.scope === sourceScope);
  const hasEnums = !!sourceField?.enumValues?.length;

  /** Einheitliche Größe für die Satzbausteine. */
  const satzFeld = { minWidth: 120, flex: '1 1 auto' } as const;

  return (
    <Box>
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
          {texte.titel}
        </Typography>
        <Switch
          size="small"
          checked={enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          disabled={fields.length === 0}
          inputProps={{ 'aria-label': texte.aktivieren }}
        />
      </Box>

      {fields.length === 0 && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {texte.keineFelder}
        </Typography>
      )}

      {enabled && fields.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {/* „Nur anzeigen / Ausblenden / Sperren …" */}
          <TextField
            select
            size="small"
            value={effect}
            onChange={(e) => setEffect(e.target.value as RuleEffect)}
            SelectProps={{ 'aria-label': texte.titel }}
            sx={satzFeld}
          >
            <MenuItem value="SHOW">{texte.nurAnzeigen}</MenuItem>
            <MenuItem value="HIDE">{texte.ausblenden}</MenuItem>
            <MenuItem value="DISABLE">{texte.sperren}</MenuItem>
          </TextField>

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {texte.wenn}
          </Typography>

          {/* „… wenn [Feld] …" */}
          <TextField
            select
            size="small"
            value={sourceScope}
            onChange={(e) => handleSourceChange(e.target.value)}
            SelectProps={{ 'aria-label': texte.wenn }}
            sx={satzFeld}
          >
            {fields.map((f) => (
              <MenuItem key={f.scope} value={f.scope}>
                {f.label}
              </MenuItem>
            ))}
          </TextField>

          {/* „… [ist gleich / ist nicht gleich] …" */}
          <TextField
            select
            size="small"
            value={operator}
            onChange={(e) => setOperator(e.target.value as Operator)}
            SelectProps={{ 'aria-label': texte.istGleich }}
            sx={satzFeld}
          >
            <MenuItem value="gleich">{texte.istGleich}</MenuItem>
            <MenuItem value="ungleich">{texte.istNichtGleich}</MenuItem>
          </TextField>

          {/* „… [Wert]" */}
          {sourceScope &&
            (hasEnums ? (
              <TextField
                select
                size="small"
                value={condValue}
                onChange={(e) => setCondValue(String(e.target.value))}
                SelectProps={{ 'aria-label': texte.wert }}
                sx={satzFeld}
              >
                {sourceField!.enumValues!.map((v) => (
                  <MenuItem key={String(v)} value={String(v)}>
                    {String(v)}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                size="small"
                value={condValue}
                onChange={(e) => setCondValue(e.target.value)}
                placeholder='z. B. „ja" oder „DE"'
                inputProps={{ 'aria-label': texte.wert }}
                sx={satzFeld}
              />
            ))}
        </Box>
      )}
    </Box>
  );
}
