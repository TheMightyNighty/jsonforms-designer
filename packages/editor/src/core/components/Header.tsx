/**
 * Kopfzeile des Editors — zwei Zeilen.
 *
 * Oben steht, woran gearbeitet wird (Produktname, Formularname,
 * Speicherstatus) und rechts die Hauptaktion „Ausprobieren" samt
 * Qualitäts-Ampel und Rückgängig/Wiederholen. Darunter die
 * **Befehlsleiste** mit Datei · Bearbeiten · Ansicht · Formular.
 *
 * ADR 0002 / Arbeitspaket 2 sah dafür genau eine Sammelklappe „Weitere"
 * vor. Die Erprobung hat gezeigt, dass dort niemand nach „Öffnen" oder
 * „Speichern unter" sucht — die Befehle liegen jetzt da, wo man sie aus
 * einem Schreibprogramm kennt.
 */
import { JsonSchema7 } from '@jsonforms/core';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import EditIcon from '@mui/icons-material/Edit';
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import TestModeIcon from '@mui/icons-material/Visibility';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import { useEditorConfig } from '../../config/EditorConfigContext';
import { EditorMode } from '../../editor/editorMode';
import { useI18n } from '../../i18n';
import { EDITOR_VERSION } from '../../version';
import { useEditorContext, useUndoRedo } from '../context';
import {
  formatiereSpeicherStatus,
  istSpeicherFehler,
  STATUS_AKTUALISIERUNG_MS,
} from '../model/speicherStatus';
import { Befehlsleiste } from './Befehlsleiste';
import { FormularNameDialog } from './FormularAblageDialog';
import { QualitaetsAmpel } from './QualitaetsAmpel';

interface HeaderProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  testMode: boolean;
  onTestModeChange: (testMode: boolean) => void;
}

/**
 * Statuszeile neben der Befehlsleiste. Der relative Zeitpunkt wird im Takt
 * von STATUS_AKTUALISIERUNG_MS neu gerechnet, damit aus „gerade eben" ohne
 * Zutun „vor 2 min" wird.
 */
function SpeicherStatusZeile() {
  const { speicherStatus } = useEditorContext();
  const { t } = useI18n();
  const [jetzt, setJetzt] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(
      () => setJetzt(Date.now()),
      STATUS_AKTUALISIERUNG_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <Typography
      variant="caption"
      noWrap
      // aria-live: Der Wechsel auf „Speichern fehlgeschlagen" muss auch
      // ohne Blick auf die Kopfzeile ankommen.
      aria-live="polite"
      sx={{
        color: istSpeicherFehler(speicherStatus)
          ? 'error.main'
          : 'text.secondary',
      }}
    >
      {formatiereSpeicherStatus(speicherStatus, t.header.status, jetzt)}
    </Typography>
  );
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  testMode,
  onTestModeChange,
}) => {
  const { fieldState, formularAblage } = useEditorContext();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const { t } = useI18n();
  const config = useEditorConfig();
  const [umbenennenOffen, setUmbenennenOffen] = useState(false);

  const formularName = (fieldState.schema as JsonSchema7).title ?? '';
  const produktName = config.produktName ?? t.header.title;

  return (
    <AppBar position="static" elevation={0}>
      {/* ── Zeile 1: Woran wird gearbeitet, und die Hauptaktion ───────── */}
      <Toolbar
        variant="dense"
        sx={{ flexWrap: 'wrap', rowGap: 0.5, minHeight: '44px !important' }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 1,
            flexGrow: 1,
            minWidth: 0,
            mr: 1,
          }}
        >
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,
              color: 'primary.dark',
              letterSpacing: '-0.02em',
            }}
          >
            {produktName}
          </Typography>

          {formularAblage ? (
            // Der Formularname ist anklickbar und dort änderbar, wo er
            // steht — vorher führte dorthin nur der Metadaten-Dialog.
            <Button
              size="small"
              onClick={() => setUmbenennenOffen(true)}
              endIcon={<ArrowDropDownIcon />}
              data-testid="formular-menue"
              aria-label={t.header.ablage.umbenennen}
              sx={{
                color: 'text.secondary',
                fontWeight: 400,
                textTransform: 'none',
                minWidth: 0,
                maxWidth: 320,
                '& .MuiButton-endIcon': { ml: 0.25 },
              }}
            >
              <Box
                component="span"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formularName || t.header.ablage.unbenannt}
              </Box>
            </Button>
          ) : (
            formularName && (
              <Typography
                variant="body2"
                noWrap
                sx={{ color: 'text.secondary' }}
              >
                — {formularName}
              </Typography>
            )
          )}

          <Typography
            variant="caption"
            aria-label="Editor-Version"
            sx={{ color: 'text.secondary', fontSize: '0.65rem', flexShrink: 0 }}
          >
            v{EDITOR_VERSION}
          </Typography>
        </Box>

        <SpeicherStatusZeile />
      </Toolbar>

      {/* ── Zeile 2: Befehlsleiste ────────────────────────────────────── */}
      <Toolbar
        variant="dense"
        sx={{
          minHeight: '36px !important',
          borderTop: 1,
          borderColor: 'divider',
          gap: 1,
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Befehlsleiste mode={mode} onModeChange={onModeChange} />
        </Box>

        {/*
          Rückgängig/Wiederholen, Qualitäts-Ampel und die Hauptaktion
          stehen in derselben Zeile wie die Menüs — dort sucht man sie,
          und die Titelzeile darüber bleibt frei für das, woran gearbeitet
          wird.
        */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            rowGap: 0.5,
            gap: 0.5,
          }}
        >
          <Tooltip title={t.header.undo}>
            <span>
              <Button
                color="inherit"
                size="small"
                onClick={undo}
                disabled={!canUndo}
                aria-label={t.header.undo}
                sx={{ color: 'text.secondary', minWidth: 40 }}
              >
                <UndoIcon fontSize="small" />
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={t.header.redo}>
            <span>
              <Button
                color="inherit"
                size="small"
                onClick={redo}
                disabled={!canRedo}
                aria-label={t.header.redo}
                sx={{ color: 'text.secondary', minWidth: 40 }}
              >
                <RedoIcon fontSize="small" />
              </Button>
            </span>
          </Tooltip>

          <Box
            data-testid="header-slot-qualitaet"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <QualitaetsAmpel />
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Button
            variant="contained"
            size="small"
            disableElevation
            onClick={() => onTestModeChange(!testMode)}
            startIcon={testMode ? <EditIcon /> : <TestModeIcon />}
          >
            {testMode ? t.header.bearbeiten : t.header.ausprobieren}
          </Button>
        </Box>
      </Toolbar>

      {formularAblage && (
        <FormularNameDialog
          open={umbenennenOffen}
          titel={t.header.ablage.umbenennen}
          startwert={formularName}
          onClose={() => setUmbenennenOffen(false)}
          onBestaetigen={(name) => formularAblage.umbenennen(name)}
        />
      )}
    </AppBar>
  );
};
