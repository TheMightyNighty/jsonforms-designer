import { JsonSchema7 } from '@jsonforms/core';

export type FieldGroup = 'eingabe' | 'auswahl' | 'struktur' | 'layout';

export type FieldSchemaFragment = JsonSchema7 & {
  title?: string;
  description?: string;
};

export interface FieldUiSchemaFragment {
  type: 'Control' | 'Label' | 'HorizontalLayout' | 'VerticalLayout' | 'Group';
  scope: string;
  label?: string;
  options?: Record<string, unknown>;
  elements?: FieldUiSchemaFragment[];
}

export interface FieldDefaults {
  label: string;
  description: string;
  required: boolean;
}

export interface FieldTypeDefinition {
  id: string;
  displayName: string;
  group: FieldGroup;
  icon: string;
  /**
   * isStructural: true → Feld erzeugt keine schema.property,
   * nur einen uiSchema-Eintrag (Label, Divider, Alert etc.)
   */
  isStructural?: boolean;
  schema: FieldSchemaFragment;
  uiSchema: FieldUiSchemaFragment;
  defaults: FieldDefaults;
}

// ---------------------------------------------------------------------------
// Katalog
// ---------------------------------------------------------------------------

export const FIELD_TYPE_CATALOG: FieldTypeDefinition[] = [

  // ── Eingabe ──────────────────────────────────────────────────────────────

  {
    id: 'text-short',
    displayName: 'Textfeld (einzeilig)',
    group: 'eingabe',
    icon: 'forms',
    schema: { type: 'string', title: 'Textfeld', minLength: 0, maxLength: 255 },
    uiSchema: { type: 'Control', scope: '', options: { placeholder: '' } },
    defaults: { label: 'Textfeld', description: '', required: false },
  },
  {
    id: 'text-long',
    displayName: 'Textfeld (mehrzeilig)',
    group: 'eingabe',
    icon: 'align-left',
    schema: { type: 'string', title: 'Freitext' },
    uiSchema: { type: 'Control', scope: '', options: { multi: true, placeholder: '' } },
    defaults: { label: 'Freitext', description: '', required: false },
  },
  {
    id: 'integer',
    displayName: 'Ganzzahl',
    group: 'eingabe',
    icon: 'number-1',
    schema: { type: 'integer', title: 'Ganzzahl' },
    uiSchema: { type: 'Control', scope: '' },
    defaults: { label: 'Ganzzahl', description: '', required: false },
  },
  {
    id: 'number',
    displayName: 'Dezimalzahl',
    group: 'eingabe',
    icon: 'decimal',
    schema: { type: 'number', title: 'Zahl' },
    uiSchema: { type: 'Control', scope: '' },
    defaults: { label: 'Zahl', description: '', required: false },
  },
  {
    id: 'currency',
    displayName: 'Betrag (€)',
    group: 'eingabe',
    icon: 'currency-euro',
    schema: {
      type: 'number',
      title: 'Betrag',
      minimum: 0,
      multipleOf: 0.01,
      'x-format': 'currency',
    } as FieldSchemaFragment,
    uiSchema: { type: 'Control', scope: '', options: { step: 0.01 } },
    defaults: { label: 'Betrag (€)', description: '', required: false },
  },
  {
    id: 'date',
    displayName: 'Datum',
    group: 'eingabe',
    icon: 'calendar',
    schema: { type: 'string', format: 'date', title: 'Datum' },
    uiSchema: { type: 'Control', scope: '' },
    defaults: { label: 'Datum', description: '', required: false },
  },
  {
    id: 'time',
    displayName: 'Uhrzeit',
    group: 'eingabe',
    icon: 'clock',
    schema: { type: 'string', format: 'time', title: 'Uhrzeit' },
    uiSchema: { type: 'Control', scope: '' },
    defaults: { label: 'Uhrzeit', description: '', required: false },
  },
  {
    id: 'datetime',
    displayName: 'Datum + Uhrzeit',
    group: 'eingabe',
    icon: 'calendar-clock',
    schema: { type: 'string', format: 'date-time', title: 'Datum und Uhrzeit' },
    uiSchema: { type: 'Control', scope: '' },
    defaults: { label: 'Datum und Uhrzeit', description: '', required: false },
  },
  {
    id: 'email',
    displayName: 'E-Mail-Adresse',
    group: 'eingabe',
    icon: 'mail',
    schema: { type: 'string', format: 'email', title: 'E-Mail-Adresse' },
    uiSchema: { type: 'Control', scope: '', options: { placeholder: 'name@behoerde.de' } },
    defaults: { label: 'E-Mail-Adresse', description: '', required: false },
  },
  {
    id: 'tel',
    displayName: 'Telefonnummer',
    group: 'eingabe',
    icon: 'phone',
    schema: {
      type: 'string',
      title: 'Telefonnummer',
      pattern: '^[+0-9 ()\\-\\/]+$',
    } as FieldSchemaFragment,
    uiSchema: { type: 'Control', scope: '', options: { placeholder: '+49 30 ...' } },
    defaults: { label: 'Telefonnummer', description: '', required: false },
  },
  {
    id: 'url',
    displayName: 'Website-URL',
    group: 'eingabe',
    icon: 'world',
    schema: { type: 'string', format: 'uri', title: 'Website' },
    uiSchema: { type: 'Control', scope: '', options: { placeholder: 'https://' } },
    defaults: { label: 'Website', description: '', required: false },
  },
  {
    id: 'password',
    displayName: 'Passwort',
    group: 'eingabe',
    icon: 'lock',
    schema: { type: 'string', title: 'Passwort', minLength: 8 },
    uiSchema: { type: 'Control', scope: '', options: { format: 'password' } },
    defaults: { label: 'Passwort', description: 'Mindestens 8 Zeichen', required: false },
  },
  {
    id: 'iban',
    displayName: 'IBAN',
    group: 'eingabe',
    icon: 'building-bank',
    schema: {
      type: 'string',
      title: 'IBAN',
      pattern: '^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$',
    } as FieldSchemaFragment,
    uiSchema: { type: 'Control', scope: '', options: { placeholder: 'DE89 3704 0044 0532 0130 00' } },
    defaults: { label: 'IBAN', description: 'Internationale Bankkontonummer', required: false },
  },

  // ── Auswahl ───────────────────────────────────────────────────────────────

  {
    id: 'checkbox',
    displayName: 'Checkbox (Ja/Nein)',
    group: 'auswahl',
    icon: 'checkbox',
    schema: { type: 'boolean', title: 'Checkbox' },
    uiSchema: { type: 'Control', scope: '' },
    defaults: { label: 'Checkbox', description: '', required: false },
  },
  {
    id: 'checkbox-group',
    displayName: 'Mehrfachauswahl',
    group: 'auswahl',
    icon: 'checkboxes',
    schema: {
      type: 'array',
      title: 'Mehrfachauswahl',
      uniqueItems: true,
      items: { type: 'string', enum: ['Option 1', 'Option 2', 'Option 3'] },
    } as FieldSchemaFragment,
    uiSchema: { type: 'Control', scope: '' },
    defaults: { label: 'Mehrfachauswahl', description: '', required: false },
  },
  {
    id: 'dropdown',
    displayName: 'Dropdown',
    group: 'auswahl',
    icon: 'selector',
    schema: { type: 'string', title: 'Auswahl', enum: ['Option 1', 'Option 2', 'Option 3'] },
    uiSchema: { type: 'Control', scope: '' },
    defaults: { label: 'Auswahl', description: '', required: false },
  },
  {
    id: 'radio',
    displayName: 'Radio-Gruppe',
    group: 'auswahl',
    icon: 'circle-dot',
    schema: { type: 'string', title: 'Optionen', enum: ['Option 1', 'Option 2', 'Option 3'] },
    uiSchema: { type: 'Control', scope: '', options: { format: 'radio' } },
    defaults: { label: 'Optionen', description: '', required: false },
  },
  {
    id: 'slider',
    displayName: 'Schieberegler',
    group: 'auswahl',
    icon: 'adjustments-horizontal',
    schema: { type: 'integer', title: 'Wert', minimum: 0, maximum: 100 },
    uiSchema: { type: 'Control', scope: '', options: { slider: true } },
    defaults: { label: 'Wert', description: '0 – 100', required: false },
  },
  {
    id: 'file-upload',
    displayName: 'Datei-Upload',
    group: 'auswahl',
    icon: 'upload',
    schema: { type: 'string', title: 'Datei', format: 'uri' },
    uiSchema: { type: 'Control', scope: '', options: { accept: '.pdf,.jpg,.png' } },
    defaults: { label: 'Datei', description: 'Erlaubte Formate: PDF, JPG, PNG', required: false },
  },

  // ── Wiederholung ─────────────────────────────────────────────────────────

  {
    id: 'repeat-group',
    displayName: 'Wiederholungsgruppe',
    group: 'eingabe',
    icon: 'copy-plus',
    schema: {
      type: 'array',
      title: 'Einträge',
      items: { type: 'object', properties: {} },
    } as FieldSchemaFragment,
    uiSchema: { type: 'Control', scope: '' },
    defaults: {
      label: 'Wiederholungsgruppe',
      description: 'Mehrere Einträge hinzufügen (z. B. Personen, Kinder)',
      required: false,
    },
  },

  // ── Struktur (kein Dateneintrag) ──────────────────────────────────────────

  {
    id: 'label-heading',
    displayName: 'Überschrift',
    group: 'struktur',
    icon: 'heading',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: { type: 'Label', scope: '', label: 'Überschrift' },
    defaults: { label: 'Überschrift', description: '', required: false },
  },
  {
    id: 'label-text',
    displayName: 'Hinweistext',
    group: 'struktur',
    icon: 'text-size',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: { type: 'Label', scope: '', label: 'Hier steht ein Hinweistext.' },
    defaults: { label: 'Hinweistext', description: '', required: false },
  },
  {
    id: 'alert-info',
    displayName: 'Infobox',
    group: 'struktur',
    icon: 'info-circle',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: {
      type: 'Label',
      scope: '',
      label: 'ℹ Information',
      options: { variant: 'info' },
    },
    defaults: { label: 'ℹ Information', description: '', required: false },
  },
  {
    id: 'alert-warning',
    displayName: 'Warnhinweis',
    group: 'struktur',
    icon: 'alert-triangle',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: {
      type: 'Label',
      scope: '',
      label: '⚠ Wichtiger Hinweis',
      options: { variant: 'warning' },
    },
    defaults: { label: '⚠ Wichtiger Hinweis', description: '', required: false },
  },

  // ── Layout ────────────────────────────────────────────────────────────────

  {
    id: 'col-2',
    displayName: '2 Spalten',
    group: 'layout',
    icon: 'layout-columns',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: {
      type: 'HorizontalLayout',
      scope: '',
      options: { widths: [1, 1] },
      elements: [],
    },
    defaults: { label: '2 Spalten', description: 'Zwei gleichbreite Spalten', required: false },
  },
  {
    id: 'col-3',
    displayName: '3 Spalten',
    group: 'layout',
    icon: 'layout-columns',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: {
      type: 'HorizontalLayout',
      scope: '',
      options: { widths: [1, 1, 1] },
      elements: [],
    },
    defaults: { label: '3 Spalten', description: 'Drei gleichbreite Spalten', required: false },
  },
  {
    id: 'col-1-2',
    displayName: 'Schmal + Breit',
    group: 'layout',
    icon: 'layout-sidebar',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: {
      type: 'HorizontalLayout',
      scope: '',
      options: { widths: [1, 2] },
      elements: [],
    },
    defaults: { label: 'Schmal + Breit (1:2)', description: 'Z.B. PLZ + Ort', required: false },
  },
  {
    id: 'col-2-1',
    displayName: 'Breit + Schmal',
    group: 'layout',
    icon: 'layout-sidebar-right',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: {
      type: 'HorizontalLayout',
      scope: '',
      options: { widths: [2, 1] },
      elements: [],
    },
    defaults: { label: 'Breit + Schmal (2:1)', description: 'Z.B. Straße + Hausnummer', required: false },
  },
  {
    id: 'col-4',
    displayName: '4 Spalten',
    group: 'layout',
    icon: 'layout-columns',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: { type: 'HorizontalLayout', scope: '', options: { widths: [1, 1, 1, 1] }, elements: [] },
    defaults: { label: '4 Spalten', description: 'Vier gleichbreite Spalten', required: false },
  },
  {
    id: 'col-custom',
    displayName: 'Spalten (frei)',
    group: 'layout',
    icon: 'columns-3',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: { type: 'HorizontalLayout', scope: '', options: { widths: [1, 2, 1] }, elements: [] },
    defaults: { label: 'Spalten (frei konfigurierbar)', description: 'Breiten z.B. 1:2:1', required: false },
  },
  {
    id: 'section-header',
    displayName: 'Abschnittskopf',
    group: 'struktur',
    icon: 'section',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: {
      type: 'Label',
      scope: '',
      label: 'Abschnittstitel',
      options: { variant: 'section-header', bgColor: '#004A99', textColor: '#ffffff' },
    },
    defaults: { label: 'Abschnittstitel', description: 'Dunkler Abschnittskopf wie im Steuerformular', required: false },
  },
  {
    id: 'annotation',
    displayName: 'Annotation (Hinweis rechts)',
    group: 'struktur',
    icon: 'notes',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: {
      type: 'Label',
      scope: '',
      label: 'Hinweis: ...',
      options: { variant: 'annotation' },
    },
    defaults: { label: 'Hinweistext (rechts)', description: 'Kleiner Erläuterungstext neben Feldern', required: false },
  },
  {
    id: 'group',
    displayName: 'Gruppe (benannt)',
    group: 'layout',
    icon: 'layout-list',
    isStructural: true,
    schema: { type: 'null', title: '' },
    uiSchema: {
      type: 'Group',
      scope: '',
      label: 'Gruppe',
      elements: [],
    },
    defaults: { label: 'Gruppe', description: 'Benannter Abschnitt mit Rahmen', required: false },
  },
];

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

export function getFieldType(id: string): FieldTypeDefinition {
  const found = FIELD_TYPE_CATALOG.find((f) => f.id === id);
  if (!found) throw new Error(`Unbekannter Feldtyp: "${id}"`);
  return found;
}

export function getFieldTypesByGroup(group: FieldGroup): FieldTypeDefinition[] {
  return FIELD_TYPE_CATALOG.filter((f) => f.group === group);
}

export const FIELD_GROUPS: Array<{ id: FieldGroup; label: string }> = [
  { id: 'eingabe',  label: 'Eingabe' },
  { id: 'auswahl',  label: 'Auswahl' },
  { id: 'struktur', label: 'Text & Struktur' },
  { id: 'layout',   label: 'Layout & Spalten' },
];
