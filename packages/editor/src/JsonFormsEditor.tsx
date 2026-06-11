import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
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
  CategorizationService,
  CategorizationServiceImpl,
} from './core/api/categorizationService';
import {
  FieldStateStorageService,
  LocalStorageFieldStateService,
} from './core/api/fieldStateStorage';
import {
  DefaultPaletteService,
  PaletteService,
} from './core/api/paletteService';
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
import { SelectedElement } from './core/selection';
import { fieldStateFromSchemas } from './core/util/fieldStateFromSchemas';
import { tryFindByUUID } from './core/util/schemasUtil';
import { defaultEditorRenderers } from './editor';
import { I18nProvider } from './i18n';
import { JsonFormsEditorUi } from './JsonFormsEditorUi';
import {
  defaultPropertyRenderers,
  defaultSchemaProviders,
  PropertiesService,
  PropertiesServiceImpl,
  PropertySchemasDecorator,
  PropertySchemasProvider,
} from './properties';

const defaultSchemaService = new EmptySchemaService();
const defaultPaletteService = new DefaultPaletteService();
const defaultCategorizationService = new CategorizationServiceImpl();
const defaultFieldStateStorage = new LocalStorageFieldStateService();
const defaultPropertiesServiceFactory = (
  providers: PropertySchemasProvider[],
  decorators: PropertySchemasDecorator[],
): PropertiesService => new PropertiesServiceImpl(providers, decorators);

export interface JsonFormsEditorProps {
  schemaProviders?: PropertySchemasProvider[];
  schemaDecorators?: PropertySchemasDecorator[];
  schemaService?: SchemaService;
  paletteService?: PaletteService;
  categorizationService?: CategorizationService;
  propertiesServiceProvider?: (
    providers: PropertySchemasProvider[],
    decorators: PropertySchemasDecorator[],
  ) => PropertiesService;
  editorRenderers?: JsonFormsRendererRegistryEntry[];
  propertyRenderers?: JsonFormsRendererRegistryEntry[];
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
  schemaProviders = defaultSchemaProviders,
  schemaDecorators = [],
  schemaService = defaultSchemaService,
  paletteService = defaultPaletteService,
  categorizationService = defaultCategorizationService,
  propertiesServiceProvider = defaultPropertiesServiceFactory,
  editorRenderers = defaultEditorRenderers,
  propertyRenderers = defaultPropertyRenderers,
  header,
  footer,
  config,
  fieldStateStorage = defaultFieldStateStorage,
}) => {
  const propertiesService = React.useMemo(
    () => propertiesServiceProvider(schemaProviders, schemaDecorators),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
      const base = createInitialEditorState({ categorizationService });
      if (initialLoad && !(initialLoad instanceof Promise)) {
        base.fieldState = initialLoad;
      }
      return { past: [], present: base, future: [] };
    },
  );

  const { present: editorState } = historyState;
  const { schema, uiSchema, fieldState } = editorState;

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

  const [selection, setSelection] = useState<SelectedElement>(undefined);
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

  useEffect(() => {
    setSelection((prev) => {
      if (!prev) return prev;
      return tryFindByUUID(uiSchema, prev.uuid) ? prev : undefined;
    });
  }, [uiSchema]);

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
              schemaService,
              paletteService,
              propertiesService,
              schema,
              uiSchema,
              dispatch,
              selection,
              setSelection,
              categorizationService,
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
              editorRenderers={editorRenderers}
              propertyRenderers={propertyRenderers}
              header={headerComponent}
              footer={footerComponent}
            />
          </EditorContextInstance.Provider>
        </DndProvider>
      </I18nProvider>
    </EditorConfigProvider>
  );
};
