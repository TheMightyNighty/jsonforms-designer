import { describe, expect, it, vi } from 'vitest';

import { UNBENANNTES_FORMULAR } from '../core/api/formularAblage';
import { createSetFieldStateAction } from '../core/model/addFieldActions';
import {
  FieldAwareState,
  loadTemplateReducer,
} from '../core/model/addFieldReducer';
import { emptyFieldState } from '../core/model/reducer';
import { buildJsonFormsUiSchema } from '../core/util/jsonFormsExport';
import { KatalogFieldStateService, vergleichswert } from './katalogAblage';
import { KatalogUebersicht } from './katalogClient';
import { freigabeSperre } from './KatalogLeiste';
import { kennungAusTitel, kennungMitZaehler } from './kennung';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function formularState(titel = 'Antrag'): FieldAwareState {
  return {
    ...emptyFieldState,
    schema: {
      type: 'object',
      title: titel,
      properties: {
        name: { type: 'string', title: 'Name' },
        ort: { type: 'string', title: 'Ort' },
      },
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        { id: 'c1', type: 'Control', scope: '#/properties/name' },
        { id: 'c2', type: 'Control', scope: '#/properties/ort' },
      ],
    },
  };
}

type Aufruf = { methode: string; pfad: string; body?: unknown };

/** Kleiner In-Memory-Katalog, der die Redaktions-API nachbildet. */
function fakeKatalog(
  rechte = { lesen: true, redaktion: true, freigabe: true },
) {
  const aufrufe: Aufruf[] = [];
  const formulare = new Map<
    string,
    KatalogUebersicht & { inhalt?: unknown; versionen: Record<number, unknown> }
  >();
  const vergebeneKennungen = new Set<string>();

  const antwort = (status: number, body?: unknown) =>
    new Response(body === undefined ? '' : JSON.stringify(body), { status });

  const fetchFn = vi.fn(
    async (url: string | URL | Request, init?: RequestInit) => {
      const pfad = String(url).replace('/katalog-api', '');
      const methode = init?.method ?? 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      aufrufe.push({ methode, pfad, body });

      if (pfad === '/ich')
        return antwort(200, {
          sub: 'rita',
          name: 'rita',
          mandant: 'uba',
          mandanten_admin: false,
        });
      if (pfad === '/formulare' && methode === 'GET') {
        return antwort(200, {
          formulare: [...formulare.values()].map(
            ({ inhalt: _i, versionen: _v, ...f }) => f,
          ),
        });
      }
      if (pfad === '/formulare' && methode === 'POST') {
        if (vergebeneKennungen.has(body.kennung))
          return antwort(409, { error: 'formular existiert bereits' });
        vergebeneKennungen.add(body.kennung);
        formulare.set(body.kennung, {
          kennung: body.kennung,
          titel: body.titel,
          bereich_id: null,
          aktuelle_version: null,
          entwurf: null,
          rechte,
          versionen: {},
        });
        return antwort(201, { kennung: body.kennung });
      }
      const m = pfad.match(
        /^\/formulare\/([^/]+)\/(entwurf|versionen)(?:\/(\w+))?$/,
      );
      const f = m && formulare.get(decodeURIComponent(m[1]));
      if (!m || !f) return antwort(404, { error: 'formular unbekannt' });
      if (m[2] === 'entwurf' && methode === 'GET') {
        return f.inhalt
          ? antwort(200, f.inhalt)
          : antwort(404, { error: 'kein entwurf vorhanden' });
      }
      if (m[2] === 'entwurf' && methode === 'PUT') {
        const version = f.entwurf?.version ?? (f.aktuelle_version ?? 0) + 1;
        f.inhalt = { ...body, version, status: 'entwurf' };
        f.entwurf = {
          version,
          bearbeitet_von: 'rita',
          bearbeitet_am: new Date().toISOString(),
        };
        return antwort(200, { version });
      }
      if (m[2] === 'entwurf' && m[3] === 'freigeben') {
        if (!f.entwurf)
          return antwort(404, { error: 'kein entwurf vorhanden' });
        const version = f.entwurf.version;
        f.versionen[version] = f.inhalt;
        f.aktuelle_version = version;
        f.entwurf = null;
        f.inhalt = undefined;
        return antwort(200, { version, gueltig_ab: new Date().toISOString() });
      }
      if (m[2] === 'versionen' && m[3]) {
        const v = f.versionen[Number(m[3])];
        return v
          ? antwort(200, v)
          : antwort(404, { error: 'version unbekannt' });
      }
      return antwort(404, {});
    },
  );

  return { fetchFn, aufrufe, formulare, vergebeneKennungen };
}

function speicher(start: Record<string, string> = {}) {
  const daten = new Map(Object.entries(start));
  return {
    getItem: (k: string) => daten.get(k) ?? null,
    setItem: (k: string, v: string) => void daten.set(k, v),
    removeItem: (k: string) => void daten.delete(k),
  };
}

function dienst(katalog: ReturnType<typeof fakeKatalog>, aktuell?: string) {
  return new KatalogFieldStateService({
    basisUrl: '/katalog-api',
    token: async () => 'token',
    fetchFn: katalog.fetchFn as unknown as typeof fetch,
    debounceMs: 1,
    speicher: speicher(aktuell ? { jfd_katalog_aktuell_v1: aktuell } : {}),
  });
}

const puts = (k: ReturnType<typeof fakeKatalog>) =>
  k.aufrufe.filter((a) => a.methode === 'PUT').length;

async function angelegt(titel = 'Antrag Polar') {
  const katalog = fakeKatalog();
  const d = dienst(katalog);
  await d.load();
  await d.ablage.speichernAls(titel, formularState(titel));
  return { katalog, d };
}

// ---------------------------------------------------------------------------
// Kennung
// ---------------------------------------------------------------------------

describe('kennungAusTitel', () => {
  it.each([
    ['Antrag auf Förderung', 'antrag-auf-foerderung'],
    ['Straße & Grün (2026)', 'strasse-gruen-2026'],
    ['  --Café--  ', 'cafe'],
    ['!!!', 'formular'],
  ])('%s → %s', (titel, kennung) => {
    expect(kennungAusTitel(titel)).toBe(kennung);
  });

  it('bleibt mit Zähler bei höchstens 64 Zeichen', () => {
    const lang = kennungAusTitel('a'.repeat(100));
    expect(lang).toHaveLength(64);
    expect(kennungMitZaehler(lang, 3)).toHaveLength(64);
    expect(kennungMitZaehler(lang, 3).endsWith('-3')).toBe(true);
    expect(kennungMitZaehler('antrag', 1)).toBe('antrag');
  });
});

// ---------------------------------------------------------------------------
// JSONForms-Export
// ---------------------------------------------------------------------------

describe('buildJsonFormsUiSchema', () => {
  it('liefert ohne Reiter ein VerticalLayout ohne interne IDs', () => {
    const ui = buildJsonFormsUiSchema(formularState()) as {
      type: string;
      elements: object[];
    };
    expect(ui.type).toBe('VerticalLayout');
    expect(ui.elements).toHaveLength(2);
    expect(JSON.stringify(ui)).not.toContain('"id"');
  });

  it('verteilt Felder mit Reitern auf Categories', () => {
    const state: FieldAwareState = {
      ...formularState(),
      tabs: [{ label: 'Person' }, { label: 'Ort' }],
      tabAssignments: { '#/properties/ort': 1 },
    };
    const ui = buildJsonFormsUiSchema(state) as {
      type: string;
      elements: { label: string; elements: { elements: object[] }[] }[];
    };
    expect(ui.type).toBe('Categorization');
    expect(ui.elements.map((c) => c.label)).toEqual(['Person', 'Ort']);
    expect(ui.elements[0].elements[0].elements).toHaveLength(1);
    expect(ui.elements[1].elements[0].elements).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Ablage gegen den Katalog
// ---------------------------------------------------------------------------

describe('KatalogFieldStateService', () => {
  it('legt ein benanntes Formular mit Kennung und Entwurf an', async () => {
    const { katalog, d } = await angelegt('Antrag Polar');
    expect(katalog.formulare.get('antrag-polar')?.entwurf?.version).toBe(1);
    expect(d.ablage.aktuelleId()).toBe('antrag-polar');
    const put = katalog.aufrufe.find((a) => a.methode === 'PUT')!;
    expect((put.body as { uischema: { type: string } }).uischema.type).toBe(
      'VerticalLayout',
    );
  });

  it('weicht bei vergebener Kennung auf einen Zähler aus', async () => {
    const katalog = fakeKatalog();
    katalog.vergebeneKennungen.add('antrag');
    const d = dienst(katalog);
    await d.load();
    const eintrag = await d.ablage.speichernAls('Antrag', formularState());
    expect(eintrag.id).toBe('antrag-2');
  });

  it('legt ein unbenanntes neues Formular nicht im Katalog an', async () => {
    const katalog = fakeKatalog();
    const d = dienst(katalog);
    await d.load();
    await d.ablage.speichernAls(UNBENANNTES_FORMULAR, emptyFieldState);
    expect(katalog.aufrufe.some((a) => a.methode === 'POST')).toBe(false);
    d.save(formularState());
    await d.ausstehendeSpeichern();
    expect(puts(katalog)).toBe(0);
  });

  it('speichert beim Öffnen keinen Entwurf, auch nach dem Reducer', async () => {
    const { katalog } = await angelegt();
    const neu = dienst(katalog, 'antrag-polar');
    const geladen = (await neu.load())!;
    const nachReducer = loadTemplateReducer(
      emptyFieldState,
      createSetFieldStateAction(geladen),
    );
    const vorher = puts(katalog);

    neu.save(nachReducer);
    neu.save({ ...nachReducer, activeTabIndex: 3 });
    await new Promise((r) => setTimeout(r, 10));
    await neu.ausstehendeSpeichern();
    expect(puts(katalog)).toBe(vorher);
  });

  it('speichert echte Änderungen nach dem Debounce', async () => {
    const { katalog, d } = await angelegt();
    const vorher = puts(katalog);
    d.save(formularState('Geänderter Titel'));
    await vi.waitFor(() => expect(puts(katalog)).toBe(vorher + 1));
    expect(d.aktuellerStand().speichern.art).toBe('gespeichert');
  });

  it('speichert ohne Redaktionsrecht nicht', async () => {
    const katalog = fakeKatalog({
      lesen: true,
      redaktion: false,
      freigabe: true,
    });
    katalog.vergebeneKennungen.add('x');
    katalog.formulare.set('antrag', {
      kennung: 'antrag',
      titel: 'Antrag',
      bereich_id: null,
      aktuelle_version: 1,
      entwurf: null,
      rechte: { lesen: true, redaktion: false, freigabe: true },
      versionen: {
        1: {
          schema: formularState().schema,
          uischema: { type: 'VerticalLayout', elements: [] },
          version: 1,
          status: 'freigegeben',
        },
      },
    });
    const d = dienst(katalog, 'antrag');
    await d.load();
    d.save(formularState('Anders'));
    await new Promise((r) => setTimeout(r, 10));
    await d.ausstehendeSpeichern();
    expect(puts(katalog)).toBe(0);
  });

  it('öffnet ohne Entwurf die gültige Version, auch ohne Arbeitsstand', async () => {
    const katalog = fakeKatalog();
    katalog.formulare.set('alt', {
      kennung: 'alt',
      titel: 'Alt',
      bereich_id: null,
      aktuelle_version: 2,
      entwurf: null,
      rechte: { lesen: true, redaktion: true, freigabe: false },
      versionen: {
        2: {
          version: 2,
          status: 'freigegeben',
          schema: formularState('Alt').schema,
          uischema: {
            type: 'VerticalLayout',
            elements: [{ type: 'Control', scope: '#/properties/name' }],
          },
        },
      },
    });
    const d = dienst(katalog, 'alt');
    const state = await d.load();
    expect(state?.schema.title).toBe('Alt');
    expect(state?.uiSchema.elements).toHaveLength(1);
  });

  it('schreibt ausstehende Änderungen vor der Freigabe', async () => {
    const { katalog, d } = await angelegt();
    d.save(formularState('Letzte Änderung'));
    const version = await d.freigeben();

    expect(version).toBe(1);
    const reihenfolge = katalog.aufrufe
      .filter((a) => a.methode !== 'GET')
      .map((a) => a.methode + ' ' + a.pfad);
    expect(reihenfolge.slice(-2)).toEqual([
      'PUT /formulare/antrag-polar/entwurf',
      'POST /formulare/antrag-polar/entwurf/freigeben',
    ]);
    expect(d.aktuellerStand().formular?.aktuelle_version).toBe(1);
  });
});

describe('vergleichswert', () => {
  it('ignoriert Schlüsselreihenfolge und aktiven Reiter', () => {
    const a = formularState();
    const umsortiert = {
      manifestMeta: a.manifestMeta,
      activeTabIndex: 2,
      uiSchema: a.uiSchema,
      schema: {
        properties: a.schema.properties,
        title: a.schema.title,
        type: 'object',
      },
      tabs: a.tabs,
      tabAssignments: a.tabAssignments,
      lineNumbersEnabled: a.lineNumbersEnabled,
      typvorschlagIgnoriert: a.typvorschlagIgnoriert,
      sectionColors: a.sectionColors,
    } as FieldAwareState;
    expect(vergleichswert(umsortiert)).toBe(vergleichswert(a));
    expect(vergleichswert(formularState('Anders'))).not.toBe(vergleichswert(a));
  });
});

describe('freigabeSperre', () => {
  const basis = {
    ich: {
      sub: 'fritz',
      name: 'fritz',
      mandant: 'uba',
      mandanten_admin: false,
    },
    speichern: { art: 'ruhig' as const },
    formular: {
      kennung: 'a',
      titel: 'A',
      bereich_id: null,
      aktuelle_version: 1,
      entwurf: { version: 2, bearbeitet_von: 'rita', bearbeitet_am: '' },
      rechte: { lesen: true, redaktion: false, freigabe: true },
    },
  };

  it('erlaubt die Freigabe durch eine zweite Person', () => {
    expect(freigabeSperre(basis)).toBeUndefined();
  });

  it('sperrt Selbstfreigabe, fehlendes Recht und fehlenden Entwurf', () => {
    expect(
      freigabeSperre({ ...basis, ich: { ...basis.ich, sub: 'rita' } }),
    ).toBe('vierAugen');
    expect(
      freigabeSperre({
        ...basis,
        formular: {
          ...basis.formular,
          rechte: { lesen: true, redaktion: true, freigabe: false },
        },
      }),
    ).toBe('keinRecht');
    expect(
      freigabeSperre({
        ...basis,
        formular: { ...basis.formular, entwurf: null },
      }),
    ).toBe('keinEntwurf');
  });
});
