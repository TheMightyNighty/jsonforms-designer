/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 */
import { Box, Typography } from '@mui/material';
import React from 'react';

import { useDispatch } from '../../core/context';
import { useI18n } from '../../i18n';
import { useFieldDrop } from '../../palette-panel/useFieldDrop';

export const EmptyEditor: React.FC = () => {
  const dispatch = useDispatch();
  const { t } = useI18n();

  const [{ isOver }, fieldDrop] = useFieldDrop(dispatch);

  const setRef = (el: HTMLDivElement | null) => {
    (fieldDrop as unknown as (el: HTMLDivElement | null) => void)(el);
  };

  return (
    <Box
      ref={setRef}
      data-testid="empty-editor-drop"
      role="region"
      aria-label="Formular-Editor-Fläche"
      aria-dropeffect="copy"
      sx={{
        padding: '10px',
        height: '100%',
        border: '1px dashed',
        borderColor: isOver ? 'primary.main' : 'transparent',
        borderRadius: 1,
        backgroundColor: isOver ? 'action.hover' : 'transparent',
        transition: 'border-color 0.15s, background-color 0.15s',
      }}
    >
      <Typography
        data-cy="nolayout-drop"
        color="text.secondary"
        aria-live="polite"
      >
        {t.editor.dropHint}
      </Typography>
    </Box>
  );
};
