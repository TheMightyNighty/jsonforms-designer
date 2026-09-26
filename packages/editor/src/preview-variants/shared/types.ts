/**
 * PreviewVariant: die harte Architekturvorgabe aus AUFTRAG 2.3 — eine
 * Variante ist ein vollständiges JSONForms-Renderer-Set (renderers + cells),
 * kein Stylesheet-Wechsel. Die Vorschau übergibt das gewählte Set
 * unverändert an `<JsonForms renderers={…} cells={…}>`.
 */
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import { ComponentType, ReactNode } from 'react';

export interface PreviewVariant {
  id: 'standard' | 'portal' | 'kern';
  /** Anzeigename im Umschalter, z. B. „Standard (Material)". */
  name: string;
  /** Kurzbeschreibung für Tooltip/Info (Claim-Hygiene, siehe README). */
  description: string;
  renderers: JsonFormsRendererRegistryEntry[];
  cells: JsonFormsCellRendererRegistryEntry[];
  /** Umschließt die JsonForms-Instanz (Theme/Design-Tokens der Variante). */
  ThemeProvider: ComponentType<{ children: ReactNode }>;
}
