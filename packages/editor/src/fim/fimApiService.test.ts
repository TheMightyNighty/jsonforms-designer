/**
 * Tests für den FIM-Portal-HTTP-Client: URL-Bau, Header,
 * Response-Normalisierung und Fehlerverhalten — mit gestubbtem fetch.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FimApiService } from './fimApiService';

type FetchCall = { url: string; init: RequestInit | undefined };

function stubFetch(payload: unknown, ok = true, status = 200) {
  const calls: FetchCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok,
        status,
        statusText: ok ? 'OK' : 'Server Error',
        json: async () => payload,
      };
    }),
  );
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

const SAMPLE_FIELD = {
  fim_id: 'F60000227',
  fim_version: '1.2',
  name: 'Familienname',
  beschreibung: 'Nachname der Person',
  datentyp: 'text',
  code_list_id: null,
};

describe('FimApiService — URL-Bau und Header', () => {
  it('baut die Default-URL mit Suchparameter, limit und offset', async () => {
    const calls = stubFetch({ items: [SAMPLE_FIELD] });
    await new FimApiService().getDatenfelder('  Name  ', {
      limit: 25,
      offset: 50,
    });

    const url = new URL(calls[0].url);
    expect(url.origin + url.pathname).toBe(
      'https://fimportal.de/api/v1/fields',
    );
    expect(url.searchParams.get('name')).toBe('Name'); // getrimmt
    expect(url.searchParams.get('limit')).toBe('25');
    expect(url.searchParams.get('offset')).toBe('50');
  });

  it('lässt den Suchparameter bei leerem Suchbegriff weg', async () => {
    const calls = stubFetch({ items: [] });
    await new FimApiService().getDatenfelder('   ');
    expect(new URL(calls[0].url).searchParams.has('name')).toBe(false);
  });

  it('respektiert baseUrl (inkl. Slash-Strip), Endpoints und searchParam', async () => {
    const calls = stubFetch({ items: [] });
    const service = new FimApiService({
      baseUrl: 'https://intranet.behoerde.de/fim/',
      endpoints: { datenfeldgruppen: '/gruppen' },
      searchParam: 'q',
    });
    await service.getDatenfeldgruppen('Anschrift');

    const url = new URL(calls[0].url);
    expect(url.origin + url.pathname).toBe(
      'https://intranet.behoerde.de/fim/gruppen',
    );
    expect(url.searchParams.get('q')).toBe('Anschrift');
  });

  it('sendet Accept- und konfigurierte Auth-Header mit', async () => {
    const calls = stubFetch({ items: [] });
    await new FimApiService({
      headers: { Authorization: 'Bearer token123' },
    }).getDatenfelder('x');

    expect(calls[0].init?.headers).toMatchObject({
      Accept: 'application/json',
      Authorization: 'Bearer token123',
    });
  });
});

describe('FimApiService — Normalisierung', () => {
  it('mappt fimportal-Felder ins interne Modell', async () => {
    stubFetch({ items: [SAMPLE_FIELD] });
    const [feld] = await new FimApiService().getDatenfelder('Name');
    expect(feld).toEqual({
      identifier: 'F60000227',
      name: 'Familienname',
      beschreibung: 'Nachname der Person',
      datentyp: 'text',
    });
  });

  it('fällt bei Beschreibung auf definition zurück, bei Datentyp auf text', async () => {
    stubFetch({
      items: [
        {
          fim_id: 'F1',
          fim_version: '1',
          name: 'X',
          definition: 'Definition statt Beschreibung',
          datentyp: 'völlig_unbekannt',
        },
      ],
    });
    const [feld] = await new FimApiService().getDatenfelder('x');
    expect(feld.beschreibung).toBe('Definition statt Beschreibung');
    expect(feld.datentyp).toBe('text');
  });

  it('code_list_id erzwingt datentyp codeliste; num_int → ganzzahl', async () => {
    stubFetch({
      items: [
        {
          fim_id: 'F1',
          fim_version: '1',
          name: 'A',
          datentyp: 'text',
          code_list_id: 'C123',
        },
        { fim_id: 'F2', fim_version: '1', name: 'B', datentyp: 'num_int' },
      ],
    });
    const felder = await new FimApiService().getDatenfelder('x');
    expect(felder[0].datentyp).toBe('codeliste');
    expect(felder[1].datentyp).toBe('ganzzahl');
  });

  it('Gruppen: leeres felder-Array (List-Endpoint liefert keine Felder)', async () => {
    stubFetch({
      items: [{ fim_id: 'G1', fim_version: '1', name: 'Anschrift' }],
    });
    const [gruppe] = await new FimApiService().getDatenfeldgruppen('x');
    expect(gruppe).toEqual({
      identifier: 'G1',
      name: 'Anschrift',
      beschreibung: '',
      felder: [],
    });
  });

  it('eigener Normalisierer hat Vorrang', async () => {
    stubFetch({ items: [SAMPLE_FIELD] });
    const service = new FimApiService({
      normalizeDatenfeld: (raw) => ({
        identifier: String(raw.fim_id),
        name: 'CUSTOM',
        beschreibung: '',
        datentyp: 'text',
      }),
    });
    const [feld] = await service.getDatenfelder('x');
    expect(feld.name).toBe('CUSTOM');
  });
});

describe('FimApiService — Antwortformate und Fehler', () => {
  it('akzeptiert items[], data[] und nackte Arrays', async () => {
    for (const payload of [
      { items: [SAMPLE_FIELD] },
      { data: [SAMPLE_FIELD] },
      [SAMPLE_FIELD],
    ]) {
      stubFetch(payload);
      const felder = await new FimApiService().getDatenfelder('x');
      expect(felder).toHaveLength(1);
      vi.unstubAllGlobals();
    }
  });

  it('liefert [] bei unbekanntem Antwortformat', async () => {
    stubFetch({ völlig: 'anders' });
    expect(await new FimApiService().getDatenfelder('x')).toEqual([]);
  });

  it('wirft bei HTTP-Fehlern mit Status und URL', async () => {
    stubFetch({}, false, 503);
    await expect(new FimApiService().getDatenfelder('x')).rejects.toThrow(
      /FIM API 503/,
    );
  });
});
