/**
 * Undo/Redo via History-Stack
 *
 * Wrapper um editorReducer: speichert bis zu MAX_HISTORY EditorState-Snapshots.
 * ADD_FIELD, REMOVE_FIELD, UPDATE_FIELD_PROPERTY, LOAD_TEMPLATE, SET_FIELD_STATE,
 * Tab-Actions und Baum-Actions erzeugen einen neuen Eintrag.
 * UNDO / REDO navigieren durch den Stack.
 *
 * Nutzung in JsonFormsEditor:
 *   const [historyState, historyDispatch] = useReducer(historyReducer, undefined, createInitialHistoryState);
 *   const editorState = historyState.present;
 *   const dispatch = (action) => historyDispatch({ type: 'HISTORY_WRAP', action });
 *   const canUndo = historyState.past.length > 0;
 *   const canRedo = historyState.future.length > 0;
 */

import { EditorState, editorReducer, createInitialEditorState } from './reducer';
import { EditorAction } from './actions';

const MAX_HISTORY = 50;

// ---------------------------------------------------------------------------
// Action-Typen
// ---------------------------------------------------------------------------

export const UNDO = 'UNDO' as const;
export const REDO = 'REDO' as const;
export const HISTORY_WRAP = 'HISTORY_WRAP' as const;

export interface UndoAction { type: typeof UNDO }
export interface RedoAction { type: typeof REDO }
export interface HistoryWrapAction {
  type: typeof HISTORY_WRAP;
  action: EditorAction;
}

export type HistoryAction = UndoAction | RedoAction | HistoryWrapAction;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface HistoryState {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
}

export function createInitialHistoryState(): HistoryState {
  return {
    past: [],
    present: createInitialEditorState({}),
    future: [],
  };
}

// ---------------------------------------------------------------------------
// Aktionen die keinen History-Eintrag erzeugen (nur lesend / navigierend)
// ---------------------------------------------------------------------------

const NO_HISTORY_ACTIONS = new Set([
  'jsonforms-editor/SET_SCHEMA',  // Initial-Load
  'jsonforms-editor/SET_UISCHEMA', // Initial-Load
  'SET_ACTIVE_TAB',               // Tab-Navigation ist kein undo-würdiger Schritt
]);

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function historyReducer(
  state: HistoryState,
  action: HistoryAction
): HistoryState {
  switch (action.type) {
    case UNDO: {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    case REDO: {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    }

    case HISTORY_WRAP: {
      const nextPresent = editorReducer(state.present, action.action);

      // Wenn sich nichts geändert hat, kein Eintrag
      if (nextPresent === state.present) return state;

      // Aktionen ohne History-Eintrag
      if (NO_HISTORY_ACTIONS.has(action.action.type)) {
        return { ...state, present: nextPresent };
      }

      const newPast = [...state.past, state.present];
      return {
        past: newPast.length > MAX_HISTORY ? newPast.slice(-MAX_HISTORY) : newPast,
        present: nextPresent,
        future: [], // Bei neuer Aktion Future leeren
      };
    }
  }
}
