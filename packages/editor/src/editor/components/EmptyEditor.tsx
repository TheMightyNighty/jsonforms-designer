/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 */
import { Box, Typography } from '@mui/material';
import React from 'react';
import { useDrop } from 'react-dnd';

import { useDispatch } from '../../core/context';
import { NEW_UI_SCHEMA_ELEMENT, NewUISchemaElement } from '../../core/dnd';
import { Actions } from '../../core/model';
import { useI18n } from '../../i18n';
import { useFieldDrop } from '../../palette-panel/useFieldDrop';

export const EmptyEditor: React.FC = () => {
  const dispatch = useDispatch();
  const { t } = useI18n();

  // Bestehender Drop für UI-Schema-Elemente (altes DnD)
  const [{ isOver: isOverSchema, uiSchemaElement }, schemaDrop] = useDrop<
    NewUISchemaElement,
    void,
    {
      isOver: boolean;
      uiSchemaElement: NewUISchemaElement['uiSchemaElement'] | undefined;
    }
  >(() => ({
    accept: NEW_UI_SCHEMA_ELEMENT,
    collect: (mon) => ({
      isOver: !!mon.isOver(),
      uiSchemaElement: mon.getItem()?.uiSchemaElement,
    }),
    drop: () => {
      dispatch(Actions.setUiSchema(uiSchemaElement));
    },
  }));

  const [{ isOver: isOverField }, fieldDrop] = useFieldDrop(dispatch);

  const isOver = isOverSchema || isOverField;

  const setRef = (el: HTMLDivElement | null) => {
    (schemaDrop as unknown as (el: HTMLDivElement | null) => void)(el);
    (fieldDrop as unknown as (el: HTMLDivElement | null) => void)(el);
  };

  return (
    <Box
      ref={setRef}
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
