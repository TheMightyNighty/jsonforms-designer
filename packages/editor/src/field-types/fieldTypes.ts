/**
 * Feldtyp-Katalog — die Struktur, nicht die Sprache (ADR 0007).
 *
 * Ein Eintrag beschreibt, was ein Feldtyp technisch ist: welches
 * Schema-Fragment er erzeugt, in welche uiSchema-Form er gehört, zu welcher
 * Palettengruppe er zählt. Was die Redakteurin liest — Name, Vorgabe-Label,
 * Erläuterung — steht unter `i18n.feldtypen[id]`, denn der Katalog kennt die
 * Sprache nicht. Regionales wie der Platzhalter einer Telefonnummer kommt aus
 * dem Regionsprofil (`region/`).
 */
import { JsonSchema7 } from '@jsonforms/core';

import { KERN_FARBEN } from '../theme/kernTokens';

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
  required: boolean;
}

export interface FieldTypeDefinition {
  id: string;
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

/** Alle Feldtyp-Gruppen in Anzeige-Reihenfolge. */
export const FIELD_GROUPS: readonly FieldGroup[] = [
  'eingabe',
  'auswahl',
  'struktur',
  'layout',
] as const;

const OPTIONAL: FieldDefaults = { required: false };

// ---------------------------------------------------------------------------
// Katalog
// ---------------------------------------------------------------------------

export const FIELD_TYPE_CATALOG: FieldTypeDefinition[] = [
  // ── Eingabe ──────────────────────────────────────────────────────────────

  {
    id: 'text-short',
    group: 'eingabe',
    icon: 'forms',
    schema: { type: 'string', minLength: 0, maxLength: 255 },
    uiSchema: { type: 'Control', scope: '', options: { placeholder: '' } },
    defaults: OPTIONAL,
  },
  {
    id: 'text-long',
    group: 'eingabe',
    icon: 'align-left',
    schema: { type: 'string' },
    uiSchema: {
      type: 'Control',
      scope: '',
      options: { multi: true, placeholder: '' },
    },
    defaults: OPTIONAL,
  },
  {
    id: 'integer',
    group: 'eingabe',
    icon: 'number-1',
    schema: { type: 'integer' },
    uiSchema: { type: 'Control', scope: '' },
    defaults: OPTIONAL,
  },
  {
    id: 'number',
    group: 'eingabe',
    icon: 'decimal',
    schema: { type: 'number' },
    uiSchema: { type: 'Control', scope: '' },
    defaults: OPTIONAL,
  },
  {
    // Die Währung steht nicht im Katalog: welches Zeichen gilt, weiß das
    // Regionsprofil, nicht der Feldtyp. `multipleOf` deckt die zwei
    // Nachkommastellen ab, die fast überall gelten.
    id: 'currency',
    group: 'eingabe',
    icon: 'cash',
    schema: {
      type: 'number',
      minimum: 0,
      multipleOf: 0.01,
      'x-format': 'currency',
    } as FieldSchemaFragment,
    uiSchema: { type: 'Control', scope: '', options: { step: 0.01 } },
    defaults: OPTIONAL,
  },
  {
    id: 'date',
    group: 'eingabe',
    icon: 'calendar',
    schema: { type: 'string', format: 'date' },
    uiSchema: { type: 'Control', scope: '' },
    defaults: OPTIONAL,
  },
  {
    id: 'time',
    group: 'eingabe',
    icon: 'clock',
    schema: { type: 'string', format: 'time' },
    uiSchema: { type: 'Control', scope: '' },
    defaults: OPTIONAL,
  },
  {
    id: 'datetime',
    group: 'eingabe',
    icon: 'calendar-clock',
    schema: { type: 'string', format: 'date-time' },
    uiSchema: { type: 'Control', scope: '' },
    defaults: OPTIONAL,
  },
  {
    id: 'email',
    group: 'eingabe',
    icon: 'mail',
    schema: { type: 'string', format: 'email' },
    uiSchema: { type: 'Control', scope: '', options: { placeholder: '' } },
    defaults: OPTIONAL,
  },
  {
    id: 'tel',
    group: 'eingabe',
    icon: 'phone',
    // Absichtlich weit: Rufnummern schreiben sich weltweit verschieden, und
    // ein enges Muster weist echte Nummern ab. Wer strenger prüfen will,
    // setzt das Muster im Regionsprofil.
    schema: {
      type: 'string',
      pattern: '^[+0-9 ()\\-\\/]+$',
    } as FieldSchemaFragment,
    uiSchema: { type: 'Control', scope: '', options: { placeholder: '' } },
    defaults: OPTIONAL,
  },
  {
    id: 'url',
    group: 'eingabe',
    icon: 'world',
    schema: { type: 'string', format: 'uri' },
    uiSchema: {
      type: 'Control',
      scope: '',
      options: { placeholder: 'https://' },
    },
    defaults: OPTIONAL,
  },
  {
    id: 'password',
    group: 'eingabe',
    icon: 'lock',
    schema: { type: 'string', minLength: 8 },
    uiSchema: { type: 'Control', scope: '', options: { format: 'password' } },
    defaults: OPTIONAL,
  },
  {
    // IBAN ist international (ISO 13616), nicht deutsch — nur der Platzhalter
    // mit Länderkennung kommt aus dem Regionsprofil.
    id: 'iban',
    group: 'eingabe',
    icon: 'building-bank',
    schema: {
      type: 'string',
      pattern: '^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$',
    } as FieldSchemaFragment,
    uiSchema: { type: 'Control', scope: '', options: { placeholder: '' } },
    defaults: OPTIONAL,
  },

  // ── Auswahl ───────────────────────────────────────────────────────────────

  {
    id: 'checkbox',
    group: 'auswahl',
    icon: 'checkbox',
    schema: { type: 'boolean' },
    uiSchema: { type: 'Control', scope: '' },
    defaults: OPTIONAL,
  },
  {
    id: 'checkbox-group',
    group: 'auswahl',
    icon: 'list-check',
    schema: {
      type: 'array',
      uniqueItems: true,
      items: { type: 'string', enum: ['1', '2', '3'] },
    } as FieldSchemaFragment,
    uiSchema: { type: 'Control', scope: '' },
    defaults: OPTIONAL,
  },
  {
    id: 'dropdown',
    group: 'auswahl',
    icon: 'selector',
    schema: { type: 'string', enum: ['1', '2', '3'] },
    uiSchema: { type: 'Control', scope: '' },
    defaults: OPTIONAL,
  },
  {
    id: 'radio',
    group: 'auswahl',
    icon: 'circle-dot',
    schema: { type: 'string', enum: ['1', '2', '3'] },
    uiSchema: { type: 'Control', scope: '', options: { format: 'radio' } },
    defaults: OPTIONAL,
  },
  {
    id: 'slider',
    group: 'auswahl',
    icon: 'adjustments-horizontal',
    schema: { type: 'integer', minimum: 0, maximum: 100 },
    uiSchema: { type: 'Control', scope: '', options: { slider: true } },
    defaults: OPTIONAL,
  },
  {
    id: 'file-upload',
    group: 'auswahl',
    icon: 'upload',
    schema: { type: 'string', format: 'uri' },
    uiSchema: {
      type: 'Control',
      scope: '',
      options: { accept: '.pdf,.jpg,.png' },
    },
    defaults: OPTIONAL,
  },

  // ── Wiederholung ─────────────────────────────────────────────────────────

  {
    id: 'repeat-group',
    group: 'eingabe',
    icon: 'copy-plus',
    schema: {
      type: 'array',
      items: { type: 'object', properties: {} },
    } as FieldSchemaFragment,
    uiSchema: { type: 'Control', scope: '' },
    defaults: OPTIONAL,
  },

  // ── Struktur (kein Dateneintrag) ──────────────────────────────────────────

  {
    id: 'label-heading',
    group: 'struktur',
    icon: 'heading',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: { type: 'Label', scope: '' },
    defaults: OPTIONAL,
  },
  {
    id: 'label-text',
    group: 'struktur',
    icon: 'text-size',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: { type: 'Label', scope: '' },
    defaults: OPTIONAL,
  },
  {
    id: 'alert-info',
    group: 'struktur',
    icon: 'info-circle',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: { type: 'Label', scope: '', options: { variant: 'info' } },
    defaults: OPTIONAL,
  },
  {
    id: 'alert-warning',
    group: 'struktur',
    icon: 'alert-triangle',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: { type: 'Label', scope: '', options: { variant: 'warning' } },
    defaults: OPTIONAL,
  },
  {
    id: 'section-header',
    group: 'struktur',
    icon: 'section',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: {
      type: 'Label',
      scope: '',
      options: {
        variant: 'section-header',
        bgColor: KERN_FARBEN.aktion,
        textColor: '#ffffff',
      },
    },
    defaults: OPTIONAL,
  },
  {
    id: 'annotation',
    group: 'struktur',
    icon: 'notes',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: { type: 'Label', scope: '', options: { variant: 'annotation' } },
    defaults: OPTIONAL,
  },

  // ── Layout ────────────────────────────────────────────────────────────────

  {
    id: 'col-2',
    group: 'layout',
    icon: 'layout-columns',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: {
      type: 'HorizontalLayout',
      scope: '',
      options: { widths: [1, 1] },
      elements: [],
    },
    defaults: OPTIONAL,
  },
  {
    id: 'col-3',
    group: 'layout',
    icon: 'layout-columns',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: {
      type: 'HorizontalLayout',
      scope: '',
      options: { widths: [1, 1, 1] },
      elements: [],
    },
    defaults: OPTIONAL,
  },
  {
    id: 'col-1-2',
    group: 'layout',
    icon: 'layout-sidebar',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: {
      type: 'HorizontalLayout',
      scope: '',
      options: { widths: [1, 2] },
      elements: [],
    },
    defaults: OPTIONAL,
  },
  {
    id: 'col-2-1',
    group: 'layout',
    icon: 'layout-sidebar-right',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: {
      type: 'HorizontalLayout',
      scope: '',
      options: { widths: [2, 1] },
      elements: [],
    },
    defaults: OPTIONAL,
  },
  {
    id: 'col-4',
    group: 'layout',
    icon: 'layout-columns',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: {
      type: 'HorizontalLayout',
      scope: '',
      options: { widths: [1, 1, 1, 1] },
      elements: [],
    },
    defaults: OPTIONAL,
  },
  {
    id: 'col-custom',
    group: 'layout',
    icon: 'columns-3',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: {
      type: 'HorizontalLayout',
      scope: '',
      options: { widths: [1, 2, 1] },
      elements: [],
    },
    defaults: OPTIONAL,
  },
  {
    id: 'group',
    group: 'layout',
    icon: 'layout-list',
    isStructural: true,
    schema: { type: 'null' },
    uiSchema: { type: 'Group', scope: '', elements: [] },
    defaults: OPTIONAL,
  },
];

// ---------------------------------------------------------------------------
// Registrierstelle für Feldtypen aus Erweiterungen
// ---------------------------------------------------------------------------

/**
 * Feldtypen, die eine Erweiterung mitgebracht hat (ADR 0007).
 *
 * Bewusst ein Modulzustand und keine Prop: `getFieldType` wird auch aus
 * Reducern heraus aufgerufen, und die sind reine Funktionen ohne Kontext.
 * Einen Katalog durch jede Action zu reichen, hieße, jede Signatur im Kern
 * dafür zu öffnen.
 *
 * Der Preis: Der Katalog gilt für die ganze Seite. Zwei Editor-Instanzen
 * nebeneinander mit **verschiedenen** Erweiterungen gehen damit nicht —
 * dieselbe Einschränkung wie bei einem Theme, und für den Betriebsfall
 * (eine Anwendung, eine Bibliothek) ohne Bedeutung.
 */
let zusatzFeldtypen: readonly FieldTypeDefinition[] = [];

export function setzeZusatzFeldtypen(
  liste: readonly FieldTypeDefinition[],
): void {
  zusatzFeldtypen = liste;
}

/** Kern-Katalog plus die Feldtypen aktiver Erweiterungen. */
export function alleFeldtypen(): readonly FieldTypeDefinition[] {
  return zusatzFeldtypen.length === 0
    ? FIELD_TYPE_CATALOG
    : [...FIELD_TYPE_CATALOG, ...zusatzFeldtypen];
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

export function getFieldType(id: string): FieldTypeDefinition {
  const found = alleFeldtypen().find((f) => f.id === id);
  if (!found) throw new Error(`Unbekannter Feldtyp: "${id}"`);
  return found;
}

export function getFieldTypesByGroup(group: FieldGroup): FieldTypeDefinition[] {
  return alleFeldtypen().filter((f) => f.group === group);
}
