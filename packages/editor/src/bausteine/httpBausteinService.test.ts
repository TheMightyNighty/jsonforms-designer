import { describe, expect, it, vi } from 'vitest';

import {
  HttpBausteinService,
  normalisiereBaustein,
} from './httpBausteinService';

const gueltigerEintrag = {
  id: 'b-anschrift',
  name: 'Anschrift',
  beschreibung: 'Straße und Ort',
  icon: 'home',
  istBeispiel: false,
  felder: [
    {
      propertyKey: 'strasse',
      label: 'Straße',
      schemaFragment: { type: 'string', title: 'Straße' },
    },
  ],
};

/** Antwort-Fake, der nur das liefert, was der Adapter liest. */
function antwortMit(nutzlast: unknown, status = 200) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => nutzlast,
  })) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// normalisiereBaustein
// ---------------------------------------------------------------------------

describe('normalisiereBaustein', () => {
  it('übernimmt einen vollständigen Eintrag', () => {
    expect(normalisiereBaustein(gueltigerEintrag)).toEqual(gueltigerEintrag);
  });

  it('verwirft Einträge ohne id oder Namen', () => {
    expect(
      normalisiereBaustein({ ...gueltigerEintrag, id: '' }),
    ).toBeUndefined();
    expect(
      normalisiereBaustein({ ...gueltigerEintrag, name: '   ' }),
    ).toBeUndefined();
  });

  it('verwirft Einträge ohne verwertbares Feld', () => {
    expect(
      normalisiereBaustein({ ...gueltigerEintrag, felder: [] }),
    ).toBeUndefined();
    expect(
      normalisiereBaustein({ ...gueltigerEintrag, felder: 'keine Liste' }),
    ).toBeUndefined();
  });

  it('verwirft einzelne unbrauchbare Felder, nicht den ganzen Baustein', () => {
    const gemischt = normalisiereBaustein({
      ...gueltigerEintrag,
      felder: [
        { propertyKey: 'ohneLabel', schemaFragment: { type: 'string' } },
        { propertyKey: 'ohneTyp', label: 'X', schemaFragment: {} },
        ...gueltigerEintrag.felder,
      ],
    });
    expect(gemischt?.felder.map((f) => f.propertyKey)).toEqual(['strasse']);
  });

  it('ergänzt fehlende Beschreibung und fehlendes Symbol', () => {
    const ohne = normalisiereBaustein({
      id: 'b',
      name: 'B',
      felder: gueltigerEintrag.felder,
    });
    expect(ohne?.beschreibung).toBe('');
    expect(ohne?.icon).toBe('components');
  });

  it('gilt ohne ausdrückliches istBeispiel:false als Beispiel', () => {
    const ohne = normalisiereBaustein({
      id: 'b',
      name: 'B',
      felder: gueltigerEintrag.felder,
    });
    expect(ohne?.istBeispiel).toBe(true);
  });

  it('entfernt Prototype-Pollution-Schlüssel', () => {
    const roh = JSON.parse(
      `{"id":"b","name":"B","__proto__":{"x":1},"felder":[{"propertyKey":"a","label":"A","schemaFragment":{"type":"string"}}]}`,
    );
    const sauber = normalisiereBaustein(roh);
    expect(sauber).toBeDefined();
    expect(Object.keys(sauber!)).not.toContain('__proto__');
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });

  it('verwirft Nicht-Objekte', () => {
    expect(normalisiereBaustein(null)).toBeUndefined();
    expect(normalisiereBaustein('Baustein')).toBeUndefined();
    expect(normalisiereBaustein([gueltigerEintrag])).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// HttpBausteinService
// ---------------------------------------------------------------------------

describe('HttpBausteinService', () => {
  it('liest ein Array von Bausteinen', async () => {
    const service = new HttpBausteinService('/katalog.json', {
      fetchFn: antwortMit([gueltigerEintrag]),
    });
    expect((await service.getBausteine()).map((b) => b.id)).toEqual([
      'b-anschrift',
    ]);
  });

  it('liest ebenso eine { items }-Antwort', async () => {
    const service = new HttpBausteinService('/katalog.json', {
      fetchFn: antwortMit({ items: [gueltigerEintrag] }),
    });
    expect(await service.getBausteine()).toHaveLength(1);
  });

  it('überspringt unbrauchbare Einträge und meldet sie', async () => {
    const verworfen = vi.fn();
    const service = new HttpBausteinService('/katalog.json', {
      fetchFn: antwortMit([{ id: 'kaputt' }, gueltigerEintrag]),
      onEintragVerworfen: verworfen,
    });
    expect(await service.getBausteine()).toHaveLength(1);
    expect(verworfen).toHaveBeenCalledTimes(1);
  });

  it('überspringt doppelte ids', async () => {
    const verworfen = vi.fn();
    const service = new HttpBausteinService('/katalog.json', {
      fetchFn: antwortMit([gueltigerEintrag, gueltigerEintrag]),
      onEintragVerworfen: verworfen,
    });
    expect(await service.getBausteine()).toHaveLength(1);
    expect(verworfen).toHaveBeenCalledWith(
      expect.stringContaining('Doppelte id'),
      expect.anything(),
    );
  });

  it('wirft bei einem Serverfehler', async () => {
    const service = new HttpBausteinService('/katalog.json', {
      fetchFn: antwortMit(null, 500),
    });
    await expect(service.getBausteine()).rejects.toThrow(/HTTP 500/);
  });

  it('liefert bei einer unerwarteten Antwortform eine leere Liste', async () => {
    const service = new HttpBausteinService('/katalog.json', {
      fetchFn: antwortMit({ unerwartet: true }),
    });
    expect(await service.getBausteine()).toEqual([]);
  });

  it('schickt Accept-Header und konfigurierte Zusatz-Header mit', async () => {
    const holen = antwortMit([]);
    const service = new HttpBausteinService('/katalog.json', {
      fetchFn: holen,
      headers: { Authorization: 'Bearer test' },
    });
    await service.getBausteine();
    expect(holen).toHaveBeenCalledWith(
      '/katalog.json',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
          Authorization: 'Bearer test',
        }),
      }),
    );
  });
});
