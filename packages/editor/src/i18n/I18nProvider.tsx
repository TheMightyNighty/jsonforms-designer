import React, { createContext, useContext, useState } from 'react';

import { de } from './de';
import { en } from './en';
import type { EditorTranslations } from './types';

export type Locale = 'de' | 'en';
const TRANSLATIONS: Record<Locale, EditorTranslations> = { de, en };

interface I18nContext {
  locale: Locale;
  t: EditorTranslations;
  setLocale: (l: Locale) => void;
}
export const I18nCtx = createContext<I18nContext>({
  locale: 'de',
  t: de,
  setLocale: () => {},
});

export function I18nProvider({
  children,
  defaultLocale = 'de',
  ueberschreiben,
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
  /**
   * Letzter Griff in die Texte, bevor sie gelten — hier legen
   * Erweiterungspakete ihre Feldtyp-Namen und Begriffe darüber (ADR 0007).
   * Der Sprachkatalog selbst bleibt unverändert.
   */
  ueberschreiben?: (
    basis: EditorTranslations,
    locale: Locale,
  ) => EditorTranslations;
}) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const t = React.useMemo(() => {
    const basis = TRANSLATIONS[locale];
    return ueberschreiben ? ueberschreiben(basis, locale) : basis;
  }, [locale, ueberschreiben]);
  return (
    <I18nCtx.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  return useContext(I18nCtx);
}
