/**
 * Einfügepfad für Bausteine — gemeinsam für Maus (Drop) und Tastatur
 * (Enter/Leertaste).
 *
 * Bausteine werden über dieselbe Action eingefügt wie FIM-Datenfeldgruppen
 * (`ADD_FIM_GRUPPE`); einen zweiten Einfügepfad gibt es bewusst nicht.
 */
import {
  AddFimGruppeAction,
  createAddFimGruppeAction,
} from '../core/model/addFieldActions';
import { Baustein } from './bausteinService';

/** DnD-Typ der Baustein-Palette — getrennt von FIELD_TYPE und FIM. */
export const BAUSTEIN_DND_TYPE = 'BAUSTEIN' as const;

export interface BausteinDragItem {
  dndType: typeof BAUSTEIN_DND_TYPE;
  /**
   * Der vollständige Baustein, nicht nur seine id: Der Katalog kommt
   * asynchron aus einem Dienst, eine Nachschlage-Tabelle steht dem
   * Drop-Handler also nicht synchron zur Verfügung. Dieselbe Lösung wie bei
   * FIM-Datenfeldgruppen (`FimDragItem.gruppe`).
   */
  baustein: Baustein;
}

export function createBausteinAction(
  baustein: Baustein,
  insertAfterScope?: string,
  tabIndex?: number,
): AddFimGruppeAction {
  return createAddFimGruppeAction({
    gruppenName: baustein.name,
    insertAfterScope,
    tabIndex,
    felder: baustein.felder.map((feld) => ({
      propertyKey: feld.propertyKey,
      schemaFragment: feld.schemaFragment,
      uiSchemaOptions: feld.uiSchemaOptions,
      label: feld.label,
    })),
  });
}
