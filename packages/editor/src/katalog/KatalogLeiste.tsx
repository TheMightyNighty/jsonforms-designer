import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ComponentType, useState, useSyncExternalStore } from 'react';

import { useDispatch, useFieldState } from '../core/context';
import { createSetFormMetadataAction } from '../core/model/addFieldActions';
import { fuelleVorlage } from '../core/util/textVorlage';
import { useI18n } from '../i18n';
import { KatalogFieldStateService, KatalogStand } from './katalogAblage';
import { KatalogFehler } from './katalogClient';

function heute(): string {
  const d = new Date();
  const zwei = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
}

/** Warum die Freigabe gesperrt ist, oder undefined, wenn sie möglich ist. */
export function freigabeSperre(
  stand: KatalogStand,
): 'keinRecht' | 'keinEntwurf' | 'vierAugen' | undefined {
  const f = stand.formular;
  if (!f?.rechte.freigabe) return 'keinRecht';
  if (!f.entwurf) return 'keinEntwurf';
  if (f.entwurf.bearbeitet_von === stand.ich?.sub) return 'vierAugen';
  return undefined;
}

function FreigabeDialog({
  dienst,
  offen,
  schliessen,
}: {
  dienst: KatalogFieldStateService;
  offen: boolean;
  schliessen: (meldung?: string) => void;
}) {
  const { t } = useI18n();
  const [datum, setDatum] = useState(heute);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string>();

  const freigeben = async () => {
    setLaeuft(true);
    setFehler(undefined);
    try {
      const ab = datum === heute() ? undefined : new Date(`${datum}T00:00:00`);
      const version = await dienst.freigeben(ab);
      schliessen(fuelleVorlage(t.katalog.freigegeben, { version }));
    } catch (err) {
      const details = err instanceof KatalogFehler ? err.details : [];
      setFehler(
        [err instanceof Error ? err.message : String(err), ...details].join(
          ' – ',
        ),
      );
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <Dialog open={offen} onClose={() => schliessen()} maxWidth="sm" fullWidth>
      <DialogTitle>{t.katalog.freigebenTitel}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {t.katalog.freigebenText}
        </DialogContentText>
        <TextField
          type="date"
          label={t.katalog.gueltigAb}
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { min: heute() },
          }}
        />
        {fehler && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {fehler}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => schliessen()} disabled={laeuft}>
          {t.katalog.abbrechen}
        </Button>
        <Button variant="contained" onClick={freigeben} disabled={laeuft}>
          {t.katalog.freigebenBestaetigen}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AnlegenDialog({
  dienst,
  schliessen,
}: {
  dienst: KatalogFieldStateService;
  schliessen: (meldung?: string) => void;
}) {
  const { t } = useI18n();
  const fieldState = useFieldState();
  const dispatch = useDispatch();
  const [titel, setTitel] = useState(
    () => (fieldState.schema as { title?: string }).title ?? '',
  );
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string>();

  const anlegen = async () => {
    const name = titel.trim();
    if (!name) return;
    setLaeuft(true);
    setFehler(undefined);
    try {
      await dienst.imKatalogAnlegen(name, fieldState);
      dispatch(createSetFormMetadataAction({ title: name }));
      schliessen(fuelleVorlage(t.katalog.angelegt, { titel: name }));
    } catch (err) {
      setFehler(err instanceof Error ? err.message : String(err));
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <Dialog open onClose={() => schliessen()} maxWidth="sm" fullWidth>
      <DialogTitle>{t.katalog.anlegenTitel}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {t.katalog.anlegenText}
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          label={t.katalog.titelFeld}
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
        />
        {fehler && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {fehler}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => schliessen()} disabled={laeuft}>
          {t.katalog.abbrechen}
        </Button>
        <Button
          variant="contained"
          onClick={anlegen}
          disabled={laeuft || !titel.trim()}
        >
          {t.katalog.anlegenBestaetigen}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function KatalogLeiste({ dienst }: { dienst: KatalogFieldStateService }) {
  const { t } = useI18n();
  const stand = useSyncExternalStore(dienst.abonnieren, dienst.aktuellerStand);
  const [dialog, setDialog] = useState(false);
  const [anlegenOffen, setAnlegenOffen] = useState(false);
  const [meldung, setMeldung] = useState<string>();

  const f = stand.formular;
  const sperre = freigabeSperre(stand);

  const entwurfText = f?.entwurf
    ? fuelleVorlage(
        f.entwurf.bearbeitet_von === stand.ich?.sub
          ? t.katalog.entwurfVonIhnen
          : t.katalog.entwurf,
        { version: f.entwurf.version, person: f.entwurf.bearbeitet_von },
      )
    : undefined;
  const versionText = f?.aktuelle_version
    ? fuelleVorlage(t.katalog.version, { version: f.aktuelle_version })
    : t.katalog.ohneVersion;

  const s = stand.speichern;
  const speicherText =
    s.art === 'speichert'
      ? t.katalog.speichert
      : s.art === 'gespeichert'
        ? t.katalog.gespeichert
        : s.art === 'fehler'
          ? fuelleVorlage(t.katalog.speicherFehler, { fehler: s.meldung })
          : '';

  return (
    <Box
      data-testid="katalog-leiste"
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        px: 2,
        py: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t.katalog.titel}
          {stand.ich ? ` · ${stand.ich.mandant.toUpperCase()}` : ''}
        </Typography>
        {!f ? (
          <>
            <Typography variant="body2" color="text.secondary">
              {t.katalog.nichtImKatalog}
            </Typography>
            <Button size="small" onClick={() => setAnlegenOffen(true)}>
              {t.katalog.anlegen}
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2">
              {f.titel} ({f.kennung})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {versionText}
              {entwurfText ? ` · ${entwurfText}` : ''}
            </Typography>
            {!f.rechte.redaktion && (
              <Typography variant="body2" color="text.secondary">
                {t.katalog.nurLesen}
              </Typography>
            )}
          </>
        )}
        <Typography
          variant="body2"
          color={s.art === 'fehler' ? 'error' : 'text.secondary'}
          aria-live="polite"
          sx={{ flexGrow: 1 }}
        >
          {speicherText}
        </Typography>
        {meldung && (
          <Alert severity="success" onClose={() => setMeldung(undefined)}>
            {meldung}
          </Alert>
        )}
        {f && (
          <Tooltip title={sperre ? t.katalog[sperre] : ''}>
            <span>
              <Button
                variant="contained"
                size="small"
                disabled={sperre !== undefined}
                onClick={() => setDialog(true)}
              >
                {t.katalog.freigeben}
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>
      {anlegenOffen && (
        <AnlegenDialog
          dienst={dienst}
          schliessen={(m) => {
            setAnlegenOffen(false);
            if (m) setMeldung(m);
          }}
        />
      )}
      {dialog && (
        <FreigabeDialog
          dienst={dienst}
          offen={dialog}
          schliessen={(m) => {
            setDialog(false);
            if (m) setMeldung(m);
          }}
        />
      )}
    </Box>
  );
}

/**
 * Fußleiste für `<JsonFormsEditor footer={…} />`. Der Editor erwartet eine
 * Komponente ohne Props, deshalb wird der Dienst hier gebunden.
 */
export function erzeugeKatalogLeiste(
  dienst: KatalogFieldStateService,
): ComponentType {
  const Gebunden = () => <KatalogLeiste dienst={dienst} />;
  Gebunden.displayName = 'KatalogLeiste';
  return Gebunden;
}
