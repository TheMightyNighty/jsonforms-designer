/**
 * Zentrales Registry-Modul für die Vorschau-Varianten (AUFTRAG 2.3): jede
 * Variante ist ein vollständiges, eigenständiges JSONForms-Renderer-Set.
 * PREVIEW_VARIANTS dient dem Umschalter zur einfachen Iteration.
 */
import { kernVariant } from './kern';
import { portalVariant } from './portal';
import { PreviewVariant } from './shared';
import { standardVariant } from './standard';

export * from './kern';
export * from './portal';
export * from './shared';
export * from './standard';

export const PREVIEW_VARIANTS: PreviewVariant[] = [
  standardVariant,
  portalVariant,
  kernVariant,
];
