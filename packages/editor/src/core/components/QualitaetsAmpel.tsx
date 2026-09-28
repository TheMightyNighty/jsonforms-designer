/**
 * Qualitäts-Ampel in der Kopfzeile (ADR 0002, Arbeitspaket 6).
 *
 * Zeigt als Zähler, wie viele Fehler und Hinweise das Formular hat. Ein Klick
 * öffnet die Liste, ein Klick auf einen Eintrag wählt das betroffene Feld aus
 * — so führt der Befund direkt zur Stelle, an der er behoben wird.
 *
 * Die Prüfung selbst ist eine reine Funktion (`pruefeFormular`); diese
 * Komponente zeigt sie nur an.
 */
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';

import { pruefEinstellungenFuer } from '../../config/editorConfig';
import { useEditorConfig } from '../../config/EditorConfigContext';
import { useRegion } from '../../erweiterung/ErweiterungenProvider';
import { feldtypTexte } from '../../field-types/feldtypTexte';
import { useI18n } from '../../i18n';
import { useEditorContext } from '../context';
import {
  hinweisText,
  pruefeFormular,
  PruefRegelId,
  zaehleHinweise,
} from '../util/formularPruefung';

export function QualitaetsAmpel() {
  const { fieldState, setSelectedScope } = useEditorContext();
  const { t } = useI18n();
  const config = useEditorConfig();
  const [anker, setAnker] = useState<null | HTMLElement>(null);

  // Die Prüfung läuft über das ganze Formular; ohne Memo liefe sie bei jedem
  // Tastendruck in einem beliebigen Eingabefeld erneut.
  const region = useRegion();
  const einstellungen = useMemo(
    () => pruefEinstellungenFuer(config, region),
    [config, region],
  );
  const befunde = useMemo(
    () => pruefeFormular(fieldState, einstellungen),
    [fieldState, einstellungen],
  );
  // Die Prüffunktion liefert Regel-id und Werte; den Satz baut erst die
  // Oberfläche, weil nur sie die Sprache kennt.
  const text = (befund: (typeof befunde)[number]) =>
    hinweisText(
      befund,
      t.header.qualitaet.regeln as Record<PruefRegelId, string>,
      befund.feldtypId
        ? { vorschlag: feldtypTexte(t, befund.feldtypId).name }
        : undefined,
    );
  const { fehler, hinweise } = zaehleHinweise(befunde);
  const texte = t.header.qualitaet;

  const sauber = befunde.length === 0;
  const beschriftung = sauber
    ? texte.ohneBefund
    : `${fehler} ${texte.fehler} · ${hinweise} ${texte.hinweise}`;

  return (
    <>
      <Button
        size="small"
        color="inherit"
        data-testid="qualitaets-ampel"
        onClick={(e) => setAnker(e.currentTarget)}
        aria-haspopup="dialog"
        aria-label={`${texte.alsButton}: ${beschriftung}`}
        startIcon={
          sauber ? (
            <TaskAltIcon color="success" />
          ) : fehler > 0 ? (
            <ErrorOutlineIcon color="error" />
          ) : (
            <InfoOutlinedIcon color="warning" />
          )
        }
        sx={{ color: 'text.secondary' }}
      >
        {sauber ? '0' : `${fehler + hinweise}`}
      </Button>

      <Popover
        open={Boolean(anker)}
        anchorEl={anker}
        onClose={() => setAnker(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, pb: 1, maxWidth: 420 }}>
          <Typography variant="subtitle1">{texte.titel}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {beschriftung}
          </Typography>
        </Box>
        <Divider />

        {sauber ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2">{texte.ohneBefund}</Typography>
          </Box>
        ) : (
          <List dense sx={{ maxWidth: 420, maxHeight: 360, overflowY: 'auto' }}>
            {befunde.map((befund, i) => (
              <ListItemButton
                // Dieselbe Regel kann mehrere Felder betreffen; id und scope
                // allein sind nicht eindeutig genug für einen React-Key.
                key={`${befund.id}-${befund.feldScope ?? 'formular'}-${i}`}
                disabled={!befund.feldScope}
                onClick={() => {
                  if (!befund.feldScope) return;
                  setSelectedScope(befund.feldScope);
                  setAnker(null);
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {befund.schwere === 'fehler' ? (
                    <ErrorOutlineIcon fontSize="small" color="error" />
                  ) : (
                    <InfoOutlinedIcon fontSize="small" color="warning" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={text(befund)}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
