import { describe, expect, it } from 'vitest';

import { FieldAwareState } from '../model/addFieldReducer';
import { emptyManifestMeta } from '../model/manifestMeta';
import {
  FIELD_STATE_STORAGE_KEY,
  LocalStorageFieldStateService,
} from './fieldStateStorage';
import {
  FORMULAR_AKTUELL_KEY,
  FORMULAR_INDEX_KEY,
  LocalStorageFormularAblage,
  nameAusZustand,
  UNBENANNTES_FORMULAR,
} from './formularAblage';

function zustand(titel?: string): FieldAwareState {
  return {
    schema: {
      type: 'object',
      ...(titel !== undefined ? { title: titel } : {}),
      properties: { a: { type: 'string', title: 'A' } },
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [{ id: 'c1', type: 'Control', scope: '#/properties/a' }],
    },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    sectionColors: {},
    manifestMeta: { ...emptyManifestMeta },
    typvorschlagIgnoriert: {},
  };
}

/** Map-basierter Storage-Fake mit stellbarer Uhr. */
function fakeStorage(initial?: Record<string, string>) {
  const map = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    dump: () => Object.fromEntries(map),
  };
}

/** Zeitquelle, die bei jedem Aufruf eine Sekunde weiterspringt. */
function uhr(start = Date.parse('2026-01-01T00:00:00.000Z')) {
  let t = start;
  return () => new Date((t += 1000));
}

describe('nameAusZustand', () => {
  it('nimmt den Formulartitel', () => {
    expect(nameAusZustand(zustand('Antrag auf Wohngeld'))).toBe(
      'Antrag auf Wohngeld',
    );
  });

  it('fällt ohne Titel auf einen Platzhalter zurück', () => {
    expect(nameAusZustand(zustand())).toBe(UNBENANNTES_FORMULAR);
    expect(nameAusZustand(zustand('   '))).toBe(UNBENANNTES_FORMULAR);
  });
});

describe('LocalStorageFormularAblage', () => {
  it('legt ein Formular an und findet es wieder', () => {
    const ablage = new LocalStorageFormularAblage(fakeStorage(), uhr());
    const eintrag = ablage.speichernAls('Wohngeld', zustand('Wohngeld'));

    expect(ablage.liste().map((e) => e.name)).toEqual(['Wohngeld']);
    expect(ablage.oeffnen(eintrag.id)).toBeDefined();
    expect(ablage.aktuelleId()).toBe(eintrag.id);
  });

  it('legt getrennte Schlüssel je Formular an', () => {
    const storage = fakeStorage();
    const ablage = new LocalStorageFormularAblage(storage, uhr());
    ablage.speichernAls('Eins', zustand('Eins'));
    ablage.speichernAls('Zwei', zustand('Zwei'));

    const schluessel = Object.keys(storage.dump());
    expect(schluessel).toContain(FORMULAR_INDEX_KEY);
    expect(schluessel).toContain(FORMULAR_AKTUELL_KEY);
    expect(
      schluessel.filter((k) => k.startsWith('jfd_formular_f_')),
    ).toHaveLength(2);
  });

  it('sortiert die Liste nach letzter Änderung, neueste zuerst', () => {
    const ablage = new LocalStorageFormularAblage(fakeStorage(), uhr());
    ablage.speichernAls('Alt', zustand('Alt'));
    ablage.speichernAls('Neu', zustand('Neu'));
    expect(ablage.liste().map((e) => e.name)).toEqual(['Neu', 'Alt']);
  });

  it('hält die Formulare inhaltlich getrennt', () => {
    const ablage = new LocalStorageFormularAblage(fakeStorage(), uhr());
    const eins = ablage.speichernAls('Eins', zustand('Eins'));
    const zwei = ablage.speichernAls('Zwei', zustand('Zwei'));

    expect((ablage.oeffnen(eins.id)!.schema as { title?: string }).title).toBe(
      'Eins',
    );
    expect((ablage.oeffnen(zwei.id)!.schema as { title?: string }).title).toBe(
      'Zwei',
    );
  });

  it('aktualisiert Inhalt, Namen und Zeitstempel des aktuellen Formulars', () => {
    const ablage = new LocalStorageFormularAblage(fakeStorage(), uhr());
    const eintrag = ablage.speichernAls('Vorher', zustand('Vorher'));
    const vorher = ablage.liste()[0].geaendertAm;

    ablage.aktualisiere(eintrag.id, zustand('Nachher'));

    const nachher = ablage.liste()[0];
    expect(nachher.name).toBe('Nachher');
    expect(nachher.geaendertAm > vorher).toBe(true);
    expect(
      (ablage.oeffnen(eintrag.id)!.schema as { title?: string }).title,
    ).toBe('Nachher');
  });

  it('legt beim Aktualisieren einer unbekannten id nichts an', () => {
    const ablage = new LocalStorageFormularAblage(fakeStorage(), uhr());
    ablage.aktualisiere('gibt-es-nicht', zustand('X'));
    expect(ablage.liste()).toEqual([]);
  });

  it('benennt um, ohne den Inhalt anzufassen', () => {
    const ablage = new LocalStorageFormularAblage(fakeStorage(), uhr());
    const eintrag = ablage.speichernAls('Alt', zustand('Alt'));
    ablage.umbenennen(eintrag.id, 'Neu');
    expect(ablage.liste()[0].name).toBe('Neu');
    expect(ablage.oeffnen(eintrag.id)).toBeDefined();
  });

  it('nimmt beim Umbenennen keinen leeren Namen an', () => {
    const ablage = new LocalStorageFormularAblage(fakeStorage(), uhr());
    const eintrag = ablage.speichernAls('Alt', zustand('Alt'));
    ablage.umbenennen(eintrag.id, '   ');
    expect(ablage.liste()[0].name).toBe(UNBENANNTES_FORMULAR);
  });

  it('löscht Eintrag und Inhalt und vergisst die aktuelle id', () => {
    const storage = fakeStorage();
    const ablage = new LocalStorageFormularAblage(storage, uhr());
    const eintrag = ablage.speichernAls('Weg', zustand('Weg'));

    ablage.loeschen(eintrag.id);

    expect(ablage.liste()).toEqual([]);
    expect(ablage.oeffnen(eintrag.id)).toBeUndefined();
    expect(ablage.aktuelleId()).toBeUndefined();
    expect(Object.keys(storage.dump())).not.toContain(
      `jfd_formular_${eintrag.id}`,
    );
  });

  it('lässt die aktuelle id stehen, wenn ein anderes Formular gelöscht wird', () => {
    const ablage = new LocalStorageFormularAblage(fakeStorage(), uhr());
    const eins = ablage.speichernAls('Eins', zustand('Eins'));
    const zwei = ablage.speichernAls('Zwei', zustand('Zwei'));
    ablage.loeschen(eins.id);
    expect(ablage.aktuelleId()).toBe(zwei.id);
  });

  it('verhält sich ohne Storage wie leer, statt zu scheitern', () => {
    const ablage = new LocalStorageFormularAblage(undefined, uhr());
    expect(ablage.liste()).toEqual([]);
    expect(ablage.aktuelleId()).toBeUndefined();
    expect(() => ablage.speichernAls('X', zustand('X'))).not.toThrow();
    expect(() => ablage.loeschen('x')).not.toThrow();
  });

  it('verträgt einen korrupten Index', () => {
    const ablage = new LocalStorageFormularAblage(
      fakeStorage({ [FORMULAR_INDEX_KEY]: '{kein json' }),
      uhr(),
    );
    expect(ablage.liste()).toEqual([]);
  });

  it('verwirft Index-Einträge ohne id oder Namen', () => {
    const ablage = new LocalStorageFormularAblage(
      fakeStorage({
        [FORMULAR_INDEX_KEY]: JSON.stringify([
          { id: 'a', name: 'Gut', geaendertAm: '2026-01-01T00:00:00.000Z' },
          { name: 'Ohne id' },
          null,
        ]),
      }),
      uhr(),
    );
    expect(ablage.liste().map((e) => e.name)).toEqual(['Gut']);
  });
});

// ---------------------------------------------------------------------------
// Zusammenspiel mit dem Persistenz-Adapter (ADR 0002/V2)
// ---------------------------------------------------------------------------

describe('LocalStorageFieldStateService mit Ablage', () => {
  it('übernimmt einen Alt-Stand einmalig als erstes Formular', () => {
    const storage = fakeStorage({
      [FIELD_STATE_STORAGE_KEY]: JSON.stringify(zustand('Bestehendes')),
    });
    const service = new LocalStorageFieldStateService(undefined, storage);

    const geladen = service.load();

    expect(geladen).toBeDefined();
    expect(service.ablage.liste().map((e) => e.name)).toEqual(['Bestehendes']);
  });

  it('übernimmt den Alt-Stand nicht ein zweites Mal', () => {
    const storage = fakeStorage({
      [FIELD_STATE_STORAGE_KEY]: JSON.stringify(zustand('Bestehendes')),
    });
    const service = new LocalStorageFieldStateService(undefined, storage);
    service.load();
    service.load();
    expect(service.ablage.liste()).toHaveLength(1);
  });

  it('lädt nach einem Wechsel das aktuelle Formular, nicht den Alt-Schlüssel', () => {
    const storage = fakeStorage();
    const service = new LocalStorageFieldStateService(undefined, storage);
    service.save(zustand('Erstes'));
    const zweites = service.ablage.speichernAls('Zweites', zustand('Zweites'));

    expect(service.ablage.aktuelleId()).toBe(zweites.id);
    expect((service.load()!.schema as { title?: string }).title).toBe(
      'Zweites',
    );
  });

  it('schreibt den Auto-Save in das aktuell geöffnete Formular', () => {
    const service = new LocalStorageFieldStateService(undefined, fakeStorage());
    service.save(zustand('Start'));
    const id = service.ablage.aktuelleId()!;

    service.save(zustand('Geändert'));

    expect(service.ablage.liste()).toHaveLength(1);
    expect(
      (service.ablage.oeffnen(id)!.schema as { title?: string }).title,
    ).toBe('Geändert');
  });
});
