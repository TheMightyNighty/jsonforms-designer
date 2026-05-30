import { useDrop } from 'react-dnd';
import { Dispatch } from 'react';
import { FIELD_TYPE_DND_TYPE, FieldTypeDragItem } from './FieldPaletteItem';
import { getFieldType } from '../field-types/fieldTypes';
import { createAddFieldAction, AddFieldAction } from '../core/model/addFieldActions';

function derivePropertyKey(fieldTypeId: string): string {
  const keyMap: Record<string, string> = {
    'text-short':    'textfeld',
    'text-long':     'freitext',
    'integer':       'ganzzahl',
    'number':        'zahl',
    'currency':      'betrag',
    'date':          'datum',
    'time':          'uhrzeit',
    'datetime':      'datum_uhrzeit',
    'email':         'email',
    'tel':           'telefon',
    'url':           'website',
    'password':      'passwort',
    'iban':          'iban',
    'checkbox':      'checkbox',
    'checkbox-group':'auswahl_mehrfach',
    'dropdown':      'auswahl',
    'radio':         'optionen',
    'slider':        'wert',
    'file-upload':   'datei',
    // Strukturelle Elemente — Key wird als UUID-Suffix genutzt (kein schema-Property)
    'section-header':'_abschnitt',
    'annotation':    '_annotation',
    'label-heading': '_label',
    'label-text':    '_hinweis',
    'alert-info':    '_info',
    'alert-warning': '_warnung',
    'col-2':         '_spalten2',
    'col-3':         '_spalten3',
    'col-4':         '_spalten4',
    'col-custom':    '_spalten_frei',
    'col-1-2':       '_spalten12',
    'col-2-1':       '_spalten21',
    'group':         '_gruppe',
  };
  return keyMap[fieldTypeId] ?? fieldTypeId.replace(/[^a-z0-9]/gi, '_');
}

export function useFieldDrop(
  dispatch: Dispatch<AddFieldAction>,
  insertAfterScope?: string,
  tabIndex?: number
) {
  return useDrop<FieldTypeDragItem, unknown, { isOver: boolean; canDrop: boolean }>(
    () => ({
      accept: FIELD_TYPE_DND_TYPE,
      drop: (item: FieldTypeDragItem) => {
        const fieldType = getFieldType(item.fieldTypeId);
        const propertyKey = derivePropertyKey(item.fieldTypeId);
        const action = createAddFieldAction(fieldType, propertyKey, insertAfterScope, tabIndex);
        dispatch(action);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [dispatch, insertAfterScope, tabIndex]
  );
}
