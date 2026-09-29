/**
 * Dialog „Formular öffnen" (ADR 0006).
 *
 * Zeigt die abgelegten Formulare mit letzter Änderung, öffnet eines per
 * Klick und erlaubt das Löschen — mit Rückfrage, weil Löschen nicht über
 * Rückgängig zurückzuholen ist.
 */
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { useI18n } from '../../i18n';
import { FormularVerwaltung } from '../context';

interface FormularAblageDialogProps {
  open: boolean;
  onClose: () => void;
  ablage: FormularVerwaltung;
}

/** Datum in der Sprache der Oberfläche, ohne eigene Formatierungsbibliothek. */
function formatiereZeitpunkt(iso: string, locale: string): string {
  const datum = new Date(iso);
  if (Number.isNaN(datum.getTime())) return '';
  return datum.toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function FormularAblageDialog({
  open,
  onClose,
  ablage,
}: FormularAblageDialogProps) {
  const { t, locale } = useI18n();
  const texte = t.header.ablage;
  const [loeschKandidat, setLoeschKandidat] = useState<string | null>(null);

  const zuLoeschen = ablage.liste.find((e) => e.id === loeschKandidat);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        data-testid="ablage-dialog"
      >
        <DialogTitle>{texte.oeffnenTitel}</DialogTitle>
        <DialogContent dividers>
          {ablage.liste.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {texte.leer}
            </Typography>
          ) : (
            <List dense>
              {ablage.liste.map((eintrag) => (
                <ListItem
                  key={eintrag.id}
                  disablePadding
                  secondaryAction={
                    <Tooltip title={texte.loeschen}>
                      <IconButton
                        edge="end"
                        aria-label={`${texte.loeschen}: ${eintrag.name}`}
                        onClick={() => setLoeschKandidat(eintrag.id)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemButton
                    selected={eintrag.id === ablage.aktuelles?.id}
                    onClick={() => {
                      ablage.oeffnen(eintrag.id);
                      onClose();
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <DescriptionOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={eintrag.name}
                      secondary={formatiereZeitpunkt(
                        eintrag.geaendertAm,
                        locale,
                      )}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t.dialog.close}</Button>
        </DialogActions>
      </Dialog>

      {/* Löschen ist nicht über Rückgängig zurückzuholen — deshalb fragen. */}
      <Dialog
        open={zuLoeschen !== undefined}
        onClose={() => setLoeschKandidat(null)}
      >
        <DialogTitle>{texte.loeschenTitel}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {texte.loeschenFrage.replace('{name}', zuLoeschen?.name ?? '')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoeschKandidat(null)}>
            {t.dialog.cancel}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (loeschKandidat) ablage.loeschen(loeschKandidat);
              setLoeschKandidat(null);
            }}
          >
            {texte.loeschen}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** Kleiner Dialog für „Speichern unter" und „Umbenennen". */
export function FormularNameDialog({
  open,
  titel,
  startwert,
  onClose,
  onBestaetigen,
}: {
  open: boolean;
  titel: string;
  startwert: string;
  onClose: () => void;
  onBestaetigen: (name: string) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(startwert);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      data-testid="formular-name-dialog"
      // Startwert erst beim Öffnen übernehmen, nicht bei jedem Render.
      TransitionProps={{ onEnter: () => setName(startwert) }}
    >
      <DialogTitle>{titel}</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) {
              onBestaetigen(name.trim());
              onClose();
            }
          }}
        >
          <input
            aria-label={t.header.ablage.name}
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              font: 'inherit',
              padding: '10px 12px',
              marginTop: 8,
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.dialog.cancel}</Button>
        <Button
          variant="contained"
          disabled={!name.trim()}
          onClick={() => {
            onBestaetigen(name.trim());
            onClose();
          }}
        >
          {t.header.ablage.uebernehmen}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
