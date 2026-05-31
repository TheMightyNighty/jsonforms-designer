import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { FormMetadata } from '../model/addFieldActions';
import { FieldAwareState } from '../model/addFieldReducer';

interface MetadataDialogProps {
  open: boolean;
  onClose: () => void;
  schema: FieldAwareState['schema'];
  onSave: (meta: FormMetadata) => void;
}

function readMeta(schema: FieldAwareState['schema']): FormMetadata {
  const s = schema as any;
  return {
    title:       s.title       ?? '',
    description: s.description ?? '',
    publisher:   s['x-publisher']    ?? '',
    legalBasis:  s['x-legal-basis']  ?? '',
    version:     s['x-version']      ?? '',
    validFrom:   s['x-valid-from']   ?? '',
  };
}

export function MetadataDialog({ open, onClose, schema, onSave }: MetadataDialogProps) {
  const [meta, setMeta] = useState<FormMetadata>(readMeta(schema));

  useEffect(() => {
    if (open) setMeta(readMeta(schema));
  }, [open, schema]);

  function set(key: keyof FormMetadata, value: string) {
    setMeta((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    onSave(meta);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="metadata-title">
      <DialogTitle id="metadata-title" sx={{ fontWeight: 700, pb: 1 }}>
        Formular-Metadaten
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>

        {/* Basis */}
        <TextField
          label="Formular-Titel *"
          value={meta.title ?? ''}
          onChange={(e) => set('title', e.target.value)}
          size="small" fullWidth
          helperText="Erscheint als Überschrift im Formular (schema.title)"
          inputProps={{ 'aria-required': 'true' }}
        />

        <TextField
          label="Beschreibung / Zweck"
          value={meta.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          size="small" fullWidth multiline minRows={2}
          helperText="Kurze Beschreibung des Antragsvorgangs"
        />

        <Divider>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>Behördeninformationen</Typography>
        </Divider>

        {/* Behörde */}
        <TextField
          label="Herausgebende Behörde"
          value={meta.publisher ?? ''}
          onChange={(e) => set('publisher', e.target.value)}
          size="small" fullWidth
          placeholder="z. B. Bundesagentur für Arbeit"
          helperText="Wird als x-publisher im Schema gespeichert"
        />

        <TextField
          label="Rechtsgrundlage"
          value={meta.legalBasis ?? ''}
          onChange={(e) => set('legalBasis', e.target.value)}
          size="small" fullWidth
          placeholder="z. B. § 16 SGB II, OZG-Leistungs-ID 99001234"
          helperText="Wird als x-legal-basis im Schema gespeichert"
        />

        <Divider>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>Versionierung</Typography>
        </Divider>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Version"
            value={meta.version ?? ''}
            onChange={(e) => set('version', e.target.value)}
            size="small" fullWidth
            placeholder="z. B. 1.0.0"
          />
          <TextField
            label="Gültig ab"
            value={meta.validFrom ?? ''}
            onChange={(e) => set('validFrom', e.target.value)}
            size="small" fullWidth
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>

      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">Abbrechen</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!meta.title?.trim()}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
