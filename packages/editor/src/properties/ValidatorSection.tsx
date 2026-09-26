/**
 * Mehrfach-Auswahl der Prüfungen (OpenCode-Validatoren) im Properties-Panel.
 * x-opencode-validators wird im Schema hinterlegt.
 * Nutzt useEditorContext für vollen fieldState (tabs, tabAssignments etc.).
 *
 * Angeboten werden nur die Prüfungen, die zur Art des ausgewählten Feldes
 * passen (siehe validatorZuordnung) — die Steuer-ID-Prüfung erscheint nicht
 * mehr am Geburtsdatum.
 */
import { JsonSchema7 } from '@jsonforms/core';
import {
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { Dispatch, useEffect, useState } from 'react';

import { useEditorContext } from '../core/context';
import { EditorAction } from '../core/model/actions';
import { createSetFieldStateAction } from '../core/model/addFieldActions';
import { FieldAwareState } from '../core/model/addFieldReducer';
import { ermittleFeldtyp, FeldSchema } from '../field-types/feldtypErkennung';
import { useI18n } from '../i18n';
import { defaultOpenCodeService } from '../opencode/mockOpenCodeService';
import { OpenCodeBaustein, OpenCodeService } from '../opencode/openCodeService';
import { filtereValidatoren } from '../opencode/validatorZuordnung';

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

  // Art des Feldes aus Schema + UI-Optionen zurückgewinnen; sie steuert,
  // welche Prüfungen überhaupt angeboten werden.
  const uiOptionen = uiSchema.elements.find(
    (el) => el.type === 'Control' && el.scope === selectedScope,
  )?.options;
  const feldtypId = ermittleFeldtyp(fieldDef as FeldSchema, uiOptionen)?.id;
  const passende = filtereValidatoren(validators, feldtypId);

  // Bereits gesetzte Prüfungen bleiben sichtbar, auch wenn sie nach einem
  // Typwechsel nicht mehr passen — sonst verschwände eine gesetzte Prüfung
  // unbemerkt aus der Oberfläche, ohne aus dem Schema zu verschwinden.
  const sichtbar = validators.filter(
    (v) => passende.includes(v) || current.includes(v.id),
  );

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
    // Bestehenden Zustand übernehmen und nur das Geänderte überschreiben —
    // eine Aufzählung der Felder verlöre bei jedem neuen State-Feld etwas.
    dispatch(
      createSetFieldStateAction({ ...fieldState, schema: updatedSchema }),
    );
  };

  if (loading) {
    return (
      <Box sx={{ py: 1, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={16} />
      </Box>
    );
  }
  if (sichtbar.length === 0) {
    return (
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {validators.length === 0
          ? t.properties.keineValidatoren
          : t.properties.keinePassendenValidatoren}
      </Typography>
    );
  }

  return (
    <Box>
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
      {sichtbar.map((v) => (
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
