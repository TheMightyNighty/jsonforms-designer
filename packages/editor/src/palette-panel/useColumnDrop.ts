/**
 * useDrop-Hook für einzelne Spalten innerhalb eines ColumnContainer.
 * Akzeptiert FIELD_TYPE-Items und FIM-Datenfelder (keine Gruppen).
 */
import { Dispatch } from 'react';
import { useDrop } from 'react-dnd';

import { useEditorConfig } from '../config/EditorConfigContext';
import { EditorAction } from '../core/model/actions';
import { createColumnDropAction } from '../core/model/addFieldActions';
import { feldtypTexte } from '../field-types/feldtypTexte';
import { getFieldType } from '../field-types/fieldTypes';
import { feldtypPropertyKey } from '../field-types/propertyKey';
import { mapDatenfeld } from '../fim/fimMapper';
import { FIM_DND_TYPE, FimDragItem } from '../fim/FimPaletteSection';
import { useI18n } from '../i18n';
import { FIELD_TYPE_DND_TYPE, FieldTypeDragItem } from './FieldPaletteItem';

interface UseColumnDropOptions {
  containerId: string;
  columnIndex: number;
  insertAfterId?: string;
}

export function useColumnDrop(
  dispatch: Dispatch<EditorAction>,
  { containerId, columnIndex, insertAfterId }: UseColumnDropOptions,
) {
  const { t } = useI18n();
  const { region } = useEditorConfig();
  return useDrop<FieldTypeDragItem | FimDragItem, unknown, { isOver: boolean }>(
    () => ({
      accept: [FIELD_TYPE_DND_TYPE, FIM_DND_TYPE],
      canDrop: (item) => {
        // Datenfeldgruppen können nicht in eine Spalte fallen
        if (item.dndType === FIM_DND_TYPE && item.type === 'datenfeldgruppe')
          return false;
        return true;
      },
      drop: (item) => {
        if (item.dndType === FIM_DND_TYPE && item.type === 'datenfeld') {
          const mapping = mapDatenfeld(item.feld);
          dispatch(
            createColumnDropAction({
              containerId,
              columnIndex,
              fieldTypeId: `fim:${item.identifier}`,
              propertyKey: mapping.propertyKey,
              label: item.feld.name,
              insertAfterId,
              fimSchema: mapping.schema,
              fimUiOptions: mapping.uiSchemaOptions,
            }),
          );
          return;
        }
        const fi = item as FieldTypeDragItem;
        dispatch(
          createColumnDropAction({
            containerId,
            columnIndex,
            fieldTypeId: fi.fieldTypeId,
            propertyKey: feldtypPropertyKey(
              getFieldType(fi.fieldTypeId),
              feldtypTexte(t, fi.fieldTypeId).label,
            ),
            label: feldtypTexte(t, fi.fieldTypeId).label,
            platzhalter: region?.platzhalter?.[fi.fieldTypeId],
            insertAfterId,
          }),
        );
      },
      collect: (mon) => ({ isOver: mon.isOver() }),
    }),
    [dispatch, containerId, columnIndex, insertAfterId, t, region],
  );
}
