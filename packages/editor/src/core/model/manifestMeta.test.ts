import { describe, expect, it } from 'vitest';

import {
  emptyManifestMeta,
  isValidFormUrn,
  suggestFormUrn,
} from './manifestMeta';

describe('isValidFormUrn', () => {
  it('akzeptiert eine vollständige URN', () => {
    expect(isValidFormUrn('urn:de:musterstadt:formular:wohngeld')).toBe(true);
  });

  it('lehnt URNs ohne Rest hinter dem Namensraum ab', () => {
    expect(isValidFormUrn('urn:de:')).toBe(false);
    expect(isValidFormUrn('urn:de')).toBe(false);
  });

  it('lehnt einen zu kurzen Namensraum ab', () => {
    expect(isValidFormUrn('urn:d:formular')).toBe(false);
  });

  it('lehnt Großschreibung und fremde Präfixe ab', () => {
    expect(isValidFormUrn('URN:de:formular')).toBe(false);
    expect(isValidFormUrn('uri:de:formular')).toBe(false);
  });

  it('lehnt einen leeren Wert ab', () => {
    expect(isValidFormUrn('')).toBe(false);
  });
});

describe('suggestFormUrn', () => {
  it('bildet Herausgeber und Titel auf einen URN-Vorschlag ab', () => {
    expect(suggestFormUrn('Musterstadt', 'Antrag auf Wohngeld')).toBe(
      'urn:de:musterstadt:formular:antrag-auf-wohngeld',
    );
  });

  it('ersetzt Umlaute und Eszett lesbar statt sie zu entfernen', () => {
    expect(suggestFormUrn('Behörde Süd', 'Straßenfest')).toBe(
      'urn:de:behoerde-sued:formular:strassenfest',
    );
  });

  it('nutzt Platzhalter, wenn ein Teil leer oder unbrauchbar ist', () => {
    expect(suggestFormUrn('', '')).toBe('urn:de:behoerde:formular:formular');
    expect(suggestFormUrn('###', '###')).toBe(
      'urn:de:behoerde:formular:formular',
    );
  });

  it('kürzt einen überlangen Namensraum auf 32 Zeichen', () => {
    const urn = suggestFormUrn('A'.repeat(50), 'Test');
    expect(urn).toBe(`urn:de:${'a'.repeat(32)}:formular:test`);
  });

  it('erzeugt Vorschläge, die die URN-Prüfung bestehen', () => {
    expect(isValidFormUrn(suggestFormUrn('Musterstadt', 'Wohngeld'))).toBe(
      true,
    );
    expect(isValidFormUrn(suggestFormUrn('', ''))).toBe(true);
  });
});

describe('emptyManifestMeta', () => {
  it('ist bis auf die Basissprache leer', () => {
    expect(emptyManifestMeta.language).toBe('de');
    expect(emptyManifestMeta.id).toBe('');
    expect(emptyManifestMeta.version).toBe('');
    expect(emptyManifestMeta.publisher).toBe('');
    expect(emptyManifestMeta.legalBasis).toBe('');
    expect(emptyManifestMeta.validFrom).toBe('');
  });
});
