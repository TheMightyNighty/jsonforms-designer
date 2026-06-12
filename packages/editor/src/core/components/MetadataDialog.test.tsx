/**
 * Komponenten-Test: Formular-Metadaten-Dialog (Titel-Pflichtfeld,
 * Speichern-Payload, Vorbelegung aus dem Schema).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FieldAwareState } from '../model/addFieldReducer';
import { MetadataDialog } from './MetadataDialog';

describe('MetadataDialog', () => {
  it('belegt Felder aus dem Schema vor und speichert Änderungen', () => {
    const onSave = vi.fn();
    render(
      <MetadataDialog
        open
        onClose={vi.fn()}
        schema={
          {
            type: 'object',
            properties: {},
            title: 'Wohngeld',
            'x-publisher': 'Amt 42',
          } as FieldAwareState['schema']
        }
        onSave={onSave}
      />,
    );

    const titel = screen.getByLabelText(/Formular-Titel/);
    expect(titel).toHaveValue('Wohngeld');
    expect(screen.getByLabelText(/Herausgebende Behörde/)).toHaveValue(
      'Amt 42',
    );

    fireEvent.change(titel, { target: { value: 'Wohngeldantrag 2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({
      title: 'Wohngeldantrag 2026',
      publisher: 'Amt 42',
    });
  });

  it('Speichern ist ohne Titel deaktiviert', () => {
    render(
      <MetadataDialog
        open
        onClose={vi.fn()}
        schema={{ type: 'object', properties: {} }}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  });
});
