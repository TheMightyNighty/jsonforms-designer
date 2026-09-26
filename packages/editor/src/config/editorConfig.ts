import { FieldGroup } from '../field-types/fieldTypes';
import { FimService } from '../fim/fimService';
import { OpenCodeService } from '../opencode/openCodeService';

export interface FimModuleConfig {
  enabled: boolean;
  /** Eigener Service-Override. Default: MockFimService */
  service?: FimService;
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
  };
  palette?: PaletteConfig;
  features?: FeatureFlags;
}

/** Vollständige Config mit allen Defaults. Wird beim Mergen als Basis verwendet. */
export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  modules: {
    fim: { enabled: true },
    openCode: { enabled: true },
  },
  palette: {
    collapsedByDefault: ['struktur', 'layout'],
  },
  features: {
    canvasGeraeteAnsicht: false,
  },
};

/** Merged eine partielle Nutzer-Config mit den Defaults. */
export function mergeEditorConfig(partial?: EditorConfig): EditorConfig {
  return {
    produktName: partial?.produktName,
    modules: {
      fim: {
        enabled: true,
        ...DEFAULT_EDITOR_CONFIG.modules?.fim,
        ...partial?.modules?.fim,
      },
      openCode: {
        enabled: true,
        ...DEFAULT_EDITOR_CONFIG.modules?.openCode,
        ...partial?.modules?.openCode,
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
  };
}
