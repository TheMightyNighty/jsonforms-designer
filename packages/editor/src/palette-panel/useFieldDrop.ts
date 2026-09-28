import { Dispatch } from 'react';
import { useDrop } from 'react-dnd';

import {
  BAUSTEIN_DND_TYPE,
  BausteinDragItem,
  createBausteinAction,
} from '../bausteine';
import { useEditorConfig } from '../config/EditorConfigContext';
import {
  AddFieldAction,
  AddFimGruppeAction,
  buildScope,
  createAddFieldAction,
  createAddFimGruppeAction,
} from '../core/model/addFieldActions';
import { feldtypFuerRegion, feldtypTexte } from '../field-types/feldtypTexte';
import { getFieldType } from '../field-types/fieldTypes';
import { feldtypPropertyKey } from '../field-types/propertyKey';
import { mapDatenfeld, mapDatenfeldgruppe } from '../fim/fimMapper';
import { FIM_DND_TYPE, FimDragItem } from '../fim/FimPaletteSection';
import { useI18n } from '../i18n';
import { Regionsprofil } from '../region/regionsprofil';
import { FIELD_TYPE_DND_TYPE, FieldTypeDragItem } from './FieldPaletteItem';

type FimOrFieldAction = AddFieldAction | AddFimGruppeAction;

/**
 * Erzeugt die Action für einen FIM-Eintrag — gemeinsame Logik für den
 * Drop-Pfad (Maus) und den Tastatur-Pfad (Enter/Leertaste auf einem
 * FIM-Eintrag).
 */
export function createFimPaletteAction(
  item: FimDragItem,
  insertAfterScope?: string,
  tabIndex?: number,
): FimOrFieldAction {
  if (item.type === 'datenfeld') {
    const mapping = mapDatenfeld(item.feld);
    return {
      type: 'ADD_FIELD' as const,
      payload: {
        fieldTypeId: `fim:${item.identifier}`,
        propertyKey: mapping.propertyKey,
        schemaFragment: mapping.schema,
        uiSchemaScope: buildScope(mapping.propertyKey),
        uiSchemaOptions: mapping.uiSchemaOptions,
        label: item.feld.name,
        insertAfterScope,
        tabIndex,
        isStructural: false,
      },
    };
  }

  // datenfeldgruppe
  const mapping = mapDatenfeldgruppe(item.gruppe);
  return createAddFimGruppeAction({
    gruppenName: item.gruppe.name,
    insertAfterScope,
    tabIndex,
    felder: mapping.felder.map((fm, i) => ({
      propertyKey: fm.propertyKey,
      schemaFragment: fm.schema,
      uiSchemaOptions: fm.uiSchemaOptions,
      label: item.gruppe.felder[i].name,
    })),
  });
}

/**
 * Erzeugt die ADD_FIELD-Action für einen Katalog-Feldtyp — gemeinsame Logik
 * für den Drop-Pfad (Maus) und den Tastatur-Pfad (Enter/Leertaste auf einem
 * Palette-Eintrag, siehe FieldPaletteItem).
 */
export function createPaletteFieldAction(
  fieldTypeId: string,
  label: string,
  insertAfterScope?: string,
  tabIndex?: number,
  region?: Regionsprofil,
): AddFieldAction {
  const fieldType = feldtypFuerRegion(getFieldType(fieldTypeId), region);
  const propertyKey = feldtypPropertyKey(fieldType, label);
  return createAddFieldAction(
    fieldType,
    propertyKey,
    label,
    insertAfterScope,
    tabIndex,
  );
}

export function useFieldDrop(
  dispatch: Dispatch<FimOrFieldAction>,
  insertAfterScope?: string,
  tabIndex?: number,
) {
  const { t } = useI18n();
  const { region } = useEditorConfig();
  return useDrop<
    FieldTypeDragItem | FimDragItem | BausteinDragItem,
    unknown,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: [FIELD_TYPE_DND_TYPE, FIM_DND_TYPE, BAUSTEIN_DND_TYPE],
      drop: (item) => {
        if (item.dndType === BAUSTEIN_DND_TYPE) {
          dispatch(
            createBausteinAction(item.baustein, insertAfterScope, tabIndex),
          );
          return;
        }
        if (item.dndType === FIM_DND_TYPE) {
          dispatch(createFimPaletteAction(item, insertAfterScope, tabIndex));
          return;
        }
        dispatch(
          createPaletteFieldAction(
            item.fieldTypeId,
            feldtypTexte(t, item.fieldTypeId).label,
            insertAfterScope,
            tabIndex,
            region,
          ),
        );
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [dispatch, insertAfterScope, tabIndex, t, region],
  );
}
