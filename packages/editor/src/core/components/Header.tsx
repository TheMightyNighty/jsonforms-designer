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
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import EditIcon from '@mui/icons-material/Edit';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import RedoIcon from '@mui/icons-material/Redo';
import SaveAsIcon from '@mui/icons-material/SaveAs';
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
import { useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
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
import {
  FormularAblageDialog,
  FormularNameDialog,
} from './FormularAblageDialog';
import { ImportExportDialog } from './ImportExportDialog';
import { MetadataDialog } from './MetadataDialog';
import { QualitaetsAmpel } from './QualitaetsAmpel';

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
  const { dispatch, fieldState, formularAblage } = useEditorContext();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const { t, locale, setLocale } = useI18n();
  const config = useEditorConfig();
  const theme = useTheme();
  // Auf schmalen Bildschirmen tragen Rückgängig/Wiederholen nur noch ihr
  // Symbol: Mit Text passte die Kopfzeile bei 320 px nicht mehr in die
  // Breite und erzwang horizontales Scrollen (WCAG 1.4.10). Der
  // zugängliche Name bleibt über aria-label erhalten.
  const schmal = useMediaQuery(theme.breakpoints.down('sm'));
  const [exportOpen, setExportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [weitereAnker, setWeitereAnker] = useState<null | HTMLElement>(null);
  const [formularAnker, setFormularAnker] = useState<null | HTMLElement>(null);
  const [ablageOffen, setAblageOffen] = useState(false);
  const [nameDialog, setNameDialog] = useState<
    null | 'speichernAls' | 'umbenennen'
  >(null);

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
      <Toolbar sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
        {/* Links: woran wird gearbeitet? */}
        <Box sx={{ flexGrow: 1, minWidth: 0, mr: 1 }}>
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
            {formularAblage ? (
              // Der Formularname ist zugleich der Einstieg in die Ablage:
              // Neu, Öffnen, Umbenennen, Speichern unter. Vorher war der
              // Name nur Text und nur über die Metadaten änderbar.
              <Button
                size="small"
                onClick={(e) => setFormularAnker(e.currentTarget)}
                endIcon={<ArrowDropDownIcon />}
                aria-haspopup="menu"
                aria-expanded={formularAnker ? true : undefined}
                aria-label={t.header.ablage.menue}
                data-testid="formular-menue"
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
                  // Kein Kursiv: Von Fira Sans ist nur der aufrechte
                  // Schnitt vendored, ein kursiver würde vom Browser
                  // schräg gestellt und überlappt den Folgetext.
                  sx={{ color: 'text.secondary' }}
                >
                  — {formularName}
                </Typography>
              )
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
                startIcon={schmal ? undefined : <UndoIcon />}
                sx={{ color: 'text.secondary', minWidth: 40 }}
              >
                {schmal ? <UndoIcon fontSize="small" /> : t.header.undo}
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
                startIcon={schmal ? undefined : <RedoIcon />}
                sx={{ color: 'text.secondary', minWidth: 40 }}
              >
                {schmal ? <RedoIcon fontSize="small" /> : t.header.redo}
              </Button>
            </span>
          </Tooltip>

          {/*
            Qualitäts-Ampel und — sobald es einen Freigabe-Workflow gibt —
            „Zur Freigabe". Beides hängt hier, damit die Hauptaktion rechts
            außen stehen bleibt.
          */}
          <Box
            data-testid="header-slot-qualitaet"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <QualitaetsAmpel />
          </Box>

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
            startIcon={schmal ? undefined : <MoreHorizIcon />}
            aria-haspopup="menu"
            aria-expanded={weitereAnker ? true : undefined}
            aria-label={t.header.weitere}
            sx={{ color: 'text.secondary', minWidth: 40 }}
          >
            {schmal ? <MoreHorizIcon fontSize="small" /> : t.header.weitere}
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

      {formularAblage && (
        <Menu
          anchorEl={formularAnker}
          open={Boolean(formularAnker)}
          onClose={() => setFormularAnker(null)}
        >
          <MenuItem
            onClick={() => {
              formularAblage.neu();
              setFormularAnker(null);
            }}
          >
            <ListItemIcon>
              <NoteAddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t.header.ablage.neu}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAblageOffen(true);
              setFormularAnker(null);
            }}
          >
            <ListItemIcon>
              <FolderOpenIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t.header.ablage.oeffnen}</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              setNameDialog('umbenennen');
              setFormularAnker(null);
            }}
          >
            <ListItemIcon>
              <DriveFileRenameOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t.header.ablage.umbenennen}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setNameDialog('speichernAls');
              setFormularAnker(null);
            }}
          >
            <ListItemIcon>
              <SaveAsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t.header.ablage.speichernAls}</ListItemText>
          </MenuItem>
        </Menu>
      )}

      {formularAblage && (
        <>
          <FormularAblageDialog
            open={ablageOffen}
            onClose={() => setAblageOffen(false)}
            ablage={formularAblage}
          />
          <FormularNameDialog
            open={nameDialog !== null}
            titel={
              nameDialog === 'speichernAls'
                ? t.header.ablage.speichernAls
                : t.header.ablage.umbenennen
            }
            startwert={formularName ?? ''}
            onClose={() => setNameDialog(null)}
            onBestaetigen={(name) => {
              if (nameDialog === 'speichernAls')
                formularAblage.speichernAls(name);
              else formularAblage.umbenennen(name);
            }}
          />
        </>
      )}

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
