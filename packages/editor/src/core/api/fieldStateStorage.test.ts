/**
 * Tests für den Persistenz-Adapter (FieldStateStorageService) und die
 * Default-Implementierung LocalStorageFieldStateService.
 */
import { describe, expect, it } from 'vitest';

import { FieldAwareState } from '../model/addFieldReducer';
import {
  FIELD_STATE_STORAGE_KEY,
  LocalStorageFieldStateService,
  normalizeFieldState,
} from './fieldStateStorage';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function sampleState(): FieldAwareState {
  return {
    schema: {
      type: 'object',
      properties: { vorname: { type: 'string', title: 'Vorname' } },
      required: ['vorname'],
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [{ type: 'Control', scope: '#/properties/vorname' }],
    },
    tabs: [{ label: 'Schritt 1' }],
    activeTabIndex: 0,
    tabAssignments: { '#/properties/vorname': 0 },
    lineNumbersEnabled: true,
    sectionColors: { col_1: '#004A99' },
  };
}

/** Map-basierter Storage-Fake (kein jsdom-localStorage nötig). */
function fakeStorage(initial?: Record<string, string>) {
  const map = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    dump: () => Object.fromEntries(map),
  };
}

// ---------------------------------------------------------------------------
// normalizeFieldState
// ---------------------------------------------------------------------------

describe('normalizeFieldState()', () => {
  it('gibt undefined zurück wenn schema oder uiSchema fehlen', () => {
    expect(normalizeFieldState(undefined)).toBeUndefined();
    expect(normalizeFieldState(null)).toBeUndefined();
    expect(normalizeFieldState({})).toBeUndefined();
    expect(normalizeFieldState({ schema: { type: 'object' } })).toBeUndefined();
    expect(
      normalizeFieldState({ uiSchema: { type: 'VerticalLayout' } }),
    ).toBeUndefined();
  });

  it('füllt fehlende Felder mit Defaults', () => {
    const result = normalizeFieldState({
      schema: { type: 'object', properties: {} },
      uiSchema: { type: 'VerticalLayout', elements: [] },
    });
    expect(result).toMatchObject({
      tabs: [],
      activeTabIndex: 0,
      tabAssignments: {},
      lineNumbersEnabled: false,
      sectionColors: {},
    });
  });

  it('entfernt Prototype-Pollution-Schlüssel rekursiv', () => {
    const raw = JSON.parse(
      '{"schema":{"type":"object","properties":{"a":{"type":"string","__proto__":{"polluted":true}}}},' +
        '"uiSchema":{"type":"VerticalLayout","elements":[]},' +
        '"constructor":{"prototype":{"polluted":true}}}',
    );
    const result = normalizeFieldState(raw);
    expect(result).toBeDefined();
    const props = result!.schema.properties as Record<string, object>;
    expect(Object.keys(props.a)).not.toContain('__proto__');
    // Globaler Prototyp blieb unangetastet
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// LocalStorageFieldStateService
// ---------------------------------------------------------------------------

describe('LocalStorageFieldStateService', () => {
  it('Roundtrip: save() → load() liefert den identischen Zustand', () => {
    const storage = fakeStorage();
    const service = new LocalStorageFieldStateService(undefined, storage);
    const state = sampleState();

    service.save(state);
    expect(service.load()).toEqual(state);
  });

  it('benutzt den dokumentierten Default-Schlüssel', () => {
    const storage = fakeStorage();
    const service = new LocalStorageFieldStateService(undefined, storage);
    service.save(sampleState());
    expect(Object.keys(storage.dump())).toEqual([FIELD_STATE_STORAGE_KEY]);
  });

  it('load() liefert undefined wenn nichts gespeichert ist', () => {
    const service = new LocalStorageFieldStateService(undefined, fakeStorage());
    expect(service.load()).toBeUndefined();
  });

  it('load() liefert undefined bei korruptem JSON', () => {
    const storage = fakeStorage({ [FIELD_STATE_STORAGE_KEY]: '{nicht json' });
    const service = new LocalStorageFieldStateService(undefined, storage);
    expect(service.load()).toBeUndefined();
  });

  it('load() liefert undefined bei unvollständigen Daten', () => {
    const storage = fakeStorage({
      [FIELD_STATE_STORAGE_KEY]: '{"schema":{"type":"object"}}',
    });
    const service = new LocalStorageFieldStateService(undefined, storage);
    expect(service.load()).toBeUndefined();
  });

  it('save() schluckt Storage-Fehler (Quota / Private Mode)', () => {
    const service = new LocalStorageFieldStateService(undefined, {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(() => service.save(sampleState())).not.toThrow();
  });

  it('funktioniert ohne verfügbaren Storage (SSR)', () => {
    const service = new LocalStorageFieldStateService(undefined, undefined);
    expect(service.load()).toBeUndefined();
    expect(() => service.save(sampleState())).not.toThrow();
  });

  it('eigener Schlüssel wird respektiert', () => {
    const storage = fakeStorage();
    const service = new LocalStorageFieldStateService('mein_key', storage);
    service.save(sampleState());
    expect(Object.keys(storage.dump())).toEqual(['mein_key']);
    expect(service.load()).toBeDefined();
  });
});
