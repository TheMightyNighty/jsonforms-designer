/**
 * Regionsprofile (ADR 0007).
 *
 * Alles, was nur an einem Ort gilt, steht hier und nicht im Kern: Platzhalter
 * mit Länderkennung, engere Muster als die weltweit gültigen, und die
 * Prüfregeln, die nur ein bestimmtes Verwaltungsrecht kennt.
 *
 * Ein Profil ist reine Konfiguration und könnte ebenso gut aus einer
 * JSON-Datei kommen. `REGION_DE` ist ein mitgeliefertes Profil wie jedes
 * andere und hat keinen Vorrang — der Default des Kerns ist `REGION_NEUTRAL`.
 */
import { PruefRegelId } from '../core/util/formularPruefung';
import { Vorschlagsregel } from '../field-types/feldtypVorschlag';
import { TYPVORSCHLAEGE_DE } from './typvorschlaegeDe';

export interface Regionsprofil {
  /** Kennung, üblicherweise ein Sprach- oder Länderkürzel („de", „at"). */
  id: string;
  /**
   * Platzhalter je Feldtyp-id. Überschreibt `uiSchema.options.placeholder`
   * aus dem Katalog. Ein Beispielwert ist regional: „DE89 …" hilft in
   * Deutschland und verwirrt überall sonst.
   */
  platzhalter?: Record<string, string>;
  /**
   * Engere Schema-Muster je Feldtyp-id. Der Katalog prüft bewusst weit,
   * damit er niemanden aussperrt; wer strenger prüfen darf, weil er die
   * Herkunft seiner Antragstellenden kennt, setzt das Muster hier.
   */
  muster?: Record<string, string>;
  /**
   * Prüfregeln, die nur in dieser Region gelten und die der Kern deshalb
   * abgeschaltet lässt — etwa die Rechtsgrundlage nach deutschem
   * Verwaltungsrecht.
   */
  pruefRegeln?: readonly PruefRegelId[];
  /**
   * Stichwörter, aus denen der Editor einen Feldtyp vorschlägt. Sie hängen
   * an der Sprache; ohne Profil schlägt er nichts vor, statt falsch zu
   * raten.
   */
  typvorschlaege?: readonly Vorschlagsregel[];
}

/** Default des Kerns: nichts Regionales. */
export const REGION_NEUTRAL: Regionsprofil = { id: 'neutral' };

export const REGION_DE: Regionsprofil = {
  id: 'de',
  platzhalter: {
    email: 'name@behoerde.de',
    tel: '+49 30 ...',
    iban: 'DE89 3704 0044 0532 0130 00',
  },
  pruefRegeln: ['formular-ohne-rechtsgrundlage'],
  typvorschlaege: TYPVORSCHLAEGE_DE,
};

/** Mitgelieferte Profile, für eine Auswahl in der Oberfläche. */
export const MITGELIEFERTE_REGIONEN: readonly Regionsprofil[] = [
  REGION_NEUTRAL,
  REGION_DE,
];
