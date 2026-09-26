/**
 * Kopfzeile des Editors.
 *
 * Aufteilung nach ADR 0002: links steht, woran gearbeitet wird (Produktname,
 * Formularname, Speicherstatus), rechts stehen die Aktionen — beschriftet, mit
 * „Ausprobieren" als Hauptaktion. Alles Seltene liegt im Menü „Weitere".
 *
 * Vorher waren es acht unbeschriftete Symbole nebeneinander; die
 * Formularredakteurin musste jedes einzeln überfahren, um es zu verstehen.
 */
import { JsonSchema7 } from '@jsonforms/core';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import TestModeIcon from '@mui/icons-material/Visibility';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import { useEditorConfig } from '../../config/EditorConfigContext';
import { EditorMode } from '../../editor/editorMode';
import { FormTemplate } from '../../field-types/formTemplates';
import { TemplatePickerDialog } from '../../field-types/TemplatePickerDialog';
import { useI18n } from '../../i18n';
import { EDITOR_VERSION } from '../../version';
import { useEditorContext, useUndoRedo } from '../context';
import {
  createLoadTemplateAction,
  createSetFieldStateAction,
  createSetFormMetadataAction,
  createToggleLineNumbersAction,
} from '../model/addFieldActions';
import {
  formatiereSpeicherStatus,
  istSpeicherFehler,
  STATUS_AKTUALISIERUNG_MS,
} from '../model/speicherStatus';
import { copyToClipBoard } from '../util/clipboard';
import { ImportExportDialog } from './ImportExportDialog';
import { MetadataDialog } from './MetadataDialog';

interface HeaderProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  testMode: boolean;
  onTestModeChange: (testMode: boolean) => void;
}

/**
 * Statuszeile unter dem Formularnamen. Der relative Zeitpunkt wird im
 * Takt von STATUS_AKTUALISIERUNG_MS neu gerechnet, damit aus „gerade eben"
 * ohne Zutun „vor 2 min" wird.
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

  const fehler = istSpeicherFehler(speicherStatus);

  return (
    <Typography
      variant="caption"
      noWrap
      // aria-live: Der Wechsel auf „Speichern fehlgeschlagen" muss auch
      // ohne Blick auf die Kopfzeile ankommen.
      aria-live="polite"
      sx={{ color: fehler ? 'error.main' : 'text.secondary' }}
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
  const { dispatch, fieldState } = useEditorContext();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const { t, locale, setLocale } = useI18n();
  const config = useEditorConfig();
  const [exportOpen, setExportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [weitereAnker, setWeitereAnker] = useState<null | HTMLElement>(null);

  const handleTemplateSelect = (tpl: FormTemplate) => {
    dispatch(createLoadTemplateAction(tpl.state));
  };

  const handleCopySchema = () => {
    copyToClipBoard(
      JSON.stringify(
        { schema: fieldState.schema, uiSchema: fieldState.uiSchema },
        null,
        2,
      ),
    );
  };

  const schliesseWeitere = () => setWeitereAnker(null);
  /** Menüpunkt ausführen und Menü schließen — sonst bleibt es offen stehen. */
  const ausMenue = (aktion: () => void) => () => {
    aktion();
    schliesseWeitere();
  };

  const lineNumbers = fieldState.lineNumbersEnabled;
  const isCode = mode === 'code';
  const formularName = (fieldState.schema as JsonSchema7).title;
  const produktName = config.produktName ?? t.header.title;

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        {/* Links: woran wird gearbeitet? */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
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
            {formularName && (
              <Typography
                variant="body2"
                noWrap
                // Kein Kursiv: Von Fira Sans ist nur der aufrechte Schnitt
                // vendored, ein kursiver würde vom Browser schräg gestellt
                // und überlappt dabei den Folgetext.
                sx={{ color: 'text.secondary' }}
              >
                — {formularName}
              </Typography>
            )}
            <Typography
              variant="caption"
              aria-label="Editor-Version"
              sx={{
                color: 'text.secondary',
                fontSize: '0.65rem',
                flexShrink: 0,
              }}
            >
              v{EDITOR_VERSION}
            </Typography>
          </Box>
          <SpeicherStatusZeile />
        </Box>

        {/* Rechts: Aktionen, beschriftet */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={t.header.undo}>
            <span>
              <Button
                color="inherit"
                size="small"
                onClick={undo}
                disabled={!canUndo}
                startIcon={<UndoIcon />}
                sx={{ color: 'text.secondary' }}
              >
                {t.header.undo}
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
                startIcon={<RedoIcon />}
                sx={{ color: 'text.secondary' }}
              >
                {t.header.redo}
              </Button>
            </span>
          </Tooltip>

          {/*
            Platz für die Qualitäts-Ampel aus Arbeitspaket 6 und — sobald es
            einen Freigabe-Workflow gibt — für „Zur Freigabe". Beides wird
            hier eingehängt, damit die Hauptaktion rechts außen stehen bleibt.
          */}
          <Box
            data-testid="header-slot-qualitaet"
            sx={{ display: 'flex', alignItems: 'center' }}
          />

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Hauptaktion */}
          <Button
            variant="contained"
            size="small"
            disableElevation
            onClick={() => onTestModeChange(!testMode)}
            startIcon={testMode ? <EditIcon /> : <TestModeIcon />}
          >
            {testMode ? t.header.bearbeiten : t.header.ausprobieren}
          </Button>

          <Button
            color="inherit"
            size="small"
            onClick={(e) => setWeitereAnker(e.currentTarget)}
            startIcon={<MoreHorizIcon />}
            aria-haspopup="menu"
            aria-expanded={weitereAnker ? true : undefined}
            sx={{ color: 'text.secondary' }}
          >
            {t.header.weitere}
          </Button>
        </Box>

        <Menu
          anchorEl={weitereAnker}
          open={Boolean(weitereAnker)}
          onClose={schliesseWeitere}
        >
          <MenuItem
            onClick={ausMenue(() => onModeChange(isCode ? 'visual' : 'code'))}
          >
            <ListItemIcon>
              <CodeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {isCode ? t.header.codeModeOff : t.header.codeModeOn}
            </ListItemText>
          </MenuItem>

          <MenuItem onClick={ausMenue(handleCopySchema)}>
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t.header.copySchema}</ListItemText>
          </MenuItem>

          <MenuItem onClick={ausMenue(() => setExportOpen(true))}>
            <ListItemIcon>
              <CloudDownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t.header.exportImport}</ListItemText>
          </MenuItem>

          <MenuItem onClick={ausMenue(() => setTemplateOpen(true))}>
            <ListItemIcon>
              <LibraryBooksIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t.header.template}</ListItemText>
          </MenuItem>

          <MenuItem onClick={ausMenue(() => setMetaOpen(true))}>
            <ListItemIcon>
              <InfoOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t.header.metadaten}</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem
            onClick={ausMenue(() => dispatch(createToggleLineNumbersAction()))}
          >
            <ListItemIcon>
              <FormatListNumberedIcon
                fontSize="small"
                color={lineNumbers ? 'primary' : 'inherit'}
              />
            </ListItemIcon>
            <ListItemText>{t.header.zeilennummern}</ListItemText>
          </MenuItem>

          <MenuItem
            onClick={ausMenue(() => setLocale(locale === 'de' ? 'en' : 'de'))}
          >
            <ListItemIcon>
              <LanguageIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {t.header.sprache}: {locale.toUpperCase()}
            </ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>

      <ImportExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        fieldState={fieldState}
        onImport={(state) => {
          dispatch(createSetFieldStateAction(state));
          setExportOpen(false);
        }}
      />

      <TemplatePickerDialog
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onSelect={handleTemplateSelect}
      />

      <MetadataDialog
        open={metaOpen}
        onClose={() => setMetaOpen(false)}
        schema={fieldState.schema}
        manifestMeta={fieldState.manifestMeta}
        onSave={(meta) => dispatch(createSetFormMetadataAction(meta))}
      />
    </AppBar>
  );
};
