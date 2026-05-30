import type { EditorTranslations } from './types';

export const en: EditorTranslations = {
  header: {
    title: 'JSONForms Designer',
    undo: 'Undo', redo: 'Redo',
    template: 'Load template', copySchema: 'Copy schema',
    codeModeOn: 'Code mode', codeModeOff: 'Visual mode',
    previewOn: 'Preview', previewOff: 'Edit', exportImport: 'Export / Import',
  },
  palette: {
    groups: { eingabe: 'Input', auswahl: 'Selection', struktur: 'Text & Structure', layout: 'Layout & Columns', opencode: 'OpenCode' },
    validators: 'Validators', uiBausteine: 'UI components',
  },
  editor: {
    dropHint: 'Drag a field from the palette to start your form.',
    dropHere: 'drop here', ablegen: 'drop', spalte: 'Column',
    feldHierher: 'Drag field here', mehrstufig: 'Create multi-step form',
    seite: 'Page', neuerTab: 'New tab',
  },
  properties: {
    emptyHint: 'Select a field\nto edit its properties',
    label: 'Label', description: 'Help text / Description',
    placeholder: 'Placeholder', required: 'Required field', options: 'Options',
    validatoren: 'OpenCode validators', textElement: 'Text element',
    gruppe: 'Group', spaltenLayout: 'Column layout',
    textInhalt: 'Text content', gruppenTitle: 'Group heading',
  },
  dialog: {
    templateTitle: 'Select template', templateLoad: 'Load template',
    cancel: 'Cancel', close: 'Close', exportTitle: 'Export / Import',
    schemaTab: 'JSON Schema', uiSchemaTab: 'UI Schema (JSONForms)', importTab: 'Import',
    importHint: 'Upload a JSON file with schema and uiSchema. The current form will be overwritten.',
    importError: 'Invalid format. Expected: { schema, uiSchema }',
    invalidJson: 'Invalid JSON file.', selectFile: 'Select JSON file', download: 'Download',
  },
  mobile: { fields: 'Fields', editor: 'Editor', properties: 'Properties' },
  preview: { noContent: 'No fields yet. Add fields from the palette in visual mode.' },
  actions: {
    duplicate: 'Duplicate', remove: 'Remove', rename: 'Rename',
    release: 'Move out of column', deleteContainer: 'Remove container',
  },
};
