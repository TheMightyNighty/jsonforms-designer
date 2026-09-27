/**
 * Dialoge des Hilfe-Menüs: Anleitung, Bedienung ohne Maus, Tipp des Tages,
 * Über den Designer, Lizenzen und Herkunft.
 *
 * Alle Texte kommen aus `i18n` (ADR 0002/V6). Die Lizenztabelle ist die
 * einzige Stelle, an der Paketnamen und Lizenzkürzel stehen — die sind
 * keine Übersetzung, sondern Tatsachen.
 */
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { useI18n } from '../../i18n';
import { KERN_VERSION } from '../../theme/kernTokens';
import { EDITOR_VERSION } from '../../version';

/** localStorage-Schlüssel für „Tipp des Tages beim Start anzeigen". */
export const TIPP_BEIM_START_KEY = 'jfd_tipp_beim_start';

/** Liest die Einstellung; ohne Storage (SSR, Private Mode) gilt „aus". */
export function tippBeimStartAktiv(): boolean {
  try {
    return localStorage.getItem(TIPP_BEIM_START_KEY) === '1';
  } catch {
    return false;
  }
}

function setzeTippBeimStart(aktiv: boolean): void {
  try {
    if (aktiv) localStorage.setItem(TIPP_BEIM_START_KEY, '1');
    else localStorage.removeItem(TIPP_BEIM_START_KEY);
  } catch {
    /* kein Storage — Einstellung bleibt flüchtig */
  }
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Anleitung
// ---------------------------------------------------------------------------

export function AnleitungDialog({ open, onClose }: DialogProps) {
  const { t } = useI18n();
  const h = t.header.hilfe;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{h.anleitungTitel}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {h.anleitungEinleitung}
        </Typography>
        <Box component="ol" sx={{ pl: 2.5, m: 0, display: 'grid', gap: 1.5 }}>
          {h.schritte.map((schritt) => (
            <Typography component="li" variant="body2" key={schritt}>
              {schritt}
            </Typography>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.dialog.close}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Bedienung ohne Maus
// ---------------------------------------------------------------------------

export function TastaturDialog({ open, onClose }: DialogProps) {
  const { t } = useI18n();
  const h = t.header.hilfe;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{h.tastaturTitel}</DialogTitle>
      <DialogContent dividers>
        <Table size="small">
          <TableBody>
            {h.kuerzel.map((k) => (
              <TableRow key={k.taste}>
                <TableCell
                  sx={{ whiteSpace: 'nowrap', verticalAlign: 'top', pl: 0 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {k.taste}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{k.was}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.dialog.close}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Tipp des Tages
// ---------------------------------------------------------------------------

export function TippDialog({ open, onClose }: DialogProps) {
  const { t } = useI18n();
  const h = t.header.hilfe;
  // Startet beim Tipp des Tages: derselbe Tipp den ganzen Tag, morgen der
  // nächste — daher der Tag als Startwert, nicht der Zufall.
  const [index, setIndex] = useState(
    () => Math.floor(Date.now() / 86_400_000) % Math.max(1, h.tipps.length),
  );
  const [beimStart, setBeimStart] = useState(tippBeimStartAktiv);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      data-testid="tipp-dialog"
    >
      <DialogTitle>{h.tippTitel}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1">
          {h.tipps[index % h.tipps.length]}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={beimStart}
              onChange={(e) => {
                setBeimStart(e.target.checked);
                setzeTippBeimStart(e.target.checked);
              }}
            />
          }
          label={<Typography variant="body2">{h.beimStart}</Typography>}
        />
        <Box>
          <Button onClick={() => setIndex((i) => i + 1)}>
            {h.naechsterTipp}
          </Button>
          <Button onClick={onClose}>{t.dialog.close}</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Über den Designer
// ---------------------------------------------------------------------------

export function UeberDialog({ open, onClose }: DialogProps) {
  const { t } = useI18n();
  const h = t.header.hilfe;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{h.ueberTitel}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t.header.title}
        </Typography>
        <Typography variant="body2">
          {h.version}: {EDITOR_VERSION}
        </Typography>
        <Typography variant="body2">
          {h.lizenz}: MIT — © EclipseSource Munich und Mitwirkende
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.dialog.close}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Lizenzen und Herkunft
// ---------------------------------------------------------------------------

/**
 * Bestandteile Dritter, die im Repository liegen. Bewusst von Hand
 * gepflegt und nicht aus `package.json` erzeugt: Hier stehen die
 * vendorten Teile, die in keiner Abhängigkeitsliste auftauchen.
 */
const BESTANDTEILE: Array<{
  name: string;
  lizenz: string;
  wofuerDe: string;
  wofuerEn: string;
}> = [
  {
    name: 'JSONForms',
    lizenz: 'MIT',
    wofuerDe: 'Rendern der Formulare',
    wofuerEn: 'Rendering the forms',
  },
  {
    name: 'MUI',
    lizenz: 'MIT',
    wofuerDe: 'Oberflächen-Bausteine',
    wofuerEn: 'User interface components',
  },
  {
    name: 'Tabler Icons',
    lizenz: 'MIT',
    wofuerDe: 'Symbole in der Palette (vendored, nur woff2)',
    wofuerEn: 'Palette icons (vendored, woff2 only)',
  },
  {
    name: 'KERN Design-System',
    lizenz: 'EUPL-1.2',
    wofuerDe: `Design-Token und Schrift Fira Sans (vendored, @kern-ux/native ${KERN_VERSION})`,
    wofuerEn: `Design tokens and the Fira Sans typeface (vendored, @kern-ux/native ${KERN_VERSION})`,
  },
  {
    name: 'Monaco Editor',
    lizenz: 'MIT',
    wofuerDe: 'Code-Modus (lokal gebündelt, kein CDN)',
    wofuerEn: 'Code mode (bundled locally, no CDN)',
  },
];

export function LizenzDialog({ open, onClose }: DialogProps) {
  const { t, locale } = useI18n();
  const h = t.header.hilfe;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      data-testid="lizenz-dialog"
    >
      <DialogTitle>{h.lizenzenTitel}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {h.lizenzenEinleitung}
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{h.komponente}</TableCell>
              <TableCell>{h.lizenz}</TableCell>
              <TableCell>{h.wofuer}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {BESTANDTEILE.map((b) => (
              <TableRow key={b.name}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{b.name}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{b.lizenz}</TableCell>
                <TableCell>
                  {locale === 'de' ? b.wofuerDe : b.wofuerEn}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.dialog.close}</Button>
      </DialogActions>
    </Dialog>
  );
}
