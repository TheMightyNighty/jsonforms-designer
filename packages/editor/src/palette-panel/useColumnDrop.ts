/**
 * useDrop-Hook für einzelne Spalten innerhalb eines ColumnContainer.
 * Akzeptiert FIELD_TYPE-Items und dispatcht COLUMN_DROP.
 */
import { useDrop } from 'react-dnd';
import { Dispatch } from 'react';
import { FIELD_TYPE_DND_TYPE, FieldTypeDragItem } from './FieldPaletteItem';
import { createColumnDropAction, ColumnDropAction } from '../core/model/addFieldActions';

function deriveKey(fieldTypeId: string): string {
  const map: Record<string, string> = {
    'text-short': 'textfeld', 'text-long': 'freitext', 'integer': 'ganzzahl',
    'number': 'zahl', 'currency': 'betrag', 'date': 'datum', 'time': 'uhrzeit',
    'datetime': 'datum_uhrzeit', 'email': 'email', 'tel': 'telefon',
    'url': 'website', 'password': 'passwort', 'iban': 'iban',
    'checkbox': 'checkbox', 'checkbox-group': 'auswahl_mehrfach',
    'dropdown': 'auswahl', 'radio': 'optionen', 'slider': 'wert',
    'file-upload': 'datei', 'label-heading': '_label', 'label-text': '_hinweis',
    'alert-info': '_info', 'alert-warning': '_warnung',
    'col-2': '_spalten2', 'col-3': '_spalten3', 'col-4': '_spalten4', 'col-custom': '_spalten_frei',
    'col-1-2': '_spalten12', 'col-2-1': '_spalten21', 'group': '_gruppe',
  };
  return map[fieldTypeId] ?? fieldTypeId.replace(/[^a-z0-9]/gi, '_');
}

interface UseColumnDropOptions {
  containerId: string;
  columnIndex: number;
  insertAfterId?: string;
}

export function useColumnDrop(
  dispatch: Dispatch<ColumnDropAction | any>,
  { containerId, columnIndex, insertAfterId }: UseColumnDropOptions
) {
  return useDrop<FieldTypeDragItem, unknown, { isOver: boolean }>(
    () => ({
      accept: FIELD_TYPE_DND_TYPE,
      drop: (item: FieldTypeDragItem) => {
        dispatch(createColumnDropAction({
          containerId,
          columnIndex,
          fieldTypeId: item.fieldTypeId,
          propertyKey: deriveKey(item.fieldTypeId),
          insertAfterId,
        }));
      },
      collect: (mon) => ({ isOver: mon.isOver() }),
    }),
    [dispatch, containerId, columnIndex, insertAfterId]
  );
}
