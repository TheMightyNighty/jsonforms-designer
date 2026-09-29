import { describe, expect, it, vi } from 'vitest';

import { de } from '../i18n/de';
import { loeseErweiterungenAuf, wendeTexteAn } from './aufloesen';
import {
  ERWEITERUNGEN_KEY,
  LocalStorageErweiterungsBibliothek,
} from './erweiterungsBibliothek';
import { Erweiterungspaket } from './erweiterungspaket';
import { ladeErweiterungVonUrl } from './ladeErweiterung';
import { normalisiereErweiterung } from './normalisiereErweiterung';

// ---------------------------------------------------------------------------
// Normalisierung — ein Paket ist unvertraute Eingabe
// ---------------------------------------------------------------------------

const gueltigerFeldtyp = {
  id: 'kfz-kennzeichen',
  gruppe: 'eingabe',
  icon: 'car',
  schema: { type: 'string', pattern: '^[A-Z]{1,3}-' },
  texte: {
    de: { name: 'Kfz-Kennzeichen', label: 'Kennzeichen', beschreibung: '' },
  },
};

describe('normalisiereErweiterung', () => {
  it('nimmt ein vollständiges Paket an', () => {
    const paket = normalisiereErweiterung({
      id: 'musterstadt',
      name: 'Musterstadt',
      version: '1.0.0',
      feldtypen: [gueltigerFeldtyp],
    });
    expect(paket?.id).toBe('musterstadt');
    expect(paket?.feldtypen).toHaveLength(1);
    expect(paket?.feldtypen?.[0].texte.de.name).toBe('Kfz-Kennzeichen');
  });

  it('verwirft ein Paket ohne id oder Namen', () => {
    expect(normalisiereErweiterung({ name: 'ohne id' })).toBeUndefined();
    expect(normalisiereErweiterung({ id: 'ohne-name' })).toBeUndefined();
  });

  it('verwirft ein Paket, das nichts beiträgt', () => {
    const melder = vi.fn();
    expect(
      normalisiereErweiterung({ id: 'leer', name: 'Leer' }, melder),
    ).toBeUndefined();
    expect(melder).toHaveBeenCalled();
  });

  it('verwirft einzelne Feldtypen statt des ganzen Pakets', () => {
    const melder = vi.fn();
    const paket = normalisiereErweiterung(
      {
        id: 'gemischt',
        name: 'Gemischt',
        feldtypen: [
          gueltigerFeldtyp,
          { id: 'kaputt', gruppe: 'gibtsnicht', schema: { type: 'string' } },
        ],
      },
      melder,
    );
    expect(paket?.feldtypen).toHaveLength(1);
    expect(melder).toHaveBeenCalledOnce();
  });

  it('verwirft einen Feldtyp ohne Texte — sonst stünde die id in der Palette', () => {
    const paket = normalisiereErweiterung({
      id: 'p',
      name: 'P',
      feldtypen: [{ ...gueltigerFeldtyp, texte: {} }],
    });
    expect(paket).toBeUndefined();
  });

  it('entfernt Prototype-Pollution-Schlüssel', () => {
    const paket = normalisiereErweiterung(
      JSON.parse(
        `{"id":"p","name":"P","__proto__":{"böse":true},"feldtypen":[${JSON.stringify(gueltigerFeldtyp)}]}`,
      ),
    );
    expect(paket).toBeDefined();
    expect(({} as Record<string, unknown>)['böse']).toBeUndefined();
  });

  it('übernimmt aus der Region nur Prüfregeln, die der Kern kennt', () => {
    const paket = normalisiereErweiterung({
      id: 'p',
      name: 'P',
      region: {
        id: 'at',
        platzhalter: { tel: '+43 1 ...' },
        pruefRegeln: ['formular-ohne-rechtsgrundlage', 'erfundene-regel'],
      },
    });
    expect(paket?.region?.pruefRegeln).toEqual([
      'formular-ohne-rechtsgrundlage',
    ]);
    expect(paket?.region?.platzhalter).toEqual({ tel: '+43 1 ...' });
  });
});

// ---------------------------------------------------------------------------
// Auflösung
// ---------------------------------------------------------------------------

const paketMitFeldtyp: Erweiterungspaket = {
  id: 'musterstadt',
  name: 'Musterstadt',
  feldtypen: [
    {
      id: 'kfz-kennzeichen',
      gruppe: 'eingabe',
      icon: 'car',
      schema: { type: 'string' },
      texte: {
        de: { name: 'Kfz-Kennzeichen', label: 'Kennzeichen', beschreibung: '' },
      },
    },
  ],
};

describe('loeseErweiterungenAuf', () => {
  it('hängt Feldtypen hinter den Kern-Katalog', () => {
    const { feldtypen } = loeseErweiterungenAuf([paketMitFeldtyp]);
    expect(feldtypen.at(-1)?.id).toBe('kfz-kennzeichen');
    expect(feldtypen.some((f) => f.id === 'text-short')).toBe(true);
  });

  it('lässt einen Kern-Feldtyp nicht ersetzen und meldet es', () => {
    const { feldtypen, konflikte } = loeseErweiterungenAuf([
      {
        id: 'p',
        name: 'Böse',
        feldtypen: [
          {
            id: 'email',
            gruppe: 'eingabe',
            icon: 'x',
            schema: { type: 'string' },
            texte: { de: { name: 'X', label: 'X', beschreibung: '' } },
          },
        ],
      },
    ]);
    expect(feldtypen.filter((f) => f.id === 'email')).toHaveLength(1);
    expect(konflikte[0]).toContain('email');
  });

  it('vereinigt mehrere Regionsprofile statt das letzte zu nehmen', () => {
    const { region } = loeseErweiterungenAuf(
      [
        { id: 'a', name: 'A', region: { id: 'a', platzhalter: { tel: 'A' } } },
        {
          id: 'b',
          name: 'B',
          region: { id: 'b', platzhalter: { iban: 'B' } },
        },
      ],
      { id: 'de', pruefRegeln: ['formular-ohne-rechtsgrundlage'] },
    );
    expect(region?.platzhalter).toEqual({ tel: 'A', iban: 'B' });
    expect(region?.pruefRegeln).toEqual(['formular-ohne-rechtsgrundlage']);
  });

  it('reicht ein einzelnes Profil unverändert durch', () => {
    const { region } = loeseErweiterungenAuf([], { id: 'de' });
    expect(region).toEqual({ id: 'de' });
  });
});

describe('wendeTexteAn', () => {
  it('ergänzt die Feldtyp-Texte der Pakete', () => {
    const aufgeloest = loeseErweiterungenAuf([paketMitFeldtyp]);
    const { texte } = wendeTexteAn(de, aufgeloest, 'de');
    expect(texte.feldtypen['kfz-kennzeichen'].name).toBe('Kfz-Kennzeichen');
    expect(texte.feldtypen['email'].name).toBe(de.feldtypen['email'].name);
  });

  it('überschreibt einen vorhandenen Begriff', () => {
    const aufgeloest = loeseErweiterungenAuf([
      { id: 'p', name: 'P', texte: { de: { 'header.title': 'Antragsbau' } } },
    ]);
    const { texte, konflikte } = wendeTexteAn(de, aufgeloest, 'de');
    expect(texte.header.title).toBe('Antragsbau');
    expect(konflikte).toEqual([]);
  });

  it('verwirft einen unbekannten Pfad und meldet ihn', () => {
    const aufgeloest = loeseErweiterungenAuf([
      { id: 'p', name: 'P', texte: { de: { 'gibt.es.nicht': 'X' } } },
    ]);
    const { konflikte } = wendeTexteAn(de, aufgeloest, 'de');
    expect(konflikte[0]).toContain('gibt.es.nicht');
  });

  it('verändert die Sprachdatei nicht', () => {
    const vorher = de.header.title;
    const aufgeloest = loeseErweiterungenAuf([
      { id: 'p', name: 'P', texte: { de: { 'header.title': 'Anders' } } },
    ]);
    wendeTexteAn(de, aufgeloest, 'de');
    expect(de.header.title).toBe(vorher);
  });

  it('lässt eine andere Sprache unberührt', () => {
    const aufgeloest = loeseErweiterungenAuf([
      { id: 'p', name: 'P', texte: { de: { 'header.title': 'Anders' } } },
    ]);
    const { texte } = wendeTexteAn(de, aufgeloest, 'en');
    expect(texte.header.title).toBe(de.header.title);
  });
});

// ---------------------------------------------------------------------------
// Bibliothek
// ---------------------------------------------------------------------------

function speicherAttrappe() {
  const daten = new Map<string, string>();
  return {
    getItem: (k: string) => daten.get(k) ?? null,
    setItem: (k: string, v: string) => void daten.set(k, v),
    daten,
  };
}

describe('LocalStorageErweiterungsBibliothek', () => {
  it('ist zu Beginn leer', () => {
    expect(
      new LocalStorageErweiterungsBibliothek(speicherAttrappe()).liste(),
    ).toEqual([]);
  });

  it('legt ein Paket aktiv ab', () => {
    const bib = new LocalStorageErweiterungsBibliothek(speicherAttrappe());
    bib.hinzufuegen(paketMitFeldtyp, 'musterstadt.json');
    const [eintrag] = bib.liste();
    expect(eintrag.aktiv).toBe(true);
    expect(eintrag.herkunft).toBe('musterstadt.json');
  });

  it('ersetzt ein Paket mit derselben id statt es zu verdoppeln', () => {
    const bib = new LocalStorageErweiterungsBibliothek(speicherAttrappe());
    bib.hinzufuegen(paketMitFeldtyp);
    bib.hinzufuegen({ ...paketMitFeldtyp, name: 'Musterstadt 2' });
    expect(bib.liste()).toHaveLength(1);
    expect(bib.liste()[0].paket.name).toBe('Musterstadt 2');
  });

  it('schaltet ab und wieder ein', () => {
    const bib = new LocalStorageErweiterungsBibliothek(speicherAttrappe());
    bib.hinzufuegen(paketMitFeldtyp);
    bib.setzeAktiv('musterstadt', false);
    expect(bib.liste()[0].aktiv).toBe(false);
    bib.setzeAktiv('musterstadt', true);
    expect(bib.liste()[0].aktiv).toBe(true);
  });

  it('entfernt ein Paket', () => {
    const bib = new LocalStorageErweiterungsBibliothek(speicherAttrappe());
    bib.hinzufuegen(paketMitFeldtyp);
    bib.entfernen('musterstadt');
    expect(bib.liste()).toEqual([]);
  });

  it('scheitert nicht an vollem oder gesperrtem Storage', () => {
    // Private Mode, Quota: setItem wirft. Die Bibliothek bleibt dann
    // flüchtig, statt den Editor mitzureißen.
    const bib = new LocalStorageErweiterungsBibliothek({
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(() => bib.hinzufuegen(paketMitFeldtyp)).not.toThrow();
    expect(bib.liste()).toEqual([]);
  });

  it('überlebt kaputten Inhalt im Storage', () => {
    const speicher = speicherAttrappe();
    speicher.daten.set(ERWEITERUNGEN_KEY, '{nicht json');
    expect(new LocalStorageErweiterungsBibliothek(speicher).liste()).toEqual(
      [],
    );
  });
});

// ---------------------------------------------------------------------------
// Vorlagen als fünfte Beitragsart
// ---------------------------------------------------------------------------

const vorlage = {
  id: 'musterstadt-parkausweis',
  displayName: 'Bewohnerparkausweis',
  description: 'Antrag auf einen Bewohnerparkausweis',
  icon: 'car',
  state: {
    schema: { type: 'object', properties: { kennzeichen: { type: 'string' } } },
    uiSchema: { type: 'VerticalLayout', elements: [] },
  },
};

describe('Vorlagen aus Erweiterungen', () => {
  it('nimmt eine Vorlage mit Schema und uiSchema an', () => {
    const paket = normalisiereErweiterung({
      id: 'p',
      name: 'P',
      vorlagen: [vorlage],
    });
    expect(paket?.vorlagen).toHaveLength(1);
    expect(paket?.vorlagen?.[0].displayName).toBe('Bewohnerparkausweis');
  });

  it('verwirft eine Vorlage ohne Formularzustand', () => {
    const melder = vi.fn();
    const paket = normalisiereErweiterung(
      { id: 'p', name: 'P', vorlagen: [{ id: 'x', displayName: 'X' }] },
      melder,
    );
    expect(paket).toBeUndefined();
    expect(melder).toHaveBeenCalled();
  });

  it('hängt sie hinter die Kern-Vorlagen', () => {
    const { vorlagen } = loeseErweiterungenAuf([
      { id: 'p', name: 'P', vorlagen: [vorlage] },
    ]);
    expect(vorlagen.at(-1)?.id).toBe('musterstadt-parkausweis');
    expect(vorlagen.length).toBeGreaterThan(1);
  });

  it('lässt eine Kern-Vorlage nicht ersetzen und meldet es', () => {
    const { vorlagen, konflikte } = loeseErweiterungenAuf([
      { id: 'p', name: 'P', vorlagen: [{ ...vorlage, id: 'kontakt' }] },
    ]);
    expect(vorlagen.filter((v) => v.id === 'kontakt')).toHaveLength(1);
    expect(konflikte[0]).toContain('kontakt');
  });
});

// ---------------------------------------------------------------------------
// Von einer URL laden
// ---------------------------------------------------------------------------

function antwort(nutzlast: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => nutzlast,
  } as Response;
}

describe('ladeErweiterungVonUrl', () => {
  const gueltig = { id: 'p', name: 'P', vorlagen: [vorlage] };

  it('holt ein Paket und normalisiert es', async () => {
    const paket = await ladeErweiterungVonUrl('https://example/bib.json', {
      fetchFn: async () => antwort(gueltig),
    });
    expect(paket.id).toBe('p');
    expect(paket.vorlagen).toHaveLength(1);
  });

  it('fragt als JSON und ohne fremde Anmeldedaten', async () => {
    let gesehen: RequestInit | undefined;
    await ladeErweiterungVonUrl('https://example/bib.json', {
      fetchFn: async (_u, init) => {
        gesehen = init;
        return antwort(gueltig);
      },
    });
    expect(gesehen?.headers).toMatchObject({ Accept: 'application/json' });
    expect(gesehen?.credentials).toBe('same-origin');
  });

  it('meldet einen HTTP-Fehler als nicht erreichbar', async () => {
    await expect(
      ladeErweiterungVonUrl('https://example/weg.json', {
        fetchFn: async () => antwort(null, false, 404),
      }),
    ).rejects.toMatchObject({ grund: 'nicht-erreichbar' });
  });

  it('meldet einen Netzwerk- oder CSP-Abbruch als nicht erreichbar', async () => {
    await expect(
      ladeErweiterungVonUrl('https://example/bib.json', {
        fetchFn: async () => {
          throw new TypeError('NetworkError');
        },
      }),
    ).rejects.toMatchObject({ grund: 'nicht-erreichbar' });
  });

  it('meldet eine Antwort ohne JSON', async () => {
    await expect(
      ladeErweiterungVonUrl('https://example/bib.json', {
        fetchFn: async () =>
          ({
            ok: true,
            status: 200,
            json: async () => {
              throw new SyntaxError('kein JSON');
            },
          }) as Response,
      }),
    ).rejects.toMatchObject({ grund: 'kein-json' });
  });

  it('meldet ein Paket ohne verwertbaren Inhalt', async () => {
    await expect(
      ladeErweiterungVonUrl('https://example/bib.json', {
        fetchFn: async () => antwort({ id: 'leer', name: 'Leer' }),
        onEintragVerworfen: () => {},
      }),
    ).rejects.toMatchObject({ grund: 'unbrauchbar' });
  });
});
