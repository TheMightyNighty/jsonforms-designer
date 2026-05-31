import { FimService } from '../fim/fimService';
import { OpenCodeService } from '../opencode/openCodeService';
import { FieldGroup } from '../field-types/fieldTypes';

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

export interface PaletteConfig {
  /** Feldtyp-Gruppen die initial zugeklappt dargestellt werden. */
  collapsedByDefault?: FieldGroup[];
}

export interface EditorConfig {
  modules?: {
    fim?: FimModuleConfig;
    openCode?: OpenCodeModuleConfig;
  };
  palette?: PaletteConfig;
}

/** Vollständige Config mit allen Defaults. Wird beim Mergen als Basis verwendet. */
export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  modules: {
    fim:      { enabled: true },
    openCode: { enabled: true },
  },
  palette: {
    collapsedByDefault: ['struktur', 'layout'],
  },
};

/** Merged eine partielle Nutzer-Config mit den Defaults. */
export function mergeEditorConfig(partial?: EditorConfig): EditorConfig {
  return {
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
  };
}
