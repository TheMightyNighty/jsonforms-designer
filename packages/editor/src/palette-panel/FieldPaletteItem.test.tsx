/**
 * Komponenten-Test: Tastatur-Pfad des Palette-Eintrags (BITV).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, expect, it, vi } from 'vitest';

import { EditorContext, EditorContextInstance } from '../core/context';
import { EditorAction } from '../core/model/actions';
import { emptyFieldState } from '../core/model/reducer';
import { getFieldType } from '../field-types/fieldTypes';
import { FieldPaletteItem } from './FieldPaletteItem';

function renderItem(fieldTypeId = 'text-short') {
  const dispatch = vi.fn();
  const context: EditorContext = {
    dispatch,
    reportError: vi.fn(),
    fieldState: { ...emptyFieldState, tabs: [{ label: 'Seite 1' }] },
    selectedScope: null,
    setSelectedScope: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
  };
  render(
    <DndProvider backend={HTML5Backend}>
      <EditorContextInstance.Provider value={context}>
        <FieldPaletteItem fieldType={getFieldType(fieldTypeId)} />
      </EditorContextInstance.Provider>
    </DndProvider>,
  );
  return { dispatch };
}

describe('FieldPaletteItem — Tastatur-Pfad', () => {
  it('ist als fokussierbarer Button ausgezeichnet', () => {
    renderItem();
    const item = screen.getByRole('button', {
      name: 'Textfeld (einzeilig) hinzufügen',
    });
    expect(item).toHaveAttribute('tabindex', '0');
  });

  it('Enter dispatcht ADD_FIELD mit Tab-Zuordnung', () => {
    const { dispatch } = renderItem();
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });

    expect(dispatch).toHaveBeenCalledTimes(1);
    const action = dispatch.mock.calls[0][0] as EditorAction & {
      payload: { propertyKey: string; tabIndex?: number };
    };
    expect(action.type).toBe('ADD_FIELD');
    expect(action.payload.propertyKey).toBe('textfeld');
    expect(action.payload.tabIndex).toBe(0); // aktiver Tab
  });

  it('Leertaste dispatcht ebenfalls; andere Tasten nicht', () => {
    const { dispatch } = renderItem('checkbox');
    const item = screen.getByRole('button');
    fireEvent.keyDown(item, { key: 'a' });
    expect(dispatch).not.toHaveBeenCalled();
    fireEvent.keyDown(item, { key: ' ' });
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
