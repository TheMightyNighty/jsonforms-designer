/**
 * Die lokale Bibliothek verwalten (ADR 0007).
 *
 * Zeigt, was installiert ist, und lässt es ein- und ausschalten. Eine
 * Bibliothek kommt als Datei herein — so wird sie auch weitergegeben, etwa
 * über ein Git-Repository. Der Editor lädt von sich aus nichts nach.
 */
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';

import { useI18n } from '../i18n';
import { useErweiterungen } from './ErweiterungenProvider';
import { ErweiterungLadefehler } from './ladeErweiterung';
import { normalisiereErweiterung } from './normalisiereErweiterung';

export function ErweiterungenDialog({
  offen,
  onSchliessen,
}: {
  offen: boolean;
  onSchliessen: () => void;
}) {
  const { t } = useI18n();
  const {
    eintraege,
    aufgeloest,
    hinzufuegen,
    entfernen,
    setzeAktiv,
    ladenVonUrl,
  } = useErweiterungen();
  const dateiRef = useRef<HTMLInputElement>(null);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [laedt, setLaedt] = useState(false);
  const texte = t.erweiterungen;

  const lese = async (datei: File) => {
    setMeldung(null);
    const verworfen: string[] = [];
    try {
      const paket = normalisiereErweiterung(
        JSON.parse(await datei.text()),
        (grund) => verworfen.push(grund),
      );
      if (!paket) {
        setMeldung(verworfen[0] ?? texte.unbrauchbar);
        return;
      }
      hinzufuegen(paket, datei.name);
      // Teilweise verworfen: Das Paket ist drin, aber nicht vollständig —
      // das muss dastehen, sonst sucht jemand nach dem fehlenden Feldtyp.
      if (verworfen.length > 0) setMeldung(verworfen.join(' · '));
    } catch {
      setMeldung(texte.keinJson);
    }
  };

  const vonUrl = async () => {
    setMeldung(null);
    setLaedt(true);
    try {
      await ladenVonUrl(url.trim());
      setUrl('');
    } catch (fehler) {
      const grund =
        fehler instanceof ErweiterungLadefehler ? fehler.grund : 'kein-json';
      setMeldung(
        grund === 'nicht-erreichbar'
          ? texte.ladeFehler.nichtErreichbar
          : grund === 'unbrauchbar'
            ? texte.ladeFehler.unbrauchbar
            : texte.ladeFehler.keinJson,
      );
    } finally {
      setLaedt(false);
    }
  };

  return (
    <Dialog open={offen} onClose={onSchliessen} maxWidth="sm" fullWidth>
      <DialogTitle>{texte.titel}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {texte.einleitung}
        </Typography>

        {meldung && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            onClose={() => setMeldung(null)}
          >
            {meldung}
          </Alert>
        )}

        {aufgeloest.konflikte.map((k) => (
          <Alert key={k} severity="info" sx={{ mb: 1 }}>
            {k}
          </Alert>
        ))}

        {eintraege.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {texte.leer}
            </Typography>
          </Box>
        ) : (
          <List dense>
            {eintraege.map(({ paket, aktiv, herkunft }) => (
              <ListItem
                key={paket.id}
                secondaryAction={
                  <Tooltip title={texte.entfernen}>
                    <IconButton
                      edge="end"
                      aria-label={`${texte.entfernen}: ${paket.name}`}
                      onClick={() => entfernen(paket.id)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <Switch
                  checked={aktiv}
                  onChange={(e) => setzeAktiv(paket.id, e.target.checked)}
                  inputProps={{ 'aria-label': `${paket.name}: ${texte.aktiv}` }}
                />
                <ListItemText
                  primary={
                    paket.version
                      ? `${paket.name} ${paket.version}`
                      : paket.name
                  }
                  secondary={[paket.beschreibung, herkunft]
                    .filter(Boolean)
                    .join(' — ')}
                />
              </ListItem>
            ))}
          </List>
        )}

        <Divider sx={{ my: 2 }} />
        <input
          ref={dateiRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const datei = e.target.files?.[0];
            if (datei) void lese(datei);
            // Zurücksetzen, damit dieselbe Datei erneut gewählt werden kann.
            e.target.value = '';
          }}
        />
        <Button variant="outlined" onClick={() => dateiRef.current?.click()}>
          {texte.hinzufuegen}
        </Button>

        <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'flex-start' }}>
          <TextField
            label={texte.vonUrl}
            placeholder={texte.urlPlatzhalter}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && url.trim()) void vonUrl();
            }}
            size="small"
            fullWidth
            disabled={laedt}
            slotProps={{ htmlInput: { spellCheck: false } }}
          />
          <Button
            onClick={() => void vonUrl()}
            disabled={laedt || url.trim() === ''}
            sx={{ mt: 0.25 }}
          >
            {texte.laden}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSchliessen}>{t.dialog.close}</Button>
      </DialogActions>
    </Dialog>
  );
}
