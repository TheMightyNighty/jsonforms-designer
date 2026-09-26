import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/CloudDownload';
import UploadIcon from '@mui/icons-material/Upload';
import VerifiedIcon from '@mui/icons-material/Verified';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';

import { useI18n } from '../../i18n';
import { FieldAwareState } from '../model/addFieldReducer';
import { emptyManifestMeta } from '../model/manifestMeta';
import { FlatElement, fromLegacy, UiElement } from '../model/uiElements';
import { hasLegacySchemaMetadata } from '../util/legacyMetadataMigration';
import { missingManifestFields, serializeOfmExport } from '../util/ofmExport';
import { sanitizeParsedJson } from '../util/sanitizeJson';
import { downloadXdf } from '../util/xdfExport';
import { buildStoredZip } from '../util/zipStored';
import { FormattedJson } from './Formatted';

interface ImportExportDialogProps {
  open: boolean;
  onClose: () => void;
  fieldState: FieldAwareState;
  onImport: (state: FieldAwareState) => void;
}

/** Baut aus fieldState ein reines JSONForms-uiSchema (ohne interne IDs) */
function buildExportUiSchema(fieldState: FieldAwareState): object {
  const elements = fieldState.uiSchema.elements;

  function convert(el: UiElement): object | null {
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
    if (el.type === 'GroupContainer') {
      const kids = el.children.map(convert).filter(Boolean);
      return { type: 'Group', label: el.label, elements: kids };
    }
    if (el.type === 'Label') {
      return { type: 'Label', text: el.label ?? '' };
    }
    if (el.type === 'Control' && el.scope) {
      const { id: _id, ...rest } = el;
      return rest;
    }
    return null;
  }

  return {
    type: 'VerticalLayout',
    elements: elements.map(convert).filter(Boolean),
  };
}

/** Baut aus einem importierten uiSchema einen fieldState-kompatiblen uiSchema-Eintrag */
function buildImportElements(uiSchemaRaw: unknown): UiElement[] {
  const raw = uiSchemaRaw as { elements?: unknown[] };
  const elements: unknown[] =
    raw?.elements ?? (Array.isArray(uiSchemaRaw) ? uiSchemaRaw : []);
  return elements.map((el) => fromLegacy(el as FlatElement));
}

export function ImportExportDialog({
  open,
  onClose,
  fieldState,
  onImport,
}: ImportExportDialogProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [migrationNotice, setMigrationNotice] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportedUiSchema = buildExportUiSchema(fieldState);
  const ofmMissing = missingManifestFields(fieldState);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = (obj: unknown, filename: string) => {
    downloadBlob(
      new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }),
      filename,
    );
  };

  const downloadOfmPackage = async () => {
    const { files } = await serializeOfmExport(fieldState);
    const zip = buildStoredZip(files);
    const baseName =
      fieldState.manifestMeta.id.split(':').filter(Boolean).pop() ?? 'formular';
    downloadBlob(
      new Blob([zip.slice().buffer], { type: 'application/zip' }),
      `${baseName}.ofm.zip`,
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = sanitizeParsedJson(
          JSON.parse(ev.target?.result as string),
        );
        const uiSchemaRaw = parsed?.uiSchema ?? parsed?.uischema;
        if (parsed?.schema && uiSchemaRaw) {
          const importedElements = buildImportElements(uiSchemaRaw);
          if (hasLegacySchemaMetadata(parsed.schema)) {
            // OFM-R-304: Alt-Metadaten ziehen beim Laden ins Manifest um
            // (Migration im Reducer); der Toast macht den Umzug sichtbar.
            setMigrationNotice(true);
          }
          onImport({
            schema: parsed.schema,
            uiSchema: { type: 'VerticalLayout', elements: importedElements },
            tabs: parsed.tabs ?? [],
            activeTabIndex: parsed.activeTabIndex ?? 0,
            tabAssignments: parsed.tabAssignments ?? {},
            lineNumbersEnabled: false,
            sectionColors: parsed.sectionColors ?? {},
            manifestMeta: parsed.manifestMeta ?? { ...emptyManifestMeta },
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
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{t.dialog.exportTitle}</DialogTitle>
        <DialogContent sx={{ height: '60vh' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
            <Tab label={t.dialog.schemaTab} />
            <Tab label={t.dialog.uiSchemaTab} />
            <Tab label="OFM 1.0" />
            <Tab label="XDF 2.0" />
            <Tab label={t.dialog.importTab} />
          </Tabs>

          {tab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadJson(fieldState.schema, 'schema.json')}
                >
                  Herunterladen
                </Button>
              </Box>
              <FormattedJson object={fieldState.schema} />
            </Box>
          )}
          {tab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() =>
                    downloadJson(exportedUiSchema, 'ui-schema.json')
                  }
                >
                  Herunterladen
                </Button>
              </Box>
              <FormattedJson object={exportedUiSchema} />
            </Box>
          )}
          {tab === 2 && (
            <Box
              sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <Alert severity="info" icon={<VerifiedIcon fontSize="inherit" />}>
                Exportiert das Formular als <strong>OFM-Paket</strong> (Offenes
                Formularmodell 1.0, Konformitätsklasse A): ein ZIP mit{' '}
                <code>form.manifest.json</code>, <code>schema.json</code> und{' '}
                <code>uischema.json</code>. Die Artefakt-Hashes (SHA-256) werden
                über die exportierten Dateien berechnet.
              </Alert>
              {ofmMissing.length > 0 && (
                <Alert severity="warning">
                  Für ein gültiges Manifest fehlen folgende Angaben (Dialog
                  „Formular-Metadaten"): {ofmMissing.join(', ')}
                </Alert>
              )}
              <Box>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  disabled={ofmMissing.length > 0}
                  onClick={() => void downloadOfmPackage()}
                >
                  OFM-Paket (ZIP) herunterladen
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Interne Editor-Optionen (Platzhalter, Varianten, Freitextfarben)
                werden nicht exportiert; Abschnittsfarben werden als
                ofm:sectionColor-Token, Spaltenbreiten als ofm:width (1–12)
                geschrieben.
              </Typography>
            </Box>
          )}
          {tab === 3 && (
            <Box
              sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <Alert severity="info">
                Exportiert das Formular als{' '}
                <strong>XDatenfelder 2.0 (XDF2)</strong> — dem bundesweit
                gültigen Standard für FIM-Bausteine. Die XML-Datei kann in
                FIM-Portal-kompatible Systeme importiert werden.
              </Alert>
              <Box>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadXdf(fieldState)}
                >
                  XDF 2.0 herunterladen
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Enthält: alle Datenfelder des Formulars, Metadaten (Titel,
                Behörde, Rechtsgrundlage), Datentypen und Einschränkungen.
                FIM-Identifier (x-fim-id) werden übernommen.
              </Typography>
            </Box>
          )}
          {tab === 4 && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                JSON-Datei hochladen mit <code>schema</code> und{' '}
                <code>uiSchema</code>. Das aktuelle Formular wird überschrieben.
              </Typography>
              {importError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {importError}
                </Alert>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => fileRef.current?.click()}
              >
                JSON-Datei auswählen
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CancelIcon />} onClick={onClose}>
            {t.dialog.close}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={migrationNotice}
        autoHideDuration={8000}
        onClose={() => setMigrationNotice(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setMigrationNotice(false)}>
          Formular-Metadaten (x-publisher u. a.) wurden aus dem Schema in das
          Manifest übernommen (OFM-R-304). Beim nächsten Export sind sie Teil
          von form.manifest.json.
        </Alert>
      </Snackbar>
    </>
  );
}
