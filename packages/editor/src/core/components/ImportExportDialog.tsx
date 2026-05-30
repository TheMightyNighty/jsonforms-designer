import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/CloudDownload';
import UploadIcon from '@mui/icons-material/Upload';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent,
  DialogTitle, Tab, Tabs, Typography,
} from '@mui/material';
import { useRef, useState } from 'react';

import { FieldAwareState } from '../model/addFieldReducer';
import { useI18n } from '../../i18n';
import { FlatElement, fromLegacy, toLegacy } from '../model/uiElements';
import { FormattedJson } from './Formatted';

interface ImportExportDialogProps {
  open: boolean;
  onClose: () => void;
  fieldState: FieldAwareState;
  onImport: (state: FieldAwareState) => void;
}

/** Baut aus fieldState ein reines JSONForms-uiSchema (ohne interne IDs) */
function buildExportUiSchema(fieldState: FieldAwareState): object {
  const elements = fieldState.uiSchema.elements as FlatElement[];

  function convert(el: FlatElement): object | null {
    if (!el) return null;
    if (el.type === 'ColumnContainer' && el.columns) {
      return {
        type: 'HorizontalLayout',
        elements: el.columns.map((col) => ({
          type: 'VerticalLayout',
          elements: col.map(convert).filter(Boolean),
        })),
      };
    }
    if (el.type === 'GroupContainer' && (el.children || el.elements)) {
      const kids = (el.children ?? el.elements ?? []).map(convert).filter(Boolean);
      return { type: 'Group', label: el.label ?? '', elements: kids };
    }
    if (el.type === 'Label') {
      return { type: 'Label', text: el.label ?? '' };
    }
    if (el.type === 'Control' && el.scope) {
      const { id: _id, ...rest } = el as any;
      return rest;
    }
    return null;
  }

  return { type: 'VerticalLayout', elements: elements.map(convert).filter(Boolean) };
}

/** Baut aus einem importierten uiSchema einen fieldState-kompatiblen uiSchema-Eintrag */
function buildImportElements(uiSchemaRaw: any): FlatElement[] {
  const elements = uiSchemaRaw?.elements ?? (Array.isArray(uiSchemaRaw) ? uiSchemaRaw : []);
  return elements.map((el: any) => {
    const converted = fromLegacy(el);
    return toLegacy(converted) as FlatElement;
  });
}

export function ImportExportDialog({ open, onClose, fieldState, onImport }: ImportExportDialogProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportedUiSchema = buildExportUiSchema(fieldState);

  const downloadJson = (obj: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed?.schema && parsed?.uiSchema) {
          const importedElements = buildImportElements(parsed.uiSchema);
          onImport({
            schema: parsed.schema,
            uiSchema: { type: 'VerticalLayout', elements: importedElements },
            tabs: parsed.tabs ?? [],
            activeTabIndex: parsed.activeTabIndex ?? 0,
            tabAssignments: parsed.tabAssignments ?? {},
            lineNumbersEnabled: false,
            sectionColors: {},
          });
          setImportError(null);
          onClose();
        } else {
          setImportError('Ungültiges Format. Erwartet: { schema, uiSchema }');
        }
      } catch {
        setImportError('Ungültige JSON-Datei.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t.dialog.exportTitle}</DialogTitle>
      <DialogContent sx={{ height: '60vh' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab label={t.dialog.schemaTab} />
          <Tab label={t.dialog.uiSchemaTab} />
          <Tab label={t.dialog.importTab} />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button size="small" startIcon={<DownloadIcon />}
                onClick={() => downloadJson(fieldState.schema, 'schema.json')}>
                Herunterladen
              </Button>
            </Box>
            <FormattedJson object={fieldState.schema} />
          </Box>
        )}
        {tab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button size="small" startIcon={<DownloadIcon />}
                onClick={() => downloadJson(exportedUiSchema, 'ui-schema.json')}>
                Herunterladen
              </Button>
            </Box>
            <FormattedJson object={exportedUiSchema} />
          </Box>
        )}
        {tab === 2 && (
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              JSON-Datei hochladen mit <code>schema</code> und <code>uiSchema</code>.
              Das aktuelle Formular wird überschrieben.
            </Typography>
            {importError && <Alert severity="error" sx={{ mb: 2 }}>{importError}</Alert>}
            <input ref={fileRef} type="file" accept=".json,application/json"
              style={{ display: 'none' }} onChange={handleFileChange} />
            <Button variant="outlined" startIcon={<UploadIcon />}
              onClick={() => fileRef.current?.click()}>
              JSON-Datei auswählen
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button startIcon={<CancelIcon />} onClick={onClose}>{t.dialog.close}</Button>
      </DialogActions>
    </Dialog>
  );
}
