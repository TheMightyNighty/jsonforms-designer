/**
 * Komponenten-Test: Formular-Metadaten-Dialog (Titel-Pflichtfeld,
 * Speichern-Payload, Vorbelegung aus Schema und Manifest-Datenhalter,
 * URN-Validierung und -Vorschlag).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { emptyManifestMeta } from '../model/manifestMeta';
import { MetadataDialog } from './MetadataDialog';

describe('MetadataDialog', () => {
  it('belegt Felder aus Schema und Manifest vor und speichert Änderungen', () => {
    const onSave = vi.fn();
    render(
      <MetadataDialog
        open
        onClose={vi.fn()}
        schema={{ type: 'object', properties: {}, title: 'Wohngeld' }}
        manifestMeta={{ ...emptyManifestMeta, publisher: 'Amt 42' }}
        onSave={onSave}
      />,
    );

    const titel = screen.getByLabelText(/Formular-Titel/);
    expect(titel).toHaveValue('Wohngeld');
    expect(screen.getByLabelText(/Herausgebende Stelle/)).toHaveValue('Amt 42');

    fireEvent.change(titel, { target: { value: 'Wohngeldantrag 2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({
      title: 'Wohngeldantrag 2026',
      publisher: 'Amt 42',
      language: 'de',
    });
  });

  it('Speichern ist ohne Titel deaktiviert', () => {
    render(
      <MetadataDialog
        open
        onClose={vi.fn()}
        schema={{ type: 'object', properties: {} }}
        manifestMeta={{ ...emptyManifestMeta }}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  });

  it('erzeugt einen URN-Vorschlag aus Behörde und Titel und validiert das Muster', () => {
    render(
      <MetadataDialog
        open
        onClose={vi.fn()}
        schema={{
          type: 'object',
          properties: {},
          title: 'Bewohnerparkausweis',
        }}
        manifestMeta={{ ...emptyManifestMeta, publisher: 'Stadt Bonn' }}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /URN-Vorschlag/ }));
    expect(screen.getByLabelText(/Formular-ID/)).toHaveValue(
      'urn:de:stadt-bonn:formular:bewohnerparkausweis',
    );

    fireEvent.change(screen.getByLabelText(/Formular-ID/), {
      target: { value: 'keine-urn' },
    });
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  });
});
