import { useDrop } from 'react-dnd';
import { Dispatch } from 'react';
import { FIELD_TYPE_DND_TYPE, FieldTypeDragItem } from './FieldPaletteItem';
import { getFieldType } from '../field-types/fieldTypes';
import { createAddFieldAction, AddFieldAction, createAddFimGruppeAction, AddFimGruppeAction, buildScope } from '../core/model/addFieldActions';
import { FIM_DND_TYPE, FimDragItem } from '../fim/FimPaletteSection';
import { mapDatenfeld, mapDatenfeldgruppe } from '../fim/fimMapper';

type FimOrFieldAction = AddFieldAction | AddFimGruppeAction;

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
    'repeat-group':  'eintraege',
  };
  return keyMap[fieldTypeId] ?? fieldTypeId.replace(/[^a-z0-9]/gi, '_');
}

function handleFimDrop(item: FimDragItem, insertAfterScope?: string, tabIndex?: number): FimOrFieldAction {
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

export function useFieldDrop(
  dispatch: Dispatch<FimOrFieldAction>,
  insertAfterScope?: string,
  tabIndex?: number
) {
  return useDrop<FieldTypeDragItem | FimDragItem, unknown, { isOver: boolean; canDrop: boolean }>(
    () => ({
      accept: [FIELD_TYPE_DND_TYPE, FIM_DND_TYPE],
      drop: (item) => {
        if (item.dndType === FIM_DND_TYPE) {
          dispatch(handleFimDrop(item, insertAfterScope, tabIndex));
          return;
        }
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
