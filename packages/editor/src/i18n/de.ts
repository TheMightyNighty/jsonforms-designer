import type { EditorTranslations } from './types';

export const de: EditorTranslations = {
  header: {
    title: 'JSONForms Designer',
    undo: 'Rückgängig', redo: 'Wiederholen',
    template: 'Vorlage laden', copySchema: 'Schema kopieren',
    codeModeOn: 'Code-Modus', codeModeOff: 'Visueller Modus',
    previewOn: 'Vorschau', previewOff: 'Bearbeiten', exportImport: 'Export / Import',
  },
  palette: {
    groups: { eingabe: 'Eingabe', auswahl: 'Auswahl', struktur: 'Text & Struktur', layout: 'Layout & Spalten', opencode: 'OpenCode' },
    validators: 'Validatoren', uiBausteine: 'UI-Bausteine',
    fim: {
      title: 'FIM-Bausteine',
      datenfeldgruppen: 'Datenfeldgruppen',
      datenfelder: 'Einzelfelder',
      suche: 'FIM-Felder suchen …',
      sucheHint: 'Suchbegriff eingeben um Einzelfelder zu finden',
      sucheMinLength: 'Mindestens 2 Zeichen eingeben …',
      keineTreffer: 'Keine Treffer',
      quelle: 'Quelle: FIM-Portal / FitKo',
    },
  },
  editor: {
    dropHint: 'Feld aus der Palette hierher ziehen, um das Formular zu beginnen.',
    dropHere: 'hier ablegen', ablegen: 'ablegen', spalte: 'Spalte',
    feldHierher: 'Feld hierher ziehen', mehrstufig: 'Mehrstufiges Formular anlegen',
    seite: 'Seite', neuerTab: 'Neuer Tab',
  },
  properties: {
    emptyHint: 'Feld auswählen,\num Eigenschaften zu bearbeiten',
    label: 'Bezeichnung (Label)', description: 'Hilfetext / Beschreibung',
    placeholder: 'Platzhalter', required: 'Pflichtfeld', options: 'Auswahloptionen',
    validatoren: 'OpenCode-Validatoren', textElement: 'Text-Element',
    gruppe: 'Gruppe', spaltenLayout: 'Spalten-Layout',
    textInhalt: 'Text-Inhalt', gruppenTitle: 'Gruppenüberschrift',
  },
  dialog: {
    templateTitle: 'Vorlage auswählen', templateLoad: 'Vorlage laden',
    cancel: 'Abbrechen', close: 'Schließen', exportTitle: 'Export / Import',
    schemaTab: 'JSON Schema', uiSchemaTab: 'UI Schema (JSONForms)', importTab: 'Import',
    importHint: 'JSON-Datei hochladen mit schema und uiSchema. Das aktuelle Formular wird überschrieben.',
    importError: 'Ungültiges Format. Erwartet: { schema, uiSchema }',
    invalidJson: 'Ungültige JSON-Datei.', selectFile: 'JSON-Datei auswählen', download: 'Herunterladen',
  },
  mobile: { fields: 'Felder', editor: 'Editor', properties: 'Eigenschaften' },
  preview: { noContent: 'Noch keine Felder vorhanden. Im visuellen Modus Felder aus der Palette hinzufügen.' },
  actions: {
    duplicate: 'Duplizieren', remove: 'Entfernen', rename: 'Umbenennen',
    release: 'Aus Spalte herauslösen', deleteContainer: 'Container entfernen',
  },
};
