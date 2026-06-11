/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 */
import React from 'react';

import {
  useDispatch,
  useFieldState,
  useSelectedScope,
} from '../../core/context';
import { EmptyEditor } from './EmptyEditor';
import { FieldFormPreview } from './FieldFormPreview';

export const Editor: React.FC = () => {
  const fieldState = useFieldState();
  const dispatch = useDispatch();
  const [selectedScope, setSelectedScope] = useSelectedScope();

  // Auch strukturelle Elemente (Spalten-Layout ohne Felder) zeigen
  const hasFieldStateContent =
    Object.keys(fieldState.schema.properties ?? {}).length > 0 ||
    fieldState.uiSchema.elements.length > 0;

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
