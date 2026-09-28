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

import { useRegion } from '../../erweiterung/ErweiterungenProvider';
import { useI18n } from '../../i18n';
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
  const { t } = useI18n();
  const m = t.metadaten;
  const region = useRegion();
  const rechtsgrundlageNoetig =
    region?.pruefRegeln?.includes('formular-ohne-rechtsgrundlage') ?? false;
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
        {m.titel}
      </DialogTitle>
      <Divider />

      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}
      >
        {/* Basis */}
        <TextField
          label={m.formularTitel}
          value={meta.title ?? ''}
          onChange={(e) => set('title', e.target.value)}
          size="small"
          fullWidth
          helperText={m.formularTitelHinweis}
          inputProps={{ 'aria-required': 'true' }}
        />

        <TextField
          label={m.beschreibung}
          value={meta.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          size="small"
          fullWidth
          multiline
          minRows={2}
          helperText={m.beschreibungHinweis}
        />

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            label={m.urn}
            value={urn}
            onChange={(e) => set('id', e.target.value)}
            size="small"
            fullWidth
            error={urnInvalid}
            placeholder={m.urnPlatzhalter}
            helperText={urnInvalid ? m.urnFehler : m.urnHinweis}
            slotProps={{ htmlInput: { spellCheck: false } }}
          />
          <Tooltip title={m.urnVorschlag}>
            <span>
              <IconButton
                aria-label={m.urnVorschlag}
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
            {m.abschnittHerausgeber}
          </Typography>
        </Divider>

        {/* Behörde */}
        <TextField
          label={m.herausgeber}
          value={meta.publisher ?? ''}
          onChange={(e) => set('publisher', e.target.value)}
          size="small"
          fullWidth
          placeholder={m.herausgeberPlatzhalter}
          helperText={m.herausgeberHinweis}
        />

        {/* Die Rechtsgrundlage ist ein Begriff des deutschen
            Verwaltungsrechts. Sie steht nur da, wenn das Regionsprofil sie
            verlangt (ADR 0007) — sonst ist sie ein Feld ohne Bedeutung. */}
        {rechtsgrundlageNoetig && (
          <TextField
            label={m.rechtsgrundlage}
            value={meta.legalBasis ?? ''}
            onChange={(e) => set('legalBasis', e.target.value)}
            size="small"
            fullWidth
            placeholder={m.rechtsgrundlagePlatzhalter}
            helperText={m.rechtsgrundlageHinweis}
          />
        )}

        <Divider>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {m.abschnittVersion}
          </Typography>
        </Divider>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label={m.version}
            value={meta.version ?? ''}
            onChange={(e) => set('version', e.target.value)}
            size="small"
            fullWidth
            placeholder={m.versionPlatzhalter}
            helperText={m.versionHinweis}
          />
          <TextField
            label={m.gueltigAb}
            value={meta.validFrom ?? ''}
            onChange={(e) => set('validFrom', e.target.value)}
            size="small"
            fullWidth
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={m.sprache}
            value={meta.language ?? 'de'}
            onChange={(e) => set('language', e.target.value)}
            size="small"
            select
            sx={{ minWidth: 110 }}
          >
            <MenuItem value="de">{m.sprachen.de}</MenuItem>
            <MenuItem value="en">{m.sprachen.en}</MenuItem>
          </TextField>
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          {t.dialog.cancel}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!meta.title?.trim() || urnInvalid}
        >
          {t.dialog.speichern}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
