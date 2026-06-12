/**
 * Mehrfach-Auswahl für OpenCode-Validatoren im Properties-Panel.
 * x-opencode-validators wird im Schema hinterlegt.
 * Nutzt useEditorContext für vollen fieldState (tabs, tabAssignments etc.).
 */
import { JsonSchema7 } from '@jsonforms/core';
import {
  Box,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { Dispatch, useEffect, useState } from 'react';

import { useEditorContext } from '../core/context';
import { EditorAction } from '../core/model/actions';
import { createSetFieldStateAction } from '../core/model/addFieldActions';
import { FieldAwareState } from '../core/model/addFieldReducer';
import { useI18n } from '../i18n';
import { defaultOpenCodeService } from '../opencode/mockOpenCodeService';
import { OpenCodeBaustein, OpenCodeService } from '../opencode/openCodeService';

interface ValidatorSectionProps {
  selectedScope: string;
  schema: FieldAwareState['schema'];
  uiSchema: FieldAwareState['uiSchema'];
  dispatch: Dispatch<EditorAction>;
  service?: OpenCodeService;
}

export function ValidatorSection({
  selectedScope,
  schema,
  uiSchema,
  dispatch,
  service = defaultOpenCodeService,
}: ValidatorSectionProps) {
  const { fieldState } = useEditorContext();
  const { t } = useI18n();
  const [validators, setValidators] = useState<OpenCodeBaustein[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    service.getBausteineByKategorie('validator').then((v) => {
      setValidators(v);
      setLoading(false);
    });
  }, [service]);

  const key = selectedScope.replace(/^#\/properties\//, '');
  const fieldDef = (schema.properties?.[key] ?? {}) as JsonSchema7 & {
    'x-opencode-validators'?: string[];
  };
  const current: string[] = fieldDef['x-opencode-validators'] ?? [];

  const toggle = (id: string) => {
    const next = current.includes(id)
      ? current.filter((v) => v !== id)
      : [...current, id];

    const updatedSchema = {
      ...schema,
      properties: {
        ...schema.properties,
        [key]: { ...fieldDef, 'x-opencode-validators': next },
      },
    };
    dispatch(
      createSetFieldStateAction({
        schema: updatedSchema,
        uiSchema,
        tabs: fieldState.tabs,
        activeTabIndex: fieldState.activeTabIndex,
        tabAssignments: fieldState.tabAssignments,
        lineNumbersEnabled: fieldState.lineNumbersEnabled,
        sectionColors: fieldState.sectionColors,
      }),
    );
  };

  if (loading) {
    return (
      <Box sx={{ py: 1, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={16} />
      </Box>
    );
  }
  if (validators.length === 0) return null;

  return (
    <Box>
      <Divider sx={{ my: 1 }} />
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          display: 'block',
          mb: 0.5,
        }}
      >
        {t.properties.validatoren}
      </Typography>
      {validators.map((v) => (
        <FormControlLabel
          key={v.id}
          control={
            <Checkbox
              size="small"
              checked={current.includes(v.id)}
              onChange={() => toggle(v.id)}
            />
          }
          label={
            <Typography variant="body2" title={v.description}>
              {v.displayName}
            </Typography>
          }
          sx={{ display: 'flex', ml: 0, mb: 0.25 }}
        />
      ))}
    </Box>
  );
}
