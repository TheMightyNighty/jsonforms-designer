/**
 * Übersetzungseditor für Formularfelder.
 *
 * Speichert Übersetzungen in schema['x-translations']:
 *   { "en": { "properties": { "vorname": { "title": "First name" } } },
 *     "fr": { ... } }
 */
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Dispatch, useState } from 'react';

import { EditorAction } from '../core/model/actions';
import { createSetFormMetadataAction } from '../core/model/addFieldActions';
import { FieldAwareState } from '../core/model/addFieldReducer';
import { propertyKeyFromScope } from './fieldPropertiesActions';

const SUPPORTED_LANGS: Array<{ code: string; name: string }> = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'pl', name: 'Polski' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ar', name: 'العربية' },
  { code: 'uk', name: 'Українська' },
];

interface FieldTranslation {
  title?: string;
  description?: string;
  placeholder?: string;
}

type Translations = Record<
  string,
  { properties: Record<string, FieldTranslation> }
>;

function getTranslations(schema: FieldAwareState['schema']): Translations {
  return (
    ((schema as Record<string, unknown>)['x-translations'] as Translations) ??
    {}
  );
}

interface TranslationEditorProps {
  selectedScope: string;
  schema: FieldAwareState['schema'];
  dispatch: Dispatch<EditorAction>;
}

export function TranslationEditor({
  selectedScope,
  schema,
  dispatch,
}: TranslationEditorProps) {
  const key = propertyKeyFromScope(selectedScope);
  const translations = getTranslations(schema);
  const usedLangs = Object.keys(translations);
  const available = SUPPORTED_LANGS.filter((l) => !usedLangs.includes(l.code));

  const [newLang, setNewLang] = useState('');

  function save(updated: Translations) {
    dispatch(createSetFormMetadataAction({ 'x-translations': updated }));
  }

  function setFieldTrans(
    lang: string,
    field: keyof FieldTranslation,
    value: string,
  ) {
    const next: Translations = {
      ...translations,
      [lang]: {
        ...translations[lang],
        properties: {
          ...(translations[lang]?.properties ?? {}),
          [key]: {
            ...(translations[lang]?.properties?.[key] ?? {}),
            [field]: value,
          },
        },
      },
    };
    save(next);
  }

  function addLang() {
    if (!newLang) return;
    const next: Translations = {
      ...translations,
      [newLang]: { properties: { [key]: {} } },
    };
    save(next);
    setNewLang('');
  }

  function removeLang(lang: string) {
    const { [lang]: _removed, ...rest } = translations;
    save(rest);
  }

  return (
    <Box>
      <Divider sx={{ mb: 2 }} />
      <Typography
        variant="subtitle2"
        sx={{ color: 'text.secondary', fontWeight: 600, mb: 1.5 }}
      >
        Übersetzungen
      </Typography>

      {/* Vorhandene Sprachen */}
      {usedLangs.map((lang) => {
        const label =
          SUPPORTED_LANGS.find((l) => l.code === lang)?.name ??
          lang.toUpperCase();
        const ft = translations[lang]?.properties?.[key] ?? {};
        return (
          <Box
            key={lang}
            sx={{
              mb: 2,
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip
                label={lang.toUpperCase()}
                size="small"
                sx={{ fontWeight: 700, mr: 0.5 }}
              />
              <Typography
                variant="caption"
                sx={{ flex: 1, color: 'text.secondary' }}
              >
                {label}
              </Typography>
              <Tooltip title="Sprache entfernen">
                <IconButton size="small" onClick={() => removeLang(lang)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                label="Label"
                value={ft.title ?? ''}
                onChange={(e) => setFieldTrans(lang, 'title', e.target.value)}
              />
              <TextField
                size="small"
                fullWidth
                label="Hinweistext"
                multiline
                minRows={1}
                value={ft.description ?? ''}
                onChange={(e) =>
                  setFieldTrans(lang, 'description', e.target.value)
                }
              />
              <TextField
                size="small"
                fullWidth
                label="Platzhalter"
                value={ft.placeholder ?? ''}
                onChange={(e) =>
                  setFieldTrans(lang, 'placeholder', e.target.value)
                }
              />
            </Box>
          </Box>
        );
      })}

      {/* Sprache hinzufügen */}
      {available.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Sprache hinzufügen</InputLabel>
            <Select
              label="Sprache hinzufügen"
              value={newLang}
              onChange={(e) => setNewLang(e.target.value)}
            >
              {available.map((l) => (
                <MenuItem key={l.code} value={l.code}>
                  {l.name} ({l.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={addLang}
            disabled={!newLang}
          >
            Hinzufügen
          </Button>
        </Box>
      )}

      {usedLangs.length === 0 && available.length === 0 && (
        <Typography variant="caption" color="text.disabled">
          Alle verfügbaren Sprachen bereits hinzugefügt.
        </Typography>
      )}
    </Box>
  );
}
