import React, { Dispatch, useContext } from 'react';

import { UpdateFieldPropertyAction } from '../../properties/fieldPropertiesActions';
import { FormularEintrag } from '../api/formularAblage';
import { EditorAction } from '../model/actions';
import { AddFieldAction } from '../model/addFieldActions';
import { FieldAwareState } from '../model/addFieldReducer';
import { SpeicherStatus } from '../model/speicherStatus';

export type FieldAction = AddFieldAction | UpdateFieldPropertyAction;

export interface EditorContext {
  dispatch: Dispatch<EditorAction>;
  /** Zentraler Fehlerkanal — Host-konfigurierbar über die onError-Prop. */
  reportError: (error: unknown, context: string) => void;
  fieldState: FieldAwareState;
  /** Stand des Auto-Saves — speist die Statuszeile der Kopfzeile. */
  speicherStatus: SpeicherStatus;
  /**
   * Verwaltung mehrerer benannter Formulare (ADR 0006). `undefined`, wenn
   * der Persistenz-Adapter des Hosts keine Ablage mitbringt — dann bleibt
   * es beim Ein-Dokument-Betrieb und die Menüpunkte entfallen.
   */
  formularAblage?: FormularVerwaltung;
  selectedScope: string | null;
  setSelectedScope: (scope: string | null) => void;
  /** Undo letzte Aktion */
  undo: () => void;
  /** Redo letzte rückgängig gemachte Aktion */
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Was die Oberfläche von der Ablage braucht. Kapselt die Schreibzugriffe,
 * damit Kopfzeile und Dialog nicht selbst Zustand und Ablage synchron
 * halten müssen.
 */
export interface FormularVerwaltung {
  /** Kopfdaten aller abgelegten Formulare, zuletzt geändertes zuerst. */
  liste: FormularEintrag[];
  /** Eintrag des gerade bearbeiteten Formulars, falls bekannt. */
  aktuelles: FormularEintrag | undefined;
  /** Legt ein leeres Formular an und öffnet es. */
  neu: () => void;
  /** Öffnet ein abgelegtes Formular. */
  oeffnen: (id: string) => void;
  /** Legt den aktuellen Stand als neues Formular ab. */
  speichernAls: (name: string) => void;
  /** Ändert den Namen — und damit den Formulartitel. */
  umbenennen: (name: string) => void;
  /** Löscht ein abgelegtes Formular. */
  loeschen: (id: string) => void;
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

export const useSpeicherStatus = (): SpeicherStatus => {
  const { speicherStatus } = useEditorContext();
  return speicherStatus;
};

export const useFormularAblage = ():
  | EditorContext['formularAblage']
  | undefined => {
  const { formularAblage } = useEditorContext();
  return formularAblage;
};

export const useReportError = (): EditorContext['reportError'] => {
  const { reportError } = useEditorContext();
  return reportError;
};
