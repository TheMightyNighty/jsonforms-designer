/**
 * Komponenten-Test: Varianten-Umschalter der Formular-Vorschau (AUFTRAG 2.3).
 * Deckt ab: Formulardaten überleben den Variantenwechsel, der Artefakt-Hash
 * bleibt beim Wechsel unverändert, und alle drei Renderer-Sets rendern jeden
 * Profil-Elementtyp ohne „No applicable renderer".
 */
import { JsonSchema7, UISchemaElement } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { FieldAwareState } from '../../core/model/addFieldReducer';
import { emptyManifestMeta } from '../../core/model/manifestMeta';
import { PREVIEW_VARIANTS } from '../../preview-variants';
import { PreviewPanel } from './PreviewPanel';

function makeFieldState(): FieldAwareState {
  return {
    schema: {
      type: 'object',
      title: 'Testformular',
      properties: {
        name: { type: 'string', title: 'Name' },
        bestaetigt: { type: 'boolean', title: 'Bestätigt' },
      },
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        { id: 'f1', type: 'Control', scope: '#/properties/name' },
        { id: 'f2', type: 'Control', scope: '#/properties/bestaetigt' },
      ],
    },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    typvorschlagIgnoriert: {},
    sectionColors: {},
    manifestMeta: { ...emptyManifestMeta },
  };
}

function pressKey(key: string) {
  fireEvent.keyDown(document, { key });
}

describe('PreviewPanel — Varianten-Umschalter', () => {
  beforeEach(() => {
    // Die Varianten-Persistenz nutzt sessionStorage — zwischen Tests
    // zurücksetzen, damit jeder Test bei der Standardvariante startet.
    sessionStorage.clear();
  });

  it('eingegebene Formulardaten bleiben nach einem Variantenwechsel erhalten', async () => {
    render(<PreviewPanel fieldState={makeFieldState()} />);

    // Boolean-Control statt Text: das Material-TextControl debounct
    // handleChange (300 ms), die Checkbox committiert synchron — so bleibt
    // der Test frei von Timing-Abhängigkeiten.
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toBeChecked());
    // JsonForms' eigener Emit-Kanal debounct onChange intern (10 ms) —
    // abwarten, damit der Wert im PreviewPanel-State committet ist, bevor
    // die neu gemountete Variante mit dem aktuellen Datenstand initialisiert.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Tastaturkürzel 2 → Bundesportal-Stil.
    pressKey('2');

    await waitFor(() => {
      expect(screen.getByText(/Bundesportal-Stil/)).toBeInTheDocument();
    });
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('der Hash von schema.json/uischema.json ändert sich nicht beim Variantenwechsel', async () => {
    render(<PreviewPanel fieldState={makeFieldState()} />);

    await waitFor(() => {
      expect(screen.getByText(/schema\.json:/)).toBeInTheDocument();
    });
    const before = screen.getByText(/schema\.json:/).textContent;

    pressKey('3'); // KERN-Stil

    await waitFor(() => {
      expect(screen.getByText(/KERN-Stil/)).toBeInTheDocument();
    });
    const after = screen.getByText(/schema\.json:/).textContent;

    expect(after).toBe(before);
  });

  it('Tastaturkürzel werden ignoriert, wenn ein Eingabefeld fokussiert ist', async () => {
    render(<PreviewPanel fieldState={makeFieldState()} />);
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    input.focus();

    fireEvent.keyDown(input, { key: '2' });

    // Standardvariante bleibt aktiv — die Ziffer landet nicht im Umschalter.
    expect(screen.getByText(/Standard \(Material\)/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Profil-Vollständigkeit: jede Variante rendert jeden Elementtyp des
// OFM-UI-Profils, unabhängig von PreviewPanels eigener Stepper-Logik.
// ---------------------------------------------------------------------------
const profileSchema: JsonSchema7 = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    alter: { type: 'number', title: 'Alter' },
    einverstanden: { type: 'boolean', title: 'Einverstanden' },
    farbe: {
      type: 'string',
      title: 'Farbe',
      oneOf: [
        { const: 'red', title: 'Rot' },
        { const: 'blue', title: 'Blau' },
      ],
    },
  },
};

const profileUiSchema: UISchemaElement = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Schritt 1',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Group',
              label: 'Angaben',
              options: { 'ofm:sectionColor': 'blue' },
              elements: [
                {
                  type: 'HorizontalLayout',
                  elements: [
                    {
                      type: 'Control',
                      scope: '#/properties/name',
                      options: { 'ofm:width': 6 },
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/alter',
                      options: { 'ofm:width': 6 },
                    },
                  ],
                },
                { type: 'Control', scope: '#/properties/einverstanden' },
                { type: 'Control', scope: '#/properties/farbe' },
                { type: 'Label', text: 'Ein Hinweistext' },
              ],
            },
          ],
        },
      ],
    },
  ],
} as unknown as UISchemaElement;

describe.each(PREVIEW_VARIANTS)(
  'Variante $id ($name) — Profil-Vollständigkeit',
  (variant) => {
    it('rendert alle Profil-Elementtypen ohne "No applicable renderer"', () => {
      render(
        <variant.ThemeProvider>
          <JsonForms
            schema={profileSchema}
            uischema={profileUiSchema}
            data={{}}
            renderers={variant.renderers}
            cells={variant.cells}
            onChange={() => {}}
          />
        </variant.ThemeProvider>,
      );

      expect(screen.queryByText(/No applicable/)).not.toBeInTheDocument();
      expect(screen.getByText('Schritt 1')).toBeInTheDocument();
      expect(screen.getByText('Ein Hinweistext')).toBeInTheDocument();
      // Nicht alle Varianten verknüpfen Label und Feld über `for`/
      // `aria-labelledby` (Portal/KERN nutzen freistehende Typography-
      // Labels, Material dupliziert den Labeltext zusätzlich in die
      // Fieldset-Legende) — daher wird hier auf Textpräsenz statt exakter
      // Eindeutigkeit geprüft, damit die Prüfung für alle drei Renderer-Sets
      // gilt.
      expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Alter').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Einverstanden').length).toBeGreaterThan(0);
    });
  },
);
