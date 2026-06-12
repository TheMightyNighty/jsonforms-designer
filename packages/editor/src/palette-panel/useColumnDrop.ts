/**
 * useDrop-Hook für einzelne Spalten innerhalb eines ColumnContainer.
 * Akzeptiert FIELD_TYPE-Items und FIM-Datenfelder (keine Gruppen).
 */
import { Dispatch } from 'react';
import { useDrop } from 'react-dnd';

import { EditorAction } from '../core/model/actions';
import { createColumnDropAction } from '../core/model/addFieldActions';
import { mapDatenfeld } from '../fim/fimMapper';
import { FIM_DND_TYPE, FimDragItem } from '../fim/FimPaletteSection';
import { FIELD_TYPE_DND_TYPE, FieldTypeDragItem } from './FieldPaletteItem';

function deriveKey(fieldTypeId: string): string {
  const map: Record<string, string> = {
    'text-short': 'textfeld',
    'text-long': 'freitext',
    integer: 'ganzzahl',
    number: 'zahl',
    currency: 'betrag',
    date: 'datum',
    time: 'uhrzeit',
    datetime: 'datum_uhrzeit',
    email: 'email',
    tel: 'telefon',
    url: 'website',
    password: 'passwort',
    iban: 'iban',
    checkbox: 'checkbox',
    'checkbox-group': 'auswahl_mehrfach',
    dropdown: 'auswahl',
    radio: 'optionen',
    slider: 'wert',
    'file-upload': 'datei',
    'label-heading': '_label',
    'label-text': '_hinweis',
    'alert-info': '_info',
    'alert-warning': '_warnung',
    'col-2': '_spalten2',
    'col-3': '_spalten3',
    'col-4': '_spalten4',
    'col-custom': '_spalten_frei',
    'col-1-2': '_spalten12',
    'col-2-1': '_spalten21',
    group: '_gruppe',
    'repeat-group': 'eintraege',
  };
  return map[fieldTypeId] ?? fieldTypeId.replace(/[^a-z0-9]/gi, '_');
}

interface UseColumnDropOptions {
  containerId: string;
  columnIndex: number;
  insertAfterId?: string;
}

export function useColumnDrop(
  dispatch: Dispatch<EditorAction>,
  { containerId, columnIndex, insertAfterId }: UseColumnDropOptions,
) {
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
            propertyKey: deriveKey(fi.fieldTypeId),
            insertAfterId,
          }),
        );
      },
      collect: (mon) => ({ isOver: mon.isOver() }),
    }),
    [dispatch, containerId, columnIndex, insertAfterId],
  );
}
