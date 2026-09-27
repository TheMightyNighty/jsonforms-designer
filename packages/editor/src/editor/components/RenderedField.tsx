import { JsonSchema7, UISchemaElement } from '@jsonforms/core';
import {
  materialCells,
  materialRenderers,
} from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { Box } from '@mui/material';

import { FieldAwareState } from '../../core/model/addFieldReducer';
import { jsonFormsI18n } from '../../core/util/jsonFormsI18n';
import { useI18n } from '../../i18n';

interface RenderedFieldProps {
  scope: string;
  schema: FieldAwareState['schema'];
  uiOptions?: Record<string, unknown>;
  testMode: boolean;
  data?: Record<string, unknown>;
  onDataChange?: (data: Record<string, unknown>) => void;
  /** Zusätzlich zum testMode-Interaktivitäts-Flag: rein visuell als deaktiviert markieren (DISABLE-Regel). */
  disabled?: boolean;
}

/**
 * Rendert ein einzelnes Control mit den echten JSONForms-Material-Renderern.
 * Außerhalb des Testen-Modus wird per pointerEvents:none verhindert, dass ins
 * Feld getippt werden kann — Klicks bubblen zur übergeordneten Zeile durch
 * (Feld-Selektion), ohne dass sich die Optik gegenüber einem echten,
 * ausgefüllten Formularfeld ändert (kein "disabled"-Grau wie beim
 * JsonForms-`readonly`-Prop).
 */
export function RenderedField({
  scope,
  schema,
  uiOptions,
  testMode,
  data,
  onDataChange,
  disabled = false,
}: RenderedFieldProps) {
  const { locale } = useI18n();
  const key = scope.replace(/^#\/properties\//, '');
  const fieldSchema = schema.properties?.[key];
  if (!fieldSchema) return null;

  const wrapperSchema: JsonSchema7 = {
    type: 'object',
    properties: { [key]: fieldSchema },
    required: schema.required?.includes(key) ? [key] : [],
  };
  const controlUiSchema: UISchemaElement = {
    type: 'Control',
    scope,
    options: uiOptions,
  } as UISchemaElement;

  return (
    <Box sx={{ pointerEvents: testMode && !disabled ? 'auto' : 'none' }}>
      <JsonForms
        schema={wrapperSchema}
        uischema={controlUiSchema}
        data={testMode ? (data ?? {}) : {}}
        renderers={materialRenderers}
        cells={materialCells}
        // Ohne das meldet AJV auf Englisch mitten im deutschen Formular.
        i18n={jsonFormsI18n(locale)}
        // Außerhalb des Testen-Modus ist das Formular noch leer und wurde
        // von niemandem "abgeschickt" — Pflichtfeld-Fehlermeldungen wären
        // hier irreführend (sähen aus wie ein kaputtes statt wie ein
        // unausgefülltes Formular).
        validationMode={testMode ? 'ValidateAndShow' : 'ValidateAndHide'}
        onChange={
          testMode
            ? ({ data: d }) => onDataChange?.(d)
            : () => {
                // Außerhalb des Testen-Modus rein visuell — keine Datenänderung.
              }
        }
      />
    </Box>
  );
}
