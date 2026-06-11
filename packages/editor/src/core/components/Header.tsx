import { JsonSchema7 } from '@jsonforms/core';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import PreviewIcon from '@mui/icons-material/Visibility';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

import { EditorMode } from '../../editor/editorMode';
import { FormTemplate } from '../../field-types/formTemplates';
import { TemplatePickerDialog } from '../../field-types/TemplatePickerDialog';
import { useI18n } from '../../i18n';
import { useEditorContext, useUndoRedo } from '../context';
import {
  createLoadTemplateAction,
  createSetFieldStateAction,
  createSetFormMetadataAction,
  createToggleLineNumbersAction,
} from '../model/addFieldActions';
import { copyToClipBoard } from '../util/clipboard';
import { ImportExportDialog } from './ImportExportDialog';
import { MetadataDialog } from './MetadataDialog';

interface HeaderProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ mode, onModeChange }) => {
  const { dispatch, fieldState } = useEditorContext();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const { t, locale, setLocale } = useI18n();
  const [exportOpen, setExportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);

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

  const lineNumbers = fieldState.lineNumbersEnabled;
  const isCode = mode === 'code';
  const isPreview = mode === 'preview';

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 1,
            flexGrow: 1,
            minWidth: 0,
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
            {t.header.title}
          </Typography>
          {(fieldState.schema as JsonSchema7).title && (
            <Typography
              variant="body2"
              noWrap
              sx={{ color: 'text.secondary', fontStyle: 'italic' }}
            >
              — {(fieldState.schema as JsonSchema7).title}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <Tooltip title={locale === 'de' ? 'English' : 'Deutsch'}>
            <IconButton
              color="inherit"
              onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
              aria-label="Sprache wechseln"
            >
              <LanguageIcon />
              <Typography
                variant="caption"
                sx={{ ml: 0.25, fontSize: '0.65rem' }}
              >
                {locale.toUpperCase()}
              </Typography>
            </IconButton>
          </Tooltip>

          <Tooltip title={t.header.undo}>
            <span>
              <IconButton
                color="inherit"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Rückgängig"
              >
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t.header.redo}>
            <span>
              <IconButton
                color="inherit"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Wiederholen"
              >
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Tooltip title={t.header.template}>
            <IconButton
              color="inherit"
              onClick={() => setTemplateOpen(true)}
              aria-label="Vorlage laden"
            >
              <LibraryBooksIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={t.header.copySchema}>
            <IconButton
              color="inherit"
              onClick={handleCopySchema}
              aria-label="Schema kopieren"
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Tooltip title={isCode ? t.header.codeModeOff : t.header.codeModeOn}>
            <IconButton
              color="inherit"
              onClick={() => onModeChange(isCode ? 'visual' : 'code')}
              aria-label={isCode ? 'Visueller Modus' : 'Code-Modus'}
              sx={{ color: isCode ? 'primary.main' : 'text.secondary' }}
            >
              <CodeIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={isPreview ? t.header.previewOff : t.header.previewOn}>
            <IconButton
              color="inherit"
              onClick={() => onModeChange(isPreview ? 'visual' : 'preview')}
              aria-label={isPreview ? 'Bearbeiten' : 'Vorschau'}
              sx={{ color: isPreview ? 'primary.main' : 'text.secondary' }}
            >
              {isPreview ? <EditIcon /> : <PreviewIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip
            title={
              lineNumbers
                ? 'Zeilennummern ausblenden'
                : 'Zeilennummern einblenden'
            }
          >
            <IconButton
              color="inherit"
              onClick={() => dispatch(createToggleLineNumbersAction())}
              aria-label="Zeilennummern umschalten"
              sx={{ color: lineNumbers ? 'primary.main' : 'text.secondary' }}
            >
              <FormatListNumberedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Formular-Metadaten">
            <IconButton
              onClick={() => setMetaOpen(true)}
              aria-label="Formular-Metadaten bearbeiten"
            >
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={t.header.exportImport}>
            <IconButton
              onClick={() => setExportOpen(true)}
              aria-label="Export / Import"
            >
              <CloudDownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
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
        onSave={(meta) => dispatch(createSetFormMetadataAction(meta))}
      />
    </AppBar>
  );
};
