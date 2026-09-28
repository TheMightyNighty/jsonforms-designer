/**
 * Stellt die lokale Bibliothek und den daraus geltenden Stand bereit
 * (ADR 0007).
 *
 * Sitzt zwischen `EditorConfigProvider` (liefert das Grundprofil der Region)
 * und `I18nProvider` (bekommt die ergänzten Texte). Die Feldtypen der
 * aktiven Pakete meldet er an die Registrierstelle des Katalogs, damit auch
 * die Reducer sie finden.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { useEditorConfig } from '../config/EditorConfigContext';
import { setzeZusatzFeldtypen } from '../field-types/fieldTypes';
import { I18nProvider, Locale } from '../i18n';
import { EditorTranslations } from '../i18n/types';
import {
  AufgeloesteErweiterungen,
  loeseErweiterungenAuf,
  wendeTexteAn,
} from './aufloesen';
import {
  ErweiterungsBibliothek,
  LocalStorageErweiterungsBibliothek,
} from './erweiterungsBibliothek';
import { ErweiterungsEintrag, Erweiterungspaket } from './erweiterungspaket';

interface ErweiterungenContext {
  eintraege: ErweiterungsEintrag[];
  aufgeloest: AufgeloesteErweiterungen;
  hinzufuegen: (paket: Erweiterungspaket, herkunft?: string) => void;
  entfernen: (id: string) => void;
  setzeAktiv: (id: string, aktiv: boolean) => void;
}

const LEER: AufgeloesteErweiterungen = loeseErweiterungenAuf([]);

export const ErweiterungenCtx = createContext<ErweiterungenContext>({
  eintraege: [],
  aufgeloest: LEER,
  hinzufuegen: () => {},
  entfernen: () => {},
  setzeAktiv: () => {},
});

export function ErweiterungenProvider({
  children,
  bibliothek,
}: {
  children: React.ReactNode;
  /** Eigene Umsetzung, z. B. serverseitig. Default: localStorage. */
  bibliothek?: ErweiterungsBibliothek;
}) {
  const config = useEditorConfig();
  const ablage = useMemo(
    () => bibliothek ?? new LocalStorageErweiterungsBibliothek(),
    [bibliothek],
  );
  const [eintraege, setEintraege] = useState<ErweiterungsEintrag[]>(() =>
    ablage.liste(),
  );

  const aufgeloest = useMemo(() => {
    const aktive = eintraege.filter((e) => e.aktiv).map((e) => e.paket);
    const ergebnis = loeseErweiterungenAuf(aktive, config.region);
    // Auch Reducer und `getFieldType` müssen die ergänzten Typen kennen.
    setzeZusatzFeldtypen(ergebnis.zusatzFeldtypen);
    return ergebnis;
  }, [eintraege, config.region]);

  const nachSchreiben = useCallback(
    (tun: () => void) => {
      tun();
      setEintraege(ablage.liste());
    },
    [ablage],
  );

  const wert = useMemo<ErweiterungenContext>(
    () => ({
      eintraege,
      aufgeloest,
      hinzufuegen: (paket, herkunft) =>
        nachSchreiben(() => ablage.hinzufuegen(paket, herkunft)),
      entfernen: (id) => nachSchreiben(() => ablage.entfernen(id)),
      setzeAktiv: (id, aktiv) =>
        nachSchreiben(() => ablage.setzeAktiv(id, aktiv)),
    }),
    [eintraege, aufgeloest, ablage, nachSchreiben],
  );

  return (
    <ErweiterungenCtx.Provider value={wert}>
      {children}
    </ErweiterungenCtx.Provider>
  );
}

export function useErweiterungen(): ErweiterungenContext {
  return useContext(ErweiterungenCtx);
}

/** Der Feldtyp-Katalog, wie er mit den aktiven Erweiterungen gilt. */
export function useFeldtypKatalog() {
  return useErweiterungen().aufgeloest.feldtypen;
}

/**
 * Das geltende Regionsprofil: das der Konfiguration, vereinigt mit denen
 * der aktiven Pakete.
 */
export function useRegion() {
  return useErweiterungen().aufgeloest.region;
}

/**
 * `I18nProvider`, der die Texte der aktiven Pakete darüberlegt. Steht
 * getrennt, damit das i18n-Modul nichts von Erweiterungen wissen muss.
 */
export function ErweiterterI18nProvider({
  children,
  defaultLocale,
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
}) {
  const { aufgeloest } = useErweiterungen();
  const ueberschreiben = useCallback(
    (basis: EditorTranslations, locale: Locale) =>
      wendeTexteAn(basis, aufgeloest, locale).texte,
    [aufgeloest],
  );
  return (
    <I18nProvider defaultLocale={defaultLocale} ueberschreiben={ueberschreiben}>
      {children}
    </I18nProvider>
  );
}
