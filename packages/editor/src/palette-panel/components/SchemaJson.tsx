/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 *
 * Migrated: @material-ui -> @mui, FileCopyIcon -> ContentCopyIcon
 * ---------------------------------------------------------------------
 */
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Toolbar from '@mui/material/Toolbar';
import React, { useState } from 'react';

import { ErrorDialog } from '../../core/components/ErrorDialog';
import { copyToClipBoard } from '../../core/util/clipboard';
import { env } from '../../env';
import { JsonEditorDialog, TextType } from '../../text-editor';

interface UpdateOk {
  success: true;
}
interface UpdateFail {
  success: false;
  message: string;
}
export type UpdateResult = UpdateOk | UpdateFail;

interface SchemaJsonProps {
  title: string;
  schema: string;
  debugSchema?: string;
  type: TextType;
  updateSchema: (schema: unknown) => UpdateResult;
}

export const SchemaJson: React.FC<SchemaJsonProps> = ({
  title,
  schema,
  debugSchema,
  type,
  updateSchema,
}) => {
  const [showSchemaEditor, setShowSchemaEditor] = useState(false);
  const [updateErrorText, setUpdateErrorText] = useState('');
  const showDebugControls = debugSchema && env().DEBUG === 'true';
  const [showDebugSchema, setShowDebugSchema] = useState(!!showDebugControls);

  const onApply = (newSchema: unknown) => {
    const result = updateSchema(newSchema);
    if (result.success) {
      setShowSchemaEditor(false);
      return;
    }
    setUpdateErrorText(result.message);
  };

  return (
    <>
      <Toolbar>
        <IconButton
          onClick={() =>
            copyToClipBoard(
              showDebugSchema && debugSchema ? debugSchema : schema,
            )
          }
          data-cy="copy-clipboard"
        >
          <ContentCopyIcon />
        </IconButton>
        <IconButton
          onClick={() => setShowSchemaEditor(true)}
          data-cy="edit-schema"
        >
          <EditIcon />
        </IconButton>
        {showDebugControls && (
          <FormControlLabel
            control={
              <Switch
                data-cy="debug-toggle"
                checked={showDebugSchema}
                onChange={() => setShowDebugSchema((v) => !v)}
                color="primary"
              />
            }
            label="Debug"
          />
        )}
      </Toolbar>
      <pre data-cy="schema-text">{showDebugSchema ? debugSchema : schema}</pre>
      {showSchemaEditor && (
        <JsonEditorDialog
          open
          title={title}
          initialContent={schema}
          type={type}
          onCancel={() => setShowSchemaEditor(false)}
          onApply={onApply}
        />
      )}
      {Boolean(updateErrorText) && (
        <ErrorDialog
          open
          title="Update Error"
          text={updateErrorText}
          onClose={() => setUpdateErrorText('')}
        />
      )}
    </>
  );
};
