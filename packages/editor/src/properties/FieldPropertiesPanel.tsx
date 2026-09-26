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
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Dispatch, useEffect, useState } from 'react';

import { useEditorContext } from '../core/context';
import { EditorAction } from '../core/model/actions';
import { createIgnoriereTypvorschlagAction } from '../core/model/addFieldActions';
import { FieldAwareState } from '../core/model/addFieldReducer';
import { UiElement } from '../core/model/uiElements';
import {
  ermittleFeldtyp,
  FeldSchema,
  feldtypLabel,
  kompatibleFeldtypen,
} from '../field-types/feldtypErkennung';
import { vorschlagWeichtAb } from '../field-types/feldtypVorschlag';
import { useI18n } from '../i18n';
import { ConditionEditor } from './ConditionEditor';
import { EnumEditor } from './EnumEditor';
import {
  createChangeFieldTypeAction,
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
  /** Fachsprachliche Art des Feldes für die Anzeige, z. B. „Datum". */
  feldtyp: string;
  /** Katalog-id der erkannten Art, falls eine Regel gegriffen hat. */
  feldtypId: string | undefined;
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
    // Fachsprachliche Art des Feldes (Datum, IBAN, Ja/Nein …) statt des
    // JSON-Basistyps — siehe feldtypErkennung.
    feldtyp: feldtypLabel(fieldSchema as FeldSchema, control?.options),
    feldtypId: ermittleFeldtyp(fieldSchema as FeldSchema, control?.options)?.id,
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
// Art des Feldes (anzeigen und wechseln)
// ---------------------------------------------------------------------------

interface FeldtypAuswahlProps {
  selectedScope: string;
  feldtypId: string | undefined;
  feldtypLabel: string;
  dispatch: Dispatch<EditorAction>;
}

/**
 * Zeigt die Art des Feldes in Fachsprache und erlaubt den Wechsel innerhalb
 * derselben Art von Antwort (Text ↔ E-Mail ↔ Telefonnummer). Gibt es keine
 * Alternative oder ist die Art nicht erkennbar (Fremdimport), steht hier nur
 * der Text.
 */
function FeldtypAuswahl({
  selectedScope,
  feldtypId,
  feldtypLabel: label,
  dispatch,
}: FeldtypAuswahlProps) {
  const { t } = useI18n();
  const alternativen = feldtypId ? kompatibleFeldtypen(feldtypId) : [];

  if (!feldtypId || alternativen.length < 2) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t.properties.feldtyp}:
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
      </Box>
    );
  }

  return (
    <TextField
      select
      size="small"
      fullWidth
      label={t.properties.feldtyp}
      value={feldtypId}
      onChange={(e) =>
        dispatch(createChangeFieldTypeAction(selectedScope, e.target.value))
      }
      helperText={t.properties.feldtypWechselHinweis}
      // aria-label gehört an das Select selbst (role="combobox"); über
      // inputProps landete es am versteckten nativen Input.
      SelectProps={{ 'aria-label': t.properties.feldtypWechseln }}
    >
      {alternativen.map((ft) => (
        <MenuItem key={ft.id} value={ft.id}>
          {ft.displayName}
        </MenuItem>
      ))}
    </TextField>
  );
}

// ---------------------------------------------------------------------------
// Typvorschlag aus der Bezeichnung
// ---------------------------------------------------------------------------

interface TypvorschlagHinweisProps {
  selectedScope: string;
  label: string;
  feldtypId: string | undefined;
  dispatch: Dispatch<EditorAction>;
}

/**
 * Nicht blockierender Hinweis, wenn die Bezeichnung einen anderen Feldtyp
 * nahelegt als den gewählten („Geburtsdatum" als Textfeld). „Übernehmen"
 * wechselt den Typ, „Ignorieren" merkt die Entscheidung für dieses Feld.
 *
 * Führt der Vorschlag über eine Basistypgrenze (Text → Ganzzahl), wird er
 * erklärt, aber nicht angeboten — derselbe vorsichtige Default wie beim
 * Typwechsel im Reiter „Inhalt" (siehe kompatibleFeldtypen).
 */
function TypvorschlagHinweis({
  selectedScope,
  label,
  feldtypId,
  dispatch,
}: TypvorschlagHinweisProps) {
  const { t } = useI18n();
  const { fieldState } = useEditorContext();

  if (fieldState.typvorschlagIgnoriert[selectedScope]) return null;
  const vorschlag = vorschlagWeichtAb(label, feldtypId);
  if (!vorschlag) return null;

  const wechselMoeglich =
    feldtypId !== undefined &&
    kompatibleFeldtypen(feldtypId).some((f) => f.id === vorschlag.feldtypId);

  return (
    <Alert
      severity="info"
      variant="outlined"
      data-testid="typvorschlag-hinweis"
      action={
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {wechselMoeglich && (
            <Button
              size="small"
              onClick={() =>
                dispatch(
                  createChangeFieldTypeAction(
                    selectedScope,
                    vorschlag.feldtypId,
                  ),
                )
              }
            >
              {t.properties.vorschlag.uebernehmen}
            </Button>
          )}
          <Button
            size="small"
            color="inherit"
            onClick={() =>
              dispatch(createIgnoriereTypvorschlagAction(selectedScope, true))
            }
          >
            {t.properties.vorschlag.ignorieren}
          </Button>
        </Box>
      }
    >
      <Typography variant="body2">
        {t.properties.vorschlag.text
          .replace('{ausloeser}', vorschlag.ausloeser)
          .replace('{vorschlag}', vorschlag.feldtypName)}
      </Typography>
      {!wechselMoeglich && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t.properties.vorschlag.nichtMoeglich}
        </Typography>
      )}
    </Alert>
  );
}

// ---------------------------------------------------------------------------
// Haupt-Komponente
// ---------------------------------------------------------------------------

/**
 * Reiter-Reihenfolge nach ADR 0002. Die Beschriftungen kommen aus i18n; die
 * Reihenfolge folgt dem Arbeitsablauf: erst schreiben, dann prüfen lassen,
 * dann Sonderfälle, zuletzt übersetzen.
 */
const TAB_KEYS = ['inhalt', 'pruefung', 'bedingungen', 'uebersetzung'] as const;

export function FieldPropertiesPanel({
  selectedScope,
  schema,
  uiSchema,
  dispatch,
}: FieldPropertiesPanelProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState(0);

  // Tab-Auswahl je Feld zurücksetzen — sonst bliebe man beim Wechsel zu
  // einem anderen Feld z. B. auf "Übersetzung" stehen.
  useEffect(() => {
    setTab(0);
  }, [selectedScope]);

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
    <Box role="form" aria-label="Feldeigenschaften">
      <Typography
        variant="subtitle2"
        sx={{ color: 'text.secondary', fontWeight: 500, px: 2, pt: 2 }}
      >
        Feldeigenschaften
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ px: 1, minHeight: 36 }}
      >
        {TAB_KEYS.map((key) => (
          <Tab
            key={key}
            label={t.properties.tabs[key]}
            sx={{ minHeight: 36, py: 0.5 }}
          />
        ))}
      </Tabs>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tab === 0 && (
          <>
            <FeldtypAuswahl
              selectedScope={selectedScope}
              feldtypId={values.feldtypId}
              feldtypLabel={values.feldtyp}
              dispatch={dispatch}
            />

            <TypvorschlagHinweis
              selectedScope={selectedScope}
              label={values.label}
              feldtypId={values.feldtypId}
              dispatch={dispatch}
            />

            <TextField
              label="Label"
              value={values.label}
              onChange={(e) => update('label', e.target.value)}
              size="small"
              fullWidth
              inputProps={{ 'aria-label': 'Label des Feldes' }}
            />

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

            <Divider />

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

            {values.hasEnum && (
              <EnumEditor
                selectedScope={selectedScope}
                schema={schema}
                dispatch={dispatch}
              />
            )}
          </>
        )}

        {tab === 1 && (
          <ValidatorSection
            selectedScope={selectedScope}
            schema={schema}
            uiSchema={uiSchema}
            dispatch={dispatch}
          />
        )}

        {tab === 2 && (
          <ConditionEditor
            selectedScope={selectedScope}
            schema={schema}
            uiSchema={uiSchema}
            dispatch={dispatch}
          />
        )}

        {tab === 3 && (
          <TranslationEditor
            selectedScope={selectedScope}
            schema={schema}
            dispatch={dispatch}
          />
        )}
      </Box>
    </Box>
  );
}
