/**
 * Action-Union des Editors (Form-First). Extern geladene Schemas laufen
 * über `fieldStateFromSchemas()` + SET_FIELD_STATE.
 */
import type {
  SetFieldRuleAction,
  UpdateFieldPropertyAction,
} from '../../properties/fieldPropertiesActions';
import type { AddFieldAction } from './addFieldActions';
import type { RemoveFieldAction } from './addFieldActions';
import type { LoadTemplateAction } from './addFieldActions';
import type { SetFieldStateAction } from './addFieldActions';
import type { TabAction } from './addFieldActions';
import type { ColumnDropAction } from './addFieldActions';
import type { MoveElementAction } from './addFieldActions';
import type { ReorderInColumnAction } from './addFieldActions';
import type { ToggleLineNumbersAction } from './addFieldActions';
import type { SetSectionColorAction } from './addFieldActions';
import type { ReorderElementAction } from './addFieldActions';
import type {
  AddFimGruppeAction,
  SetFormMetadataAction,
} from './addFieldActions';

export type EditorAction =
  | AddFieldAction
  | RemoveFieldAction
  | LoadTemplateAction
  | SetFieldStateAction
  | TabAction
  | ColumnDropAction
  | MoveElementAction
  | ReorderElementAction
  | ReorderInColumnAction
  | ToggleLineNumbersAction
  | SetSectionColorAction
  | AddFimGruppeAction
  | SetFormMetadataAction
  | UpdateFieldPropertyAction
  | SetFieldRuleAction;

// Re-exports für bequemen Import aus ./actions
export { UPDATE_FIELD_PROPERTY } from '../../properties/fieldPropertiesActions';
export { ADD_FIELD } from './addFieldActions';
export { REMOVE_FIELD } from './addFieldActions';
export { LOAD_TEMPLATE } from './addFieldActions';
export { ADD_FIM_GRUPPE } from './addFieldActions';
export { SET_FORM_METADATA } from './addFieldActions';
export { SET_FIELD_STATE } from './addFieldActions';
export {
  ADD_TAB,
  REMOVE_TAB,
  RENAME_TAB,
  REORDER_TABS,
  SET_ACTIVE_TAB,
} from './addFieldActions';
export {
  COLUMN_DROP,
  MOVE_ELEMENT,
  REORDER_ELEMENT,
  REORDER_IN_COLUMN,
  SET_SECTION_COLOR,
  TOGGLE_LINE_NUMBERS,
} from './addFieldActions';
