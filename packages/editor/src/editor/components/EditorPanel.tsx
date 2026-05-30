/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 */
import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { Box } from '@mui/material';
import React from 'react';

import { Editor } from './Editor';

interface EditorPanelProps {
  editorRenderers: JsonFormsRendererRegistryEntry[];
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  editorRenderers,
}) => {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: '1fr',
        overflow: 'auto',
      }}
    >
      <Editor editorRenderers={editorRenderers} />
    </Box>
  );
};
