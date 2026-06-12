import { FieldStateInput } from '../core/model/addFieldReducer';

export interface FormTemplate {
  id: string;
  displayName: string;
  description: string;
  icon: string;
  state: FieldStateInput;
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'kontakt',
    displayName: 'Kontaktformular',
    description: 'Vorname, Nachname, E-Mail, Nachricht',
    icon: 'mail',
    state: {
      schema: {
        type: 'object',
        properties: {
          vorname: { type: 'string', title: 'Vorname', minLength: 1 },
          nachname: { type: 'string', title: 'Nachname', minLength: 1 },
          email: { type: 'string', title: 'E-Mail-Adresse', format: 'email' },
          nachricht: { type: 'string', title: 'Ihre Nachricht' },
        },
        required: ['vorname', 'nachname', 'email'],
      },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/vorname' },
          { type: 'Control', scope: '#/properties/nachname' },
          { type: 'Control', scope: '#/properties/email' },
          {
            type: 'Control',
            scope: '#/properties/nachricht',
            options: { multi: true },
          },
        ],
      },
      tabs: [],
      activeTabIndex: 0,
      tabAssignments: {},
      lineNumbersEnabled: false,
      sectionColors: {},
    },
  },
  {
    id: 'adresse',
    displayName: 'Adressformular',
    description: 'Straße, Hausnummer, PLZ, Ort, Land',
    icon: 'map-pin',
    state: {
      schema: {
        type: 'object',
        properties: {
          strasse: { type: 'string', title: 'Straße' },
          hausnummer: { type: 'string', title: 'Hausnummer' },
          plz: {
            type: 'string',
            title: 'Postleitzahl',
            minLength: 5,
            maxLength: 5,
          },
          ort: { type: 'string', title: 'Ort' },
          land: {
            type: 'string',
            title: 'Land',
            enum: ['Deutschland', 'Österreich', 'Schweiz'],
          },
        },
        required: ['strasse', 'hausnummer', 'plz', 'ort'],
      },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/strasse' },
          { type: 'Control', scope: '#/properties/hausnummer' },
          { type: 'Control', scope: '#/properties/plz' },
          { type: 'Control', scope: '#/properties/ort' },
          { type: 'Control', scope: '#/properties/land' },
        ],
      },
      tabs: [],
      activeTabIndex: 0,
      tabAssignments: {},
      lineNumbersEnabled: false,
      sectionColors: {},
    },
  },
  {
    id: 'anliegen',
    displayName: 'Anliegen mit Anhang',
    description: 'Betreff, Beschreibung, Kategorie, Zustimmung',
    icon: 'file-description',
    state: {
      schema: {
        type: 'object',
        properties: {
          betreff: { type: 'string', title: 'Betreff' },
          kategorie: {
            type: 'string',
            title: 'Kategorie',
            enum: ['Allgemein', 'Beschwerde', 'Anfrage', 'Sonstiges'],
          },
          beschreibung: { type: 'string', title: 'Beschreibung' },
          zustimmung: {
            type: 'boolean',
            title: 'Ich stimme der Datenschutzerklärung zu',
          },
        },
        required: ['betreff', 'beschreibung', 'zustimmung'],
      },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/betreff' },
          { type: 'Control', scope: '#/properties/kategorie' },
          {
            type: 'Control',
            scope: '#/properties/beschreibung',
            options: { multi: true },
          },
          { type: 'Control', scope: '#/properties/zustimmung' },
        ],
      },
      tabs: [],
      activeTabIndex: 0,
      tabAssignments: {},
      lineNumbersEnabled: false,
      sectionColors: {},
    },
  },
];
