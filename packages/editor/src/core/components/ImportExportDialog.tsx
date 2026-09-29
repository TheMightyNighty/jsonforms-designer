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
import { useMemo, useRef, useState } from 'react';

import { useRegion } from '../../erweiterung/ErweiterungenProvider';
import { useI18n } from '../../i18n';
import { FieldAwareState } from '../model/addFieldReducer';
import { emptyManifestMeta } from '../model/manifestMeta';
import { FlatElement, fromLegacy, UiElement } from '../model/uiElements';
import { hasLegacySchemaMetadata } from '../util/legacyMetadataMigration';
import { missingManifestFields, serializeOfmExport } from '../util/ofmExport';
import { sanitizeParsedJson } from '../util/sanitizeJson';
import { fuelleVorlage } from '../util/textVorlage';
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
  const region = useRegion();

  // Die Reiter stehen in einer Liste statt an festen Indizes: OFM und XDF
  // sind Standards der deutschen Verwaltung und nur da, wenn das
  // Regionsprofil sie nennt (ADR 0007).
  const reiter = useMemo(() => {
    const formate = region?.exportformate ?? [];
    return [
      { id: 'schema' as const, label: t.dialog.schemaTab },
      { id: 'uischema' as const, label: t.dialog.uiSchemaTab },
      ...(formate.includes('ofm')
        ? [{ id: 'ofm' as const, label: 'OFM 1.0' }]
        : []),
      ...(formate.includes('xdf')
        ? [{ id: 'xdf' as const, label: 'XDF 2.0' }]
        : []),
      { id: 'import' as const, label: t.dialog.importTab },
    ];
  }, [region, t]);
  const [tab, setTab] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [migrationNotice, setMigrationNotice] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Schaltet ein Profil einen Reiter ab, während er gewählt ist, fällt die
  // Anzeige auf den letzten vorhandenen zurück statt ins Leere.
  const aktiv = reiter[Math.min(tab, reiter.length - 1)].id;

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
            typvorschlagIgnoriert: {},
            sectionColors: parsed.sectionColors ?? {},
            manifestMeta: parsed.manifestMeta ?? { ...emptyManifestMeta },
          });
          setImportError(null);
          onClose();
        } else {
          setImportError(t.dialog.importError);
        }
      } catch {
        setImportError(t.dialog.invalidJson);
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
          <Tabs
            value={Math.min(tab, reiter.length - 1)}
            onChange={(_, v) => setTab(v)}
            sx={{ mb: 1 }}
          >
            {reiter.map((r) => (
              <Tab key={r.id} label={r.label} />
            ))}
          </Tabs>

          {aktiv === 'schema' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadJson(fieldState.schema, 'schema.json')}
                >
                  {t.dialog.download}
                </Button>
              </Box>
              <FormattedJson object={fieldState.schema} />
            </Box>
          )}
          {aktiv === 'uischema' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() =>
                    downloadJson(exportedUiSchema, 'ui-schema.json')
                  }
                >
                  {t.dialog.download}
                </Button>
              </Box>
              <FormattedJson object={exportedUiSchema} />
            </Box>
          )}
          {aktiv === 'ofm' && (
            <Box
              sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <Alert severity="info" icon={<VerifiedIcon fontSize="inherit" />}>
                {t.dialog.ofmHinweis}
              </Alert>
              {ofmMissing.length > 0 && (
                <Alert severity="warning">
                  {fuelleVorlage(t.dialog.ofmFehlend, {
                    felder: ofmMissing.join(', '),
                  })}
                </Alert>
              )}
              <Box>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  disabled={ofmMissing.length > 0}
                  onClick={() => void downloadOfmPackage()}
                >
                  {t.dialog.ofmHerunterladen}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {t.dialog.ofmFussnote}
              </Typography>
            </Box>
          )}
          {aktiv === 'xdf' && (
            <Box
              sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <Alert severity="info">{t.dialog.xdfHinweis}</Alert>
              <Box>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadXdf(fieldState)}
                >
                  {t.dialog.xdfHerunterladen}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {t.dialog.xdfFussnote}
              </Typography>
            </Box>
          )}
          {aktiv === 'import' && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t.dialog.importHint}
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
                {t.dialog.selectFile}
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
          {t.dialog.migrationHinweis}
        </Alert>
      </Snackbar>
    </>
  );
}
