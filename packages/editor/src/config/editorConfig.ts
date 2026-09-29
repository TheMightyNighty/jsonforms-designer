import { BausteinService } from '../bausteine/bausteinService';
import { PruefEinstellungen } from '../core/util/formularPruefung';
import { FieldGroup } from '../field-types/fieldTypes';
import { FimService } from '../fim/fimService';
import { OpenCodeService } from '../opencode/openCodeService';
import { REGION_NEUTRAL, Regionsprofil } from '../region/regionsprofil';

export interface FimModuleConfig {
  enabled: boolean;
  /** Eigener Service-Override. Default: MockFimService */
  service?: FimService;
}

export interface BausteinModuleConfig {
  enabled: boolean;
  /**
   * Eigener Katalog. Default: MockBausteinService mit drei als Beispiel
   * gekennzeichneten Bausteinen. Ein Betriebs-Host hängt hier den Katalog
   * seiner Behörde ein — siehe HttpBausteinService (ADR 0005).
   */
  service?: BausteinService;
}

export interface OpenCodeModuleConfig {
  enabled: boolean;
  /** Eigener Service-Override. Default: MockOpenCodeService */
  service?: OpenCodeService;
}

/**
 * Noch nicht fertige Funktionen, die per Flag zuschaltbar sind. Default ist
 * immer aus — ein Prototyp darf den Normalbetrieb nicht verändern.
 */
export interface FeatureFlags {
  /**
   * Geräte-Ansicht auf der Arbeitsfläche: Umschalter Desktop/Handy, der die
   * Fläche auf Handy-Breite verengt, damit sich Auswahl und Umsortieren per
   * Overlay auch dort prüfen lassen. Prototyp zu ADR 0003.
   */
  canvasGeraeteAnsicht?: boolean;
}

export interface PaletteConfig {
  /** Feldtyp-Gruppen die initial zugeklappt dargestellt werden. */
  collapsedByDefault?: FieldGroup[];
}

export interface EditorConfig {
  /**
   * Produktname in der Kopfzeile. Default: der Wert aus `i18n`
   * („JSONForms Designer").
   *
   * [RÜCKFRAGE AN FABLE: endgültiger Produktname. Bis zur Entscheidung
   * bleibt der bisherige Name der Default; Hosts können ihn schon jetzt
   * überschreiben, ohne dass eine Namensentscheidung im Code festgeschrieben
   * wird.]
   */
  produktName?: string;
  modules?: {
    fim?: FimModuleConfig;
    openCode?: OpenCodeModuleConfig;
    bausteine?: BausteinModuleConfig;
  };
  palette?: PaletteConfig;
  features?: FeatureFlags;
  /**
   * Qualitäts-Ampel: Schwellwerte und welche Prüfregeln gelten. Regeln,
   * die nur regional zutreffen — etwa die Rechtsgrundlage nach deutschem
   * Verwaltungsrecht — sind im Kern aus und werden hier eingeschaltet.
   */
  pruefung?: PruefEinstellungen;
  /**
   * Regionsprofil: Platzhalter, engere Muster und die regionalen Prüfregeln
   * (ADR 0007). Default ist `REGION_NEUTRAL` — der Kern setzt keine Region
   * voraus. Ein Profil, das Prüfregeln mitbringt, schaltet sie ein, ohne
   * dass der Host sie zusätzlich in `pruefung` nennen muss.
   */
  region?: Regionsprofil;
}

/**
 * Vollständige Config mit allen Defaults. Wird beim Mergen als Basis
 * verwendet.
 *
 * FIM und OpenCode sind **aus** (ADR 0007): Beides sind Einrichtungen der
 * deutschen Verwaltung — das Föderale Informationsmanagement und die
 * Plattform Open CoDE. Wer nur JSON-Schema-Formulare bauen will, bekommt
 * sonst zwei Reiter, die er nicht zuordnen kann. Ein Profil schaltet sie
 * ein; `packages/app` tut genau das.
 *
 * Bausteine bleiben an: Vorgefertigte Feldgruppen sind kein deutsches
 * Konzept, und der Standard-Reiter der Palette darf nicht leer sein
 * (ADR 0005).
 */
export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  modules: {
    fim: { enabled: false },
    openCode: { enabled: false },
    bausteine: { enabled: true },
  },
  palette: {
    collapsedByDefault: ['struktur', 'layout'],
  },
  features: {
    canvasGeraeteAnsicht: false,
  },
  // Neutraler Default: nur die überall gültigen Regeln.
  pruefung: {},
  region: REGION_NEUTRAL,
};

/** Merged eine partielle Nutzer-Config mit den Defaults. */
export function mergeEditorConfig(partial?: EditorConfig): EditorConfig {
  return {
    produktName: partial?.produktName,
    modules: {
      fim: {
        enabled: false,
        ...DEFAULT_EDITOR_CONFIG.modules?.fim,
        ...partial?.modules?.fim,
      },
      openCode: {
        enabled: false,
        ...DEFAULT_EDITOR_CONFIG.modules?.openCode,
        ...partial?.modules?.openCode,
      },
      bausteine: {
        enabled: true,
        ...DEFAULT_EDITOR_CONFIG.modules?.bausteine,
        ...partial?.modules?.bausteine,
      },
    },
    palette: {
      ...DEFAULT_EDITOR_CONFIG.palette,
      ...partial?.palette,
    },
    features: {
      ...DEFAULT_EDITOR_CONFIG.features,
      ...partial?.features,
    },
    pruefung: { ...DEFAULT_EDITOR_CONFIG.pruefung, ...partial?.pruefung },
    region: partial?.region ?? REGION_NEUTRAL,
  };
}

/**
 * Die geltenden Prüfeinstellungen: das, was der Host genannt hat, plus das,
 * was das Regionsprofil mitbringt. Wer ein Profil wählt, hat dessen Regeln
 * und Stichwörter gewählt, ohne sie nochmals aufzählen zu müssen.
 *
 * Das Profil kommt hier als Argument und nicht aus der Config, weil auch
 * Erweiterungspakete eines beisteuern können (ADR 0007) — die Auflösung
 * kennt nur der Provider.
 */
export function pruefEinstellungenFuer(
  config: EditorConfig,
  region?: Regionsprofil,
): PruefEinstellungen {
  return {
    ...config.pruefung,
    zusaetzlicheRegeln: [
      ...new Set([
        ...(region?.pruefRegeln ?? []),
        ...(config.pruefung?.zusaetzlicheRegeln ?? []),
      ]),
    ],
    typvorschlaege:
      config.pruefung?.typvorschlaege ?? region?.typvorschlaege ?? [],
  };
}
