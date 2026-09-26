/**
 * Komponenten-Test: Bau-Modus zeigt echte gerendete Felder statt abstrakter
 * Zeilen und schaltet über testMode zwischen rein visuell und interaktiv um.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, expect, it, vi } from 'vitest';

import { EditorContext, EditorContextInstance } from '../../core/context';
import { FieldAwareState } from '../../core/model/addFieldReducer';
import { emptyManifestMeta } from '../../core/model/manifestMeta';
import { FieldFormPreview } from './FieldFormPreview';

function makeFieldState(): FieldAwareState {
  return {
    schema: {
      type: 'object',
      properties: {
        vorname: { type: 'string', title: 'Vorname' },
      },
      required: [],
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        { id: 'ctrl_1', type: 'Control', scope: '#/properties/vorname' },
      ],
    },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    sectionColors: {},
    manifestMeta: { ...emptyManifestMeta },
  };
}

function renderPreview(
  props: Partial<React.ComponentProps<typeof FieldFormPreview>> = {},
) {
  const dispatch = vi.fn();
  const onSelectScope = vi.fn();
  const onTestDataChange = vi.fn();
  const fieldState = props.fieldState ?? makeFieldState();
  // GroupContainerRow/ColumnContainerRow lesen Abschnittsfarben über den
  // EditorContext — im Test genügt ein minimaler Provider mit fieldState.
  const contextValue: EditorContext = {
    dispatch,
    reportError: () => {},
    fieldState,
    speicherStatus: { art: 'unveraendert' },
    selectedScope: null,
    setSelectedScope: () => {},
    undo: () => {},
    redo: () => {},
    canUndo: false,
    canRedo: false,
  };
  render(
    <EditorContextInstance.Provider value={contextValue}>
      <DndProvider backend={HTML5Backend}>
        <FieldFormPreview
          fieldState={fieldState}
          selectedScope={null}
          onSelectScope={onSelectScope}
          dispatch={dispatch}
          testMode={false}
          testData={{}}
          onTestDataChange={onTestDataChange}
          {...props}
        />
      </DndProvider>
    </EditorContextInstance.Provider>,
  );
  return { dispatch, onSelectScope, onTestDataChange };
}

describe('FieldFormPreview — echtes Rendering im Bau-Modus', () => {
  it('rendert ein Control-Feld als echtes MUI-Textfeld statt einer abstrakten Zeile', () => {
    renderPreview();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('ist außerhalb des Testen-Modus nicht interaktiv nutzbar (pointer-events: none)', () => {
    renderPreview({ testMode: false });
    const input = screen.getByRole('textbox');
    // Ein Vorfahre unterbindet Zeigereingaben, damit Klicks zur
    // Zeilenselektion durchbubblen statt ins Feld zu tippen.
    let node: HTMLElement | null = input;
    let found = false;
    while (node) {
      if (getComputedStyle(node).pointerEvents === 'none') {
        found = true;
        break;
      }
      node = node.parentElement;
    }
    expect(found).toBe(true);
  });

  it('wird im Testen-Modus interaktiv ausfüllbar', async () => {
    const user = userEvent.setup();
    let data: Record<string, unknown> = {};
    const onTestDataChange = vi.fn((d: Record<string, unknown>) => {
      data = d;
    });
    const { rerender } = render(
      <DndProvider backend={HTML5Backend}>
        <FieldFormPreview
          fieldState={makeFieldState()}
          selectedScope={null}
          onSelectScope={vi.fn()}
          dispatch={vi.fn()}
          testMode={true}
          testData={data}
          onTestDataChange={onTestDataChange}
        />
      </DndProvider>,
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'A');

    expect(onTestDataChange).toHaveBeenCalled();

    rerender(
      <DndProvider backend={HTML5Backend}>
        <FieldFormPreview
          fieldState={makeFieldState()}
          selectedScope={null}
          onSelectScope={vi.fn()}
          dispatch={vi.fn()}
          testMode={true}
          testData={data}
          onTestDataChange={onTestDataChange}
        />
      </DndProvider>,
    );
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('A');
  });

  it('Klick auf die Zeile außerhalb des Testen-Modus selektiert das Feld', async () => {
    const user = userEvent.setup();
    const { onSelectScope } = renderPreview({ testMode: false });
    await user.click(screen.getByTestId('field-row'));
    expect(onSelectScope).toHaveBeenCalledWith('#/properties/vorname');
  });

  it('rendert die Kinder einer Gruppe sichtbar, nicht nur die Überschrift', () => {
    const fieldState: FieldAwareState = {
      schema: {
        type: 'object',
        properties: {
          vorname: { type: 'string', title: 'Vorname' },
        },
        required: [],
      },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          {
            id: 'grp_1',
            type: 'GroupContainer',
            label: 'Persönliche Daten',
            children: [
              { id: 'ctrl_1', type: 'Control', scope: '#/properties/vorname' },
            ],
          },
        ],
      },
      tabs: [],
      activeTabIndex: 0,
      tabAssignments: {},
      lineNumbersEnabled: false,
      sectionColors: {},
      manifestMeta: { ...emptyManifestMeta },
    };
    renderPreview({ fieldState });
    expect(screen.getByText('Persönliche Daten')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
