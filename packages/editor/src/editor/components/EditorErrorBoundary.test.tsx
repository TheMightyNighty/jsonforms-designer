/**
 * Komponenten-Test: ErrorBoundary fängt Render-Fehler und meldet sie über
 * den zentralen Fehlerkanal (reportError aus dem EditorContext).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EditorContext, EditorContextInstance } from '../../core/context';
import { emptyFieldState } from '../../core/model/reducer';
import { EditorErrorBoundary } from './EditorErrorBoundary';

function Bombe(): never {
  throw new Error('Kaboom');
}

function contextWith(reportError: EditorContext['reportError']): EditorContext {
  return {
    dispatch: vi.fn(),
    reportError,
    fieldState: emptyFieldState,
    selectedScope: null,
    setSelectedScope: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
  };
}

describe('EditorErrorBoundary', () => {
  it('zeigt Fallback statt White Screen und meldet über reportError', () => {
    // Reacts eigene Fehlerausgabe im Test stummschalten
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reportError = vi.fn();
    try {
      render(
        <EditorContextInstance.Provider value={contextWith(reportError)}>
          <EditorErrorBoundary fallbackLabel="Test-Fehler">
            <Bombe />
          </EditorErrorBoundary>
        </EditorContextInstance.Provider>,
      );
    } finally {
      consoleSpy.mockRestore();
    }

    expect(screen.getByText('Test-Fehler')).toBeInTheDocument();
    expect(screen.getByText('Kaboom')).toBeInTheDocument();
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(String(reportError.mock.calls[0][0])).toContain('Kaboom');
  });

  it('rendert Kinder normal, wenn kein Fehler auftritt', () => {
    render(
      <EditorContextInstance.Provider value={contextWith(vi.fn())}>
        <EditorErrorBoundary>
          <div>Alles gut</div>
        </EditorErrorBoundary>
      </EditorContextInstance.Provider>,
    );
    expect(screen.getByText('Alles gut')).toBeInTheDocument();
  });
});
