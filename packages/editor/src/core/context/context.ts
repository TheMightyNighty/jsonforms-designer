import React, { Dispatch,useContext } from 'react';

import { UpdateFieldPropertyAction } from '../../properties/fieldPropertiesActions';
import { CategorizationService } from '../api/categorizationService';
import { PaletteService } from '../api/paletteService';
import { SchemaService } from '../api/schemaService';
import { SchemaElement } from '../model';
import { EditorAction } from '../model/actions';
import { AddFieldAction } from '../model/addFieldActions';
import { FieldAwareState } from '../model/addFieldReducer';
import { EditorUISchemaElement } from '../model/uischema';
import { PropertiesService } from '../properties/propertiesService';
import { SelectedElement } from '../selection';

export type FieldAction = AddFieldAction | UpdateFieldPropertyAction;

export interface EditorContext {
  schemaService: SchemaService;
  paletteService: PaletteService;
  propertiesService: PropertiesService;
  schema: SchemaElement | undefined;
  uiSchema: EditorUISchemaElement | undefined;
  dispatch: Dispatch<EditorAction>;
  selection: SelectedElement;
  setSelection: (selection: SelectedElement) => void;
  categorizationService: CategorizationService;
  fieldState: FieldAwareState;
  selectedScope: string | null;
  setSelectedScope: (scope: string | null) => void;
  /** Undo letzte Aktion */
  undo: () => void;
  /** Redo letzte rückgängig gemachte Aktion */
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const EditorContextInstance = React.createContext<EditorContext>(
  undefined as unknown as EditorContext,
);

export const useEditorContext = (): EditorContext =>
  useContext(EditorContextInstance);

export const useGitLabService = (): SchemaService => {
  const { schemaService } = useEditorContext();
  return schemaService;
};

export const useSchema = (): SchemaElement | undefined => {
  const { schema } = useEditorContext();
  return schema;
};

export const useUiSchema = (): EditorUISchemaElement | undefined => {
  const { uiSchema } = useEditorContext();
  return uiSchema;
};

export const useSelection = (): [
  SelectedElement,
  (selection: SelectedElement) => void,
] => {
  const { selection, setSelection } = useEditorContext();
  return [selection, setSelection];
};

export const useDispatch = (): Dispatch<EditorAction> => {
  const { dispatch } = useEditorContext();
  return dispatch;
};

export const usePaletteService = (): PaletteService => {
  const { paletteService } = useEditorContext();
  return paletteService;
};

export const usePropertiesService = (): PropertiesService => {
  const { propertiesService } = useEditorContext();
  return propertiesService;
};

export const useCategorizationService = (): CategorizationService => {
  const { categorizationService } = useEditorContext();
  return categorizationService;
};

export const useFieldState = (): FieldAwareState => {
  const { fieldState } = useEditorContext();
  return fieldState;
};

export const useSelectedScope = (): [
  string | null,
  (scope: string | null) => void,
] => {
  const { selectedScope, setSelectedScope } = useEditorContext();
  return [selectedScope, setSelectedScope];
};

export const useUndoRedo = () => {
  const { undo, redo, canUndo, canRedo } = useEditorContext();
  return { undo, redo, canUndo, canRedo };
};
