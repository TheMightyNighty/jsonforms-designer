/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 */
import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import React from 'react';

import {
  useDispatch,
  useFieldState,
  useSelectedScope,
} from '../../core/context';
import { EmptyEditor } from './EmptyEditor';
import { FieldFormPreview } from './FieldFormPreview';

export interface EditorProps {
  /**
   * @deprecated Seit der State-Konsolidierung (ADR 0001) rendert der Editor
   * ausschließlich Form-First; der frühere JSONForms-Baum-Canvas und seine
   * Renderer werden nicht mehr verwendet. Prop bleibt für API-Kompatibilität.
   */
  editorRenderers?: JsonFormsRendererRegistryEntry[];
}

export const Editor: React.FC<EditorProps> = () => {
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
