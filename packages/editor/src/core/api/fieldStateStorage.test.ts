/**
 * Tests für den Persistenz-Adapter (FieldStateStorageService) und die
 * Default-Implementierung LocalStorageFieldStateService.
 */
import { describe, expect, it, vi } from 'vitest';

import { FieldAwareState } from '../model/addFieldReducer';
import {
  FIELD_STATE_STORAGE_KEY,
  HttpFieldStateService,
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
      elements: [
        { id: 'ctrl_v', type: 'Control', scope: '#/properties/vorname' },
      ],
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

// ---------------------------------------------------------------------------
// HttpFieldStateService
// ---------------------------------------------------------------------------

describe('HttpFieldStateService', () => {
  function fetchStub(
    status: number,
    payload?: unknown,
  ): { fn: typeof fetch; calls: Array<{ url: string; init?: RequestInit }> } {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fn = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => payload,
      };
    }) as unknown as typeof fetch;
    return { fn, calls };
  }

  it('load(): liefert normalisierten Zustand', async () => {
    const { fn } = fetchStub(200, {
      schema: { type: 'object', properties: {} },
      uiSchema: { type: 'VerticalLayout', elements: [] },
    });
    const service = new HttpFieldStateService('/api/form/1', { fetchFn: fn });
    const state = await service.load();
    expect(state).toMatchObject({ tabs: [], activeTabIndex: 0 });
  });

  it('load(): 404 → undefined (noch kein Formular)', async () => {
    const { fn } = fetchStub(404);
    const service = new HttpFieldStateService('/api/form/1', { fetchFn: fn });
    expect(await service.load()).toBeUndefined();
  });

  it('load(): Serverfehler wirft', async () => {
    const { fn } = fetchStub(503);
    const service = new HttpFieldStateService('/api/form/1', { fetchFn: fn });
    await expect(service.load()).rejects.toThrow(/HTTP 503/);
  });

  it('save(): debounct — viele Aufrufe, ein PUT mit letztem Stand', async () => {
    vi.useFakeTimers();
    try {
      const { fn, calls } = fetchStub(200);
      const service = new HttpFieldStateService('/api/form/1', {
        fetchFn: fn,
        debounceMs: 500,
        headers: { Authorization: 'Bearer x' },
      });
      const a = sampleState();
      const b = { ...sampleState(), activeTabIndex: 1 };
      service.save(a);
      service.save(b);
      service.save(b);
      expect(calls).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(600);
      expect(calls).toHaveLength(1);
      expect(calls[0].init?.method).toBe('PUT');
      expect(calls[0].init?.headers).toMatchObject({
        Authorization: 'Bearer x',
      });
      expect(JSON.parse(String(calls[0].init?.body)).activeTabIndex).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('save(): Fehler landen im onSaveError-Kanal', async () => {
    vi.useFakeTimers();
    try {
      const { fn } = fetchStub(500);
      const errors: unknown[] = [];
      const service = new HttpFieldStateService('/api/form/1', {
        fetchFn: fn,
        debounceMs: 10,
        onSaveError: (e) => errors.push(e),
      });
      service.save(sampleState());
      await vi.advanceTimersByTimeAsync(50);
      expect(errors).toHaveLength(1);
      expect(String(errors[0])).toMatch(/HTTP 500/);
    } finally {
      vi.useRealTimers();
    }
  });
});
