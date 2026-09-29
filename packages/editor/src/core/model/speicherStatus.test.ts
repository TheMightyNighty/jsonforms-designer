import { describe, expect, it } from 'vitest';

import {
  formatiereSpeicherStatus,
  GERADE_EBEN_SEKUNDEN,
  istSpeicherFehler,
  SpeicherStatusTexte,
} from './speicherStatus';

const TEXTE: SpeicherStatusTexte = {
  entwurf: 'Entwurf',
  speichert: 'wird gespeichert …',
  geradeEben: 'gerade eben',
  gespeichertVor: 'gespeichert vor {zeit}',
  fehler: 'Speichern fehlgeschlagen',
  sekunden: 's',
  minuten: 'min',
  stunden: 'h',
};

const JETZT = 1_700_000_000_000;

describe('formatiereSpeicherStatus', () => {
  it('nennt einen unveränderten Stand nur „Entwurf"', () => {
    expect(
      formatiereSpeicherStatus({ art: 'unveraendert' }, TEXTE, JETZT),
    ).toBe('Entwurf');
  });

  it('zeigt den laufenden Speichervorgang an', () => {
    expect(formatiereSpeicherStatus({ art: 'speichert' }, TEXTE, JETZT)).toBe(
      'Entwurf · wird gespeichert …',
    );
  });

  it('meldet einen Fehler ohne Entwurfs-Vorspann', () => {
    expect(formatiereSpeicherStatus({ art: 'fehler' }, TEXTE, JETZT)).toBe(
      'Speichern fehlgeschlagen',
    );
  });

  it('sagt direkt nach dem Speichern „gerade eben"', () => {
    const status = { art: 'gespeichert', zeitpunkt: JETZT } as const;
    expect(formatiereSpeicherStatus(status, TEXTE, JETZT)).toBe(
      'Entwurf · gespeichert vor gerade eben',
    );
    expect(
      formatiereSpeicherStatus(
        status,
        TEXTE,
        JETZT + (GERADE_EBEN_SEKUNDEN - 1) * 1000,
      ),
    ).toContain('gerade eben');
  });

  it('zählt ab der Schwelle in Sekunden', () => {
    expect(
      formatiereSpeicherStatus(
        { art: 'gespeichert', zeitpunkt: JETZT },
        TEXTE,
        JETZT + GERADE_EBEN_SEKUNDEN * 1000,
      ),
    ).toBe(`Entwurf · gespeichert vor ${GERADE_EBEN_SEKUNDEN} s`);
  });

  it('wechselt nach einer Minute auf Minuten und nach einer Stunde auf Stunden', () => {
    const status = { art: 'gespeichert', zeitpunkt: JETZT } as const;
    expect(formatiereSpeicherStatus(status, TEXTE, JETZT + 59_000)).toBe(
      'Entwurf · gespeichert vor 59 s',
    );
    expect(formatiereSpeicherStatus(status, TEXTE, JETZT + 60_000)).toBe(
      'Entwurf · gespeichert vor 1 min',
    );
    expect(formatiereSpeicherStatus(status, TEXTE, JETZT + 3_599_000)).toBe(
      'Entwurf · gespeichert vor 59 min',
    );
    expect(formatiereSpeicherStatus(status, TEXTE, JETZT + 7_200_000)).toBe(
      'Entwurf · gespeichert vor 2 h',
    );
  });

  it('verkraftet eine Uhr, die rückwärts gelaufen ist', () => {
    expect(
      formatiereSpeicherStatus(
        { art: 'gespeichert', zeitpunkt: JETZT },
        TEXTE,
        JETZT - 10_000,
      ),
    ).toBe('Entwurf · gespeichert vor gerade eben');
  });
});

describe('istSpeicherFehler', () => {
  it('meldet nur den Fehlerzustand', () => {
    expect(istSpeicherFehler({ art: 'fehler' })).toBe(true);
    expect(istSpeicherFehler({ art: 'speichert' })).toBe(false);
    expect(istSpeicherFehler({ art: 'unveraendert' })).toBe(false);
    expect(istSpeicherFehler({ art: 'gespeichert', zeitpunkt: JETZT })).toBe(
      false,
    );
  });
});
