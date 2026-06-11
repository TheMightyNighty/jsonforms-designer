import React, { Dispatch, useContext } from 'react';

import { UpdateFieldPropertyAction } from '../../properties/fieldPropertiesActions';
import { EditorAction } from '../model/actions';
import { AddFieldAction } from '../model/addFieldActions';
import { FieldAwareState } from '../model/addFieldReducer';

export type FieldAction = AddFieldAction | UpdateFieldPropertyAction;

export interface EditorContext {
  dispatch: Dispatch<EditorAction>;
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

export const useDispatch = (): Dispatch<EditorAction> => {
  const { dispatch } = useEditorContext();
  return dispatch;
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
