import React, {
  ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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
import {
  ErweiterterI18nProvider,
  ErweiterungenProvider,
} from './erweiterung/ErweiterungenProvider';
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

/** Steckt der Scope irgendwo im Baum — auch in Spalten und Gruppen? */
function existiertImUiSchema(elements: UiElement[], key: string): boolean {
  for (const el of elements) {
    if (matchesElementKey(el, key)) return true;
    if (el.type === 'ColumnContainer')
      for (const col of el.columns) {
        if (existiertImUiSchema(col, key)) return true;
      }
    if (el.type === 'GroupContainer') {
      if (existiertImUiSchema(el.children, key)) return true;
    }
  }
  return false;
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
  // Ein Host darf `onError` inline übergeben. Dann wechselt `reportError`
  // bei jedem Render die Identität, und ein Effekt, der davon abhängt,
  // liefe endlos. Die Lade-Effekte melden deshalb über diese stabile
  // Fassade und hängen nicht am Fehlerkanal.
  const reportErrorRef = useRef(reportError);
  useEffect(() => {
    reportErrorRef.current = reportError;
  }, [reportError]);
  const meldeFehler = useCallback(
    (error: unknown, context: string) => reportErrorRef.current(error, context),
    [],
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

  // Beim Start einmal lesen. Danach frischt der Auto-Save auf — er
  // schreibt den Index, und vorher gelesen wäre er stets einen Schritt
  // hinterher.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Außensynchronisation, kein abgeleiteter Zustand (siehe Kommentar darüber)
    void ablageAuffrischen();
  }, [ablageAuffrischen]);

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
        meldeFehler(err, 'Formular-Zustand konnte nicht geladen werden'),
      );
    return () => {
      cancelled = true;
    };
  }, [initialLoad, dispatch, meldeFehler]);

  // Sichtbarer Stand des Auto-Saves für die Kopfzeile. Der erste Lauf des
  // Effekts speichert den unveränderten Startzustand — deshalb beginnt der
  // Status bei 'unveraendert' und springt erst mit dem Ergebnis um.
  const [speicherStatus, setSpeicherStatus] = useState<SpeicherStatus>({
    art: 'unveraendert',
  });

  // Auto-Save bei jeder Zustandsänderung über den Persistenz-Adapter.
  useEffect(() => {
    let verworfen = false;
    const gespeichert = () => {
      if (verworfen) return;
      setSpeicherStatus({ art: 'gespeichert', zeitpunkt: Date.now() });
      // Der Auto-Save schreibt auch den Ablage-Index (Name, Zeitstempel) —
      // die Liste danach neu lesen, nicht davor.
      void ablageAuffrischen();
    };
    const fehlgeschlagen = (err: unknown) => {
      if (!verworfen) setSpeicherStatus({ art: 'fehler' });
      reportError(err, 'Auto-Save fehlgeschlagen');
    };

    try {
      const ergebnis = fieldStateStorage.save(fieldState);
      if (ergebnis instanceof Promise) {
        // Der Speicherstatus gehört zum Schreibvorgang selbst.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Außensynchronisation, kein abgeleiteter Zustand (siehe Kommentar darüber)
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
    // ablageAuffrischen ist über useCallback stabil; reportError bewusst
    // nicht in den Abhängigkeiten (siehe die übrigen Effekte).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldState, fieldStateStorage, ablageAuffrischen]);

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
        meldeFehler(err, 'SchemaService konnte nicht geladen werden'),
      );
    return () => {
      cancelled = true;
    };
  }, [schemaService, dispatch, meldeFehler]);

  // Eine Selektion gilt nur, solange es das Element noch gibt. Abgeleitet
  // statt im Effekt zurückgesetzt: Der Zustand selbst bleibt stehen, damit
  // Rückgängig die Auswahl wieder mitbringt, und die Oberfläche sieht
  // zwischendurch nie einen Verweis ins Leere.
  const wirksamerScope = useMemo(() => {
    if (!selectedScope) return null;
    return existiertImUiSchema(fieldState.uiSchema.elements, selectedScope)
      ? selectedScope
      : null;
  }, [fieldState, selectedScope]);

  const headerComponent = header === null ? undefined : header;
  const footerComponent = footer === null ? undefined : footer;

  return (
    <EditorConfigProvider config={config}>
      <ErweiterungenProvider>
        <ErweiterterI18nProvider defaultLocale="de">
          <DndProvider backend={HTML5Backend}>
            <EditorContextInstance.Provider
              value={{
                dispatch,
                reportError,
                fieldState,
                speicherStatus,
                formularAblage,
                selectedScope: wirksamerScope,
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
        </ErweiterterI18nProvider>
      </ErweiterungenProvider>
    </EditorConfigProvider>
  );
};
