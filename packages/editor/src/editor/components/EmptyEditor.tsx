/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 *
 * Leerer Zustand der Arbeitsfläche.
 *
 * Vorher stand hier ein einzelner Satz oben links in einer leeren weißen
 * Fläche — die Ablagefläche war unsichtbar (`borderColor: transparent`),
 * und es gab keinen Vorschlag, womit man anfängt. Das ist der erste
 * Eindruck der Anwendung, und er sah aus wie ein Renderfehler.
 *
 * Jetzt: eine sichtbare, mittig gesetzte Ablagefläche mit dem ersten
 * Schritt in Worten und einem zweiten Weg für alle, die nicht ziehen
 * wollen oder können (Tastatur, Motorik) — der Hinweis auf den
 * Enter-Pfad der Palette.
 */
import { Box, Typography } from '@mui/material';
import React from 'react';

import { useDispatch } from '../../core/context';
import { useI18n } from '../../i18n';
import { useFieldDrop } from '../../palette-panel/useFieldDrop';

export const EmptyEditor: React.FC = () => {
  const dispatch = useDispatch();
  const { t } = useI18n();

  const [{ isOver }, fieldDrop] = useFieldDrop(dispatch);

  const setRef = (el: HTMLDivElement | null) => {
    (fieldDrop as unknown as (el: HTMLDivElement | null) => void)(el);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Box
        ref={setRef}
        data-testid="empty-editor-drop"
        role="region"
        aria-label={t.editor.leer.bereich}
        aria-dropeffect="copy"
        sx={{
          width: '100%',
          maxWidth: 520,
          px: 4,
          py: 6,
          textAlign: 'center',
          // Sichtbare Ablagefläche: Vorher war der Rahmen durchsichtig,
          // man sah also nicht, wohin man ziehen soll.
          border: '2px dashed',
          borderColor: isOver ? 'primary.main' : 'divider',
          borderRadius: 2,
          backgroundColor: isOver ? 'action.hover' : 'transparent',
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        <Box
          component="i"
          className="ti ti-drag-drop"
          aria-hidden="true"
          sx={{ fontSize: 32, color: 'text.secondary', display: 'block' }}
        />
        <Typography variant="subtitle1" sx={{ mt: 1.5 }}>
          {t.editor.leer.titel}
        </Typography>
        <Typography
          variant="body2"
          aria-live="polite"
          sx={{ mt: 1, color: 'text.secondary' }}
        >
          {t.editor.dropHint}
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 2, color: 'text.secondary' }}
        >
          {t.editor.leer.tastatur}
        </Typography>
      </Box>
    </Box>
  );
};
