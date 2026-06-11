import React, {
  ComponentType,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { EditorConfig, EditorConfigProvider } from './config';
import {
  FieldStateStorageService,
  LocalStorageFieldStateService,
} from './core/api/fieldStateStorage';
import { EmptySchemaService, SchemaService } from './core/api/schemaService';
import { EditorContextInstance } from './core/context';
import { EditorAction } from './core/model/actions';
import { createSetFieldStateAction } from './core/model/addFieldActions';
import {
  HISTORY_WRAP,
  HistoryAction,
  historyReducer,
  REDO,
  UNDO,
} from './core/model/historyReducer';
import { createInitialEditorState } from './core/model/reducer';
import { FlatElement } from './core/model/uiElements';
import { fieldStateFromSchemas } from './core/util/fieldStateFromSchemas';
import { I18nProvider } from './i18n';
import { JsonFormsEditorUi } from './JsonFormsEditorUi';

const defaultSchemaService = new EmptySchemaService();
const defaultFieldStateStorage = new LocalStorageFieldStateService();

export interface JsonFormsEditorProps {
  /**
   * Liefert beim Start ein extern verwaltetes Schema/UI-Schema; wird über
   * `fieldStateFromSchemas()` in den Form-First-Zustand konvertiert.
   */
  schemaService?: SchemaService;
  header?: ComponentType | null;
  footer?: ComponentType | null;
  /** Konfiguration für Module und Palette-Verhalten */
  config?: EditorConfig;
  /**
   * Persistenz-Adapter für den Formular-Zustand (Auto-Save / Laden beim
   * Start). Default: localStorage. Für Server-Speicherung eine eigene
   * FieldStateStorageService-Implementierung übergeben (siehe README).
   */
  fieldStateStorage?: FieldStateStorageService;
}

export const JsonFormsEditor: React.FC<JsonFormsEditorProps> = ({
  schemaService = defaultSchemaService,
  header,
  footer,
  config,
  fieldStateStorage = defaultFieldStateStorage,
}) => {
  // Gespeicherten Zustand genau einmal laden. Synchrone Adapter (localStorage)
  // fließen ohne Zwischenrender in den Initial-State; asynchrone Adapter
  // (Server) werden nach dem Mount per SET_FIELD_STATE hydriert.
  const [initialLoad] = useState(() => {
    try {
      return fieldStateStorage.load();
    } catch (err) {
      console.error('Formular-Zustand konnte nicht geladen werden', err);
      return undefined;
    }
  });

  // History-Reducer statt direktem editorReducer
  const [historyState, historyDispatch] = useReducer(
    historyReducer,
    undefined,
    () => {
      const base = createInitialEditorState();
      if (initialLoad && !(initialLoad instanceof Promise)) {
        base.fieldState = initialLoad;
      }
      return { past: [], present: base, future: [] };
    },
  );

  const { fieldState } = historyState.present;

  const dispatch = useCallback(
    (action: EditorAction) => {
      historyDispatch({ type: HISTORY_WRAP, action } as HistoryAction);
    },
    [historyDispatch],
  );

  const undo = useCallback(() => historyDispatch({ type: UNDO }), []);
  const redo = useCallback(() => historyDispatch({ type: REDO }), []);
  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;

  const [selectedScope, setSelectedScope] = useState<string | null>(null);

  // Asynchrone Hydration (Server-Adapter). Hinweis: läuft als regulärer
  // History-Schritt — direkt nach der Hydration ist ein Undo zum leeren
  // Formular möglich.
  useEffect(() => {
    if (!(initialLoad instanceof Promise)) return;
    let cancelled = false;
    initialLoad
      .then((state) => {
        if (state && !cancelled) {
          dispatch(createSetFieldStateAction(state));
        }
      })
      .catch((err) =>
        console.error('Formular-Zustand konnte nicht geladen werden', err),
      );
    return () => {
      cancelled = true;
    };
  }, [initialLoad, dispatch]);

  // Auto-Save bei jeder Zustandsänderung über den Persistenz-Adapter.
  useEffect(() => {
    try {
      void Promise.resolve(fieldStateStorage.save(fieldState)).catch((err) =>
        console.error('Auto-Save fehlgeschlagen', err),
      );
    } catch (err) {
      console.error('Auto-Save fehlgeschlagen', err);
    }
  }, [fieldState, fieldStateStorage]);

  // Extern bereitgestellte Schemas (SchemaService) werden in den
  // Form-First-Zustand konvertiert — fieldState ist die einzige
  // Laufzeit-Quelle (ADR 0001). Liefert der Service nichts (Default),
  // bleibt der per fieldStateStorage geladene Zustand bestehen.
  useEffect(() => {
    let cancelled = false;
    Promise.all([schemaService.getSchema(), schemaService.getUiSchema()])
      .then(([s, u]) => {
        if (cancelled) return;
        const converted = fieldStateFromSchemas(s, u);
        if (converted) {
          dispatch(createSetFieldStateAction(converted));
        }
      })
      .catch((err) =>
        console.error('SchemaService konnte nicht geladen werden', err),
      );
    return () => {
      cancelled = true;
    };
  }, [schemaService, dispatch]);

  // Selektion aufräumen, wenn das Element nicht mehr existiert
  useEffect(() => {
    if (!selectedScope) return;
    function existsInUiSchema(elements: FlatElement[], key: string): boolean {
      for (const el of elements) {
        if (el.scope === key || el.id === key) return true;
        if (el.columns)
          for (const col of el.columns) {
            if (existsInUiSchema(col, key)) return true;
          }
        if (el.children) {
          if (existsInUiSchema(el.children, key)) return true;
        }
      }
      return false;
    }
    const stillExists = existsInUiSchema(
      fieldState.uiSchema.elements as FlatElement[],
      selectedScope,
    );
    if (!stillExists) setSelectedScope(null);
  }, [fieldState, selectedScope]);

  const headerComponent = header === null ? undefined : header;
  const footerComponent = footer === null ? undefined : footer;

  return (
    <EditorConfigProvider config={config}>
      <I18nProvider defaultLocale="de">
        <DndProvider backend={HTML5Backend}>
          <EditorContextInstance.Provider
            value={{
              dispatch,
              fieldState,
              selectedScope,
              setSelectedScope,
              undo,
              redo,
              canUndo,
              canRedo,
            }}
          >
            <JsonFormsEditorUi
              header={headerComponent}
              footer={footerComponent}
            />
          </EditorContextInstance.Provider>
        </DndProvider>
      </I18nProvider>
    </EditorConfigProvider>
  );
};
