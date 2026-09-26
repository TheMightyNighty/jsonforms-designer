import { describe, expect, it } from 'vitest';

import { normalizeFieldState } from '../api/fieldStateStorage';
import { createIgnoriereTypvorschlagAction } from './addFieldActions';
import { createInitialEditorState, editorReducer } from './reducer';

const SCOPE = '#/properties/geburtsdatum';

describe('IGNORIERE_TYPVORSCHLAG', () => {
  it('merkt sich die Entscheidung je Feld', () => {
    const next = editorReducer(
      createInitialEditorState(),
      createIgnoriereTypvorschlagAction(SCOPE, true),
    );
    expect(next.fieldState.typvorschlagIgnoriert).toEqual({ [SCOPE]: true });
  });

  it('nimmt die Entscheidung zurück, statt false zu speichern', () => {
    let state = editorReducer(
      createInitialEditorState(),
      createIgnoriereTypvorschlagAction(SCOPE, true),
    );
    state = editorReducer(
      state,
      createIgnoriereTypvorschlagAction(SCOPE, false),
    );
    expect(state.fieldState.typvorschlagIgnoriert).toEqual({});
  });

  it('lässt andere Felder unberührt', () => {
    let state = editorReducer(
      createInitialEditorState(),
      createIgnoriereTypvorschlagAction(SCOPE, true),
    );
    state = editorReducer(
      state,
      createIgnoriereTypvorschlagAction('#/properties/iban', true),
    );
    expect(Object.keys(state.fieldState.typvorschlagIgnoriert)).toEqual([
      SCOPE,
      '#/properties/iban',
    ]);
  });

  it('fasst Schema und UI-Schema nicht an — die Angabe gehört nicht in den Export', () => {
    const vorher = createInitialEditorState();
    const nachher = editorReducer(
      vorher,
      createIgnoriereTypvorschlagAction(SCOPE, true),
    );
    expect(nachher.fieldState.schema).toBe(vorher.fieldState.schema);
    expect(nachher.fieldState.uiSchema).toBe(vorher.fieldState.uiSchema);
  });
});

describe('Persistenzformat (ADR 0002/V2)', () => {
  it('lädt einen Stand ohne typvorschlagIgnoriert als leeres Gedächtnis', () => {
    const alt = normalizeFieldState({
      schema: { type: 'object', properties: {} },
      uiSchema: { type: 'VerticalLayout', elements: [] },
    });
    expect(alt?.typvorschlagIgnoriert).toEqual({});
  });

  it('übernimmt ein vorhandenes Gedächtnis unverändert', () => {
    const geladen = normalizeFieldState({
      schema: { type: 'object', properties: {} },
      uiSchema: { type: 'VerticalLayout', elements: [] },
      typvorschlagIgnoriert: { [SCOPE]: true },
    });
    expect(geladen?.typvorschlagIgnoriert).toEqual({ [SCOPE]: true });
  });
});
