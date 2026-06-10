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
  DefaultPaletteService,
  PaletteService,
} from './core/api/paletteService';
import { EmptySchemaService, SchemaService } from './core/api/schemaService';
import { EditorContextInstance } from './core/context';
import { Actions } from './core/model';
import { EditorAction } from './core/model/actions';
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
import { sanitizeParsedJson } from './core/util/sanitizeJson';
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
}) => {
  const propertiesService = React.useMemo(
    () => propertiesServiceProvider(schemaProviders, schemaDecorators),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // History-Reducer statt direktem editorReducer
  const [historyState, historyDispatch] = useReducer(
    historyReducer,
    undefined,
    () => {
      const base = createInitialEditorState({ categorizationService });
      try {
        const saved = localStorage.getItem('jfd_fieldState_v1');
        if (saved) {
          const parsed = sanitizeParsedJson(JSON.parse(saved));
          if (parsed?.schema && parsed?.uiSchema) {
            base.fieldState = {
              schema: parsed.schema,
              uiSchema: parsed.uiSchema,
              tabs: parsed.tabs ?? [],
              activeTabIndex: parsed.activeTabIndex ?? 0,
              tabAssignments: parsed.tabAssignments ?? {},
              lineNumbersEnabled: parsed.lineNumbersEnabled ?? false,
              sectionColors: parsed.sectionColors ?? {},
            };
          }
        }
      } catch {
        /* corrupted or missing — start fresh */
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

  const STORAGE_KEY = 'jfd_fieldState_v1';
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fieldState));
    } catch {
      /* storage quota or private mode — ignore */
    }
  }, [fieldState]);

  useEffect(() => {
    schemaService.getSchema().then((s) => {
      if (s) dispatch(Actions.setSchema(s));
    });
    schemaService.getUiSchema().then((u) => {
      if (u) dispatch(Actions.setUiSchema(u));
    });
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
