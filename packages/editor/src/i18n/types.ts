/** Übersetzungs-Interface — alle Werte string, nicht Literale */
export interface EditorTranslations {
  header: {
    title: string;
    undo: string;
    redo: string;
    template: string;
    copySchema: string;
    codeModeOn: string;
    codeModeOff: string;
    previewOn: string;
    previewOff: string;
    exportImport: string;
  };
  palette: {
    groups: {
      eingabe: string;
      auswahl: string;
      struktur: string;
      layout: string;
      opencode: string;
    };
    validators: string;
    uiBausteine: string;
    fim: {
      title: string;
      datenfeldgruppen: string;
      datenfelder: string;
      suche: string;
      sucheHint: string;
      sucheMinLength: string;
      keineTreffer: string;
      quelle: string;
    };
  };
  editor: {
    dropHint: string;
    dropHere: string;
    ablegen: string;
    spalte: string;
    feldHierher: string;
    mehrstufig: string;
    seite: string;
    neuerTab: string;
  };
  properties: {
    emptyHint: string;
    label: string;
    description: string;
    placeholder: string;
    required: string;
    options: string;
    validatoren: string;
    textElement: string;
    gruppe: string;
    spaltenLayout: string;
    textInhalt: string;
    gruppenTitle: string;
  };
  dialog: {
    templateTitle: string;
    templateLoad: string;
    cancel: string;
    close: string;
    exportTitle: string;
    schemaTab: string;
    uiSchemaTab: string;
    importTab: string;
    importHint: string;
    importError: string;
    invalidJson: string;
    selectFile: string;
    download: string;
  };
  mobile: { fields: string; editor: string; properties: string };
  preview: { noContent: string };
  actions: {
    duplicate: string;
    remove: string;
    rename: string;
    release: string;
    deleteContainer: string;
  };
}
