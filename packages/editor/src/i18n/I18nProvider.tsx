import React, { createContext, useContext, useState } from 'react';
import { de } from './de';
import { en } from './en';
import type { EditorTranslations } from './types';

export type Locale = 'de' | 'en';
const TRANSLATIONS: Record<Locale, EditorTranslations> = { de, en };

interface I18nContext { locale: Locale; t: EditorTranslations; setLocale: (l: Locale) => void; }
export const I18nCtx = createContext<I18nContext>({ locale: 'de', t: de, setLocale: () => {} });

export function I18nProvider({ children, defaultLocale = 'de' }: { children: React.ReactNode; defaultLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  return (
    <I18nCtx.Provider value={{ locale, t: TRANSLATIONS[locale], setLocale }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() { return useContext(I18nCtx); }
