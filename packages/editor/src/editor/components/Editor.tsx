/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 */
import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { materialCells } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { Grid, ThemeProvider, createTheme } from '@mui/material';
import React from 'react';

import { useDispatch, useFieldState, useSelectedScope, useUiSchema } from '../../core/context';
import { useExportSchema } from '../../core/util/hooks';
import { EmptyEditor } from './EmptyEditor';
import { FieldFormPreview } from './FieldFormPreview';

const editorTheme = createTheme({
  components: {
    MuiFormControl: {
      styleOverrides: { root: { overflow: 'hidden' } },
    },
  },
});

export interface EditorProps {
  editorRenderers: JsonFormsRendererRegistryEntry[];
}

export const Editor: React.FC<EditorProps> = ({ editorRenderers }) => {
  const schema = useExportSchema();
  const uiSchema = useUiSchema();
  const fieldState = useFieldState();
  const dispatch = useDispatch();
  const [selectedScope, setSelectedScope] = useSelectedScope();

  // Auch strukturelle Elemente (Spalten-Layout ohne Felder) zeigen
  const hasFieldStateContent =
    Object.keys(fieldState.schema.properties ?? {}).length > 0 ||
    fieldState.uiSchema.elements.length > 0;

  if (uiSchema) {
    return (
      <Grid container>
        <ThemeProvider theme={editorTheme}>
          <JsonForms
            data={{}}
            schema={schema}
            uischema={uiSchema}
            renderers={editorRenderers}
            cells={materialCells}
          />
        </ThemeProvider>
      </Grid>
    );
  }

  if (hasFieldStateContent) {
    return (
      <FieldFormPreview
        fieldState={fieldState}
        selectedScope={selectedScope}
        onSelectScope={setSelectedScope}
        dispatch={dispatch}
      />
    );
  }

  return <EmptyEditor />;
};
