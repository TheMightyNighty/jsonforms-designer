/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 */
import { Box } from '@mui/material';
import React from 'react';

import { Editor } from './Editor';

interface EditorPanelProps {
  testMode: boolean;
  testData: Record<string, unknown>;
  onTestDataChange: (data: Record<string, unknown>) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  testMode,
  testData,
  onTestDataChange,
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
      <Editor
        testMode={testMode}
        testData={testData}
        onTestDataChange={onTestDataChange}
      />
    </Box>
  );
};
