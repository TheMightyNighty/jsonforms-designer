import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { FormMetadata } from '../model/addFieldActions';
import { FieldAwareState } from '../model/addFieldReducer';
import {
  FormManifestMeta,
  isValidFormUrn,
  suggestFormUrn,
} from '../model/manifestMeta';

interface MetadataDialogProps {
  open: boolean;
  onClose: () => void;
  schema: FieldAwareState['schema'];
  manifestMeta: FormManifestMeta;
  onSave: (meta: FormMetadata) => void;
}

function readMeta(
  schema: FieldAwareState['schema'],
  manifestMeta: FormManifestMeta,
): FormMetadata {
  const s = schema as Record<string, unknown>;
  return {
    title: String(s.title ?? ''),
    description: String(s.description ?? ''),
    id: manifestMeta.id,
    publisher: manifestMeta.publisher,
    legalBasis: manifestMeta.legalBasis,
    version: manifestMeta.version,
    validFrom: manifestMeta.validFrom,
    language: manifestMeta.language || 'de',
  };
}

export function MetadataDialog({
  open,
  onClose,
  schema,
  manifestMeta,
  onSave,
}: MetadataDialogProps) {
  const [meta, setMeta] = useState<FormMetadata>(
    readMeta(schema, manifestMeta),
  );

  useEffect(() => {
    if (open) setMeta(readMeta(schema, manifestMeta));
  }, [open, schema, manifestMeta]);

  function set(key: keyof FormMetadata, value: string) {
    setMeta((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    onSave(meta);
    onClose();
  }

  const urn = String(meta.id ?? '');
  const urnInvalid = urn.trim() !== '' && !isValidFormUrn(urn.trim());

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="metadata-title"
    >
      <DialogTitle id="metadata-title" sx={{ fontWeight: 700, pb: 1 }}>
        Formular-Metadaten
      </DialogTitle>
      <Divider />

      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}
      >
        {/* Basis */}
        <TextField
          label="Formular-Titel *"
          value={meta.title ?? ''}
          onChange={(e) => set('title', e.target.value)}
          size="small"
          fullWidth
          helperText="Erscheint als Überschrift im Formular (schema.title)"
          inputProps={{ 'aria-required': 'true' }}
        />

        <TextField
          label="Beschreibung / Zweck"
          value={meta.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          size="small"
          fullWidth
          multiline
          minRows={2}
          helperText="Kurze Beschreibung des Antragsvorgangs"
        />

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            label="Formular-ID (URN)"
            value={urn}
            onChange={(e) => set('id', e.target.value)}
            size="small"
            fullWidth
            error={urnInvalid}
            placeholder="urn:de:bonn:formular:bewohnerparkausweis"
            helperText={
              urnInvalid
                ? 'Muster: urn:<namensraum>:<rest>, z. B. urn:de:bonn:formular:bewohnerparkausweis'
                : 'Stabile Formular-ID über alle Versionen (Manifest form.id)'
            }
            slotProps={{ htmlInput: { spellCheck: false } }}
          />
          <Tooltip title="URN-Vorschlag aus Behörde und Titel erzeugen">
            <span>
              <IconButton
                aria-label="URN-Vorschlag erzeugen"
                onClick={() =>
                  set(
                    'id',
                    suggestFormUrn(
                      String(meta.publisher ?? ''),
                      String(meta.title ?? ''),
                    ),
                  )
                }
                sx={{ mt: 0.25 }}
              >
                <AutoFixHighIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <Divider>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Behördeninformationen
          </Typography>
        </Divider>

        {/* Behörde */}
        <TextField
          label="Herausgebende Behörde"
          value={meta.publisher ?? ''}
          onChange={(e) => set('publisher', e.target.value)}
          size="small"
          fullWidth
          placeholder="z. B. Bundesagentur für Arbeit"
          helperText="Wird im Manifest als form.publisher geführt"
        />

        <TextField
          label="Rechtsgrundlage"
          value={meta.legalBasis ?? ''}
          onChange={(e) => set('legalBasis', e.target.value)}
          size="small"
          fullWidth
          placeholder="z. B. § 16 SGB II, OZG-Leistungs-ID 99001234"
          helperText="Wird im Manifest als form.legalBasis geführt"
        />

        <Divider>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Versionierung
          </Typography>
        </Divider>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Version"
            value={meta.version ?? ''}
            onChange={(e) => set('version', e.target.value)}
            size="small"
            fullWidth
            placeholder="z. B. 1.0.0"
            helperText="SemVer"
          />
          <TextField
            label="Gültig ab"
            value={meta.validFrom ?? ''}
            onChange={(e) => set('validFrom', e.target.value)}
            size="small"
            fullWidth
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Sprache"
            value={meta.language ?? 'de'}
            onChange={(e) => set('language', e.target.value)}
            size="small"
            select
            sx={{ minWidth: 110 }}
          >
            <MenuItem value="de">Deutsch</MenuItem>
            <MenuItem value="en">Englisch</MenuItem>
          </TextField>
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Abbrechen
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!meta.title?.trim() || urnInvalid}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
