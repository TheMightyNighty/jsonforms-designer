import React, {
  ComponentType,
  useCallback,
  useEffect,
  useMemo,
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
import {
  FormularEintrag,
  UNBENANNTES_FORMULAR,
} from './core/api/formularAblage';
import { EmptySchemaService, SchemaService } from './core/api/schemaService';
import { EditorContextInstance, FormularVerwaltung } from './core/context';
import { EditorAction } from './core/model/actions';
import {
  createSetFieldStateAction,
  createSetFormMetadataAction,
} from './core/model/addFieldActions';
import { matchesElementKey } from './core/model/addFieldReducer';
import {
  HISTORY_WRAP,
  HistoryAction,
  historyReducer,
  REDO,
  UNDO,
} from './core/model/historyReducer';
import {
  createInitialEditorState,
  emptyFieldState,
} from './core/model/reducer';
import { SpeicherStatus } from './core/model/speicherStatus';
import { UiElement } from './core/model/uiElements';
import { fieldStateFromSchemas } from './core/util/fieldStateFromSchemas';
import { I18nProvider } from './i18n';
import { JsonFormsEditorUi } from './JsonFormsEditorUi';

const defaultSchemaService = new EmptySchemaService();
const defaultOnError = (error: unknown, context: string) =>
  console.error(`[JSONForms Designer] ${context}`, error);
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
   * Zentraler Fehlerkanal (Auto-Save-Fehler, Lade-Fehler, Render-Fehler der
   * ErrorBoundary). Default: console.error. Betriebs-Hosts können hier ihr
   * Fehler-Reporting anschließen.
   */
  onError?: (error: unknown, context: string) => void;
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
  onError,
  fieldStateStorage = defaultFieldStateStorage,
}) => {
  const reportError = useCallback(
    (error: unknown, context: string) =>
      (onError ?? defaultOnError)(error, context),
    [onError],
  );
  // Gespeicherten Zustand genau einmal laden. Synchrone Adapter (localStorage)
  // fließen ohne Zwischenrender in den Initial-State; asynchrone Adapter
  // (Server) werden nach dem Mount per SET_FIELD_STATE hydriert.
  const [initialLoad] = useState(() => {
    try {
      return fieldStateStorage.load();
    } catch (err) {
      reportError(err, 'Formular-Zustand konnte nicht geladen werden');
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

  // ── Formular-Ablage (ADR 0006) ────────────────────────────────────────
  // Nur vorhanden, wenn der Persistenz-Adapter eine mitbringt. Die Liste
  // liegt im State, damit die Oberfläche nach jeder Ablage-Änderung neu
  // rendert — die Ablage selbst ist keine React-Quelle.
  const ablage = fieldStateStorage.ablage;
  const [ablageListe, setAblageListe] = useState<FormularEintrag[]>([]);
  const [aktuelleFormularId, setAktuelleFormularId] = useState<
    string | undefined
  >(() => ablage?.aktuelleId());

  const ablageAuffrischen = useCallback(async () => {
    if (!ablage) return;
    try {
      setAblageListe(await ablage.liste());
      setAktuelleFormularId(ablage.aktuelleId());
    } catch (err) {
      reportError(err, 'Formular-Ablage konnte nicht gelesen werden');
    }
  }, [ablage, reportError]);

  useEffect(() => {
    void ablageAuffrischen();
  }, [ablageAuffrischen, fieldState]);

  const formularAblage: FormularVerwaltung | undefined = useMemo(() => {
    if (!ablage) return undefined;
    return {
      liste: ablageListe,
      aktuelles: ablageListe.find((e) => e.id === aktuelleFormularId),
      neu: () => {
        void (async () => {
          try {
            const leer = { ...emptyFieldState };
            const eintrag = await ablage.speichernAls(
              UNBENANNTES_FORMULAR,
              leer,
            );
            setAktuelleFormularId(eintrag.id);
            dispatch(createSetFieldStateAction(leer));
            setSelectedScope(null);
          } catch (err) {
            reportError(err, 'Neues Formular konnte nicht angelegt werden');
          }
        })();
      },
      oeffnen: (id) => {
        void (async () => {
          try {
            const geladen = await ablage.oeffnen(id);
            if (!geladen) return;
            // Erst die Ablage umstellen, dann den Zustand: Der Auto-Save
            // läuft nach dem Render und schreibt dann bereits ins neue
            // Formular statt das alte zu überschreiben.
            ablage.setzeAktuelleId(id);
            setAktuelleFormularId(id);
            dispatch(createSetFieldStateAction(geladen));
            setSelectedScope(null);
          } catch (err) {
            reportError(err, 'Formular konnte nicht geöffnet werden');
          }
        })();
      },
      speichernAls: (name) => {
        void (async () => {
          try {
            const eintrag = await ablage.speichernAls(name, fieldState);
            setAktuelleFormularId(eintrag.id);
            // Der Name ist der Formulartitel — beides auseinanderlaufen zu
            // lassen wäre die Quelle ewiger Verwirrung.
            dispatch(createSetFormMetadataAction({ title: name }));
          } catch (err) {
            reportError(err, 'Formular konnte nicht abgelegt werden');
          }
        })();
      },
      umbenennen: (name) => {
        dispatch(createSetFormMetadataAction({ title: name }));
      },
      loeschen: (id) => {
        void (async () => {
          try {
            await ablage.loeschen(id);
            await ablageAuffrischen();
          } catch (err) {
            reportError(err, 'Formular konnte nicht gelöscht werden');
          }
        })();
      },
    };
  }, [
    ablage,
    ablageListe,
    aktuelleFormularId,
    dispatch,
    fieldState,
    reportError,
    ablageAuffrischen,
  ]);

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
        reportError(err, 'Formular-Zustand konnte nicht geladen werden'),
      );
    return () => {
      cancelled = true;
    };
  }, [initialLoad, dispatch]);

  // Sichtbarer Stand des Auto-Saves für die Kopfzeile. Der erste Lauf des
  // Effekts speichert den unveränderten Startzustand — deshalb beginnt der
  // Status bei 'unveraendert' und springt erst mit dem Ergebnis um.
  const [speicherStatus, setSpeicherStatus] = useState<SpeicherStatus>({
    art: 'unveraendert',
  });

  // Auto-Save bei jeder Zustandsänderung über den Persistenz-Adapter.
  useEffect(() => {
    let verworfen = false;
    const gespeichert = () =>
      !verworfen &&
      setSpeicherStatus({ art: 'gespeichert', zeitpunkt: Date.now() });
    const fehlgeschlagen = (err: unknown) => {
      if (!verworfen) setSpeicherStatus({ art: 'fehler' });
      reportError(err, 'Auto-Save fehlgeschlagen');
    };

    try {
      const ergebnis = fieldStateStorage.save(fieldState);
      if (ergebnis instanceof Promise) {
        setSpeicherStatus({ art: 'speichert' });
        void ergebnis.then(gespeichert).catch(fehlgeschlagen);
      } else {
        gespeichert();
      }
    } catch (err) {
      fehlgeschlagen(err);
    }
    // Ein noch laufender Speichervorgang darf den Status nicht mehr
    // überschreiben, wenn längst die nächste Änderung gespeichert wird.
    return () => {
      verworfen = true;
    };
  }, [fieldState, fieldStateStorage]);

  // Extern bereitgestellte Schemas (SchemaService) werden in den
  // Form-First-Zustand konvertiert. Liefert der Service nichts (Default),
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
        reportError(err, 'SchemaService konnte nicht geladen werden'),
      );
    return () => {
      cancelled = true;
    };
  }, [schemaService, dispatch]);

  // Selektion aufräumen, wenn das Element nicht mehr existiert
  useEffect(() => {
    if (!selectedScope) return;
    function existsInUiSchema(elements: UiElement[], key: string): boolean {
      for (const el of elements) {
        if (matchesElementKey(el, key)) return true;
        if (el.type === 'ColumnContainer')
          for (const col of el.columns) {
            if (existsInUiSchema(col, key)) return true;
          }
        if (el.type === 'GroupContainer') {
          if (existsInUiSchema(el.children, key)) return true;
        }
      }
      return false;
    }
    const stillExists = existsInUiSchema(
      fieldState.uiSchema.elements,
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
              reportError,
              fieldState,
              speicherStatus,
              formularAblage,
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
