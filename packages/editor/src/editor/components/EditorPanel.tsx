/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 *
 * Erweitert um die Geräte-Ansicht (Prototyp zu ADR 0003, hinter dem
 * Feature-Flag `features.canvasGeraeteAnsicht`, Default aus).
 */
import LaptopIcon from '@mui/icons-material/Laptop';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

import { useEditorConfig } from '../../config/EditorConfigContext';
import { useI18n } from '../../i18n';
import { Editor } from './Editor';

interface EditorPanelProps {
  testMode: boolean;
  testData: Record<string, unknown>;
  onTestDataChange: (data: Record<string, unknown>) => void;
}

type Geraet = 'desktop' | 'handy';

/**
 * Breite der Handy-Ansicht. 390 px entspricht der Breite gängiger
 * Mobilgeräte im Hochformat — der Fall, in dem ein zweispaltiges Layout
 * umbricht.
 */
const HANDY_BREITE = 390;

export const EditorPanel: React.FC<EditorPanelProps> = ({
  testMode,
  testData,
  onTestDataChange,
}) => {
  const config = useEditorConfig();
  const { t } = useI18n();
  const [geraet, setGeraet] = useState<Geraet>('desktop');
  const geraeteAnsicht = config.features?.canvasGeraeteAnsicht ?? false;

  const canvas = (
    <Editor
      testMode={testMode}
      testData={testData}
      onTestDataChange={onTestDataChange}
    />
  );

  if (!geraeteAnsicht) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: '1fr',
          overflow: 'auto',
        }}
      >
        {canvas}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        overflow: 'hidden',
      }}
    >
      <Box
        className="no-print"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          py: 0.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={geraet}
          onChange={(_, wert: Geraet | null) => wert && setGeraet(wert)}
          aria-label={t.editor.geraet.hinweis}
        >
          <ToggleButton value="desktop" aria-label={t.editor.geraet.desktop}>
            <LaptopIcon fontSize="small" sx={{ mr: 0.5 }} />
            {t.editor.geraet.desktop}
          </ToggleButton>
          <ToggleButton value="handy" aria-label={t.editor.geraet.handy}>
            <PhoneIphoneIcon fontSize="small" sx={{ mr: 0.5 }} />
            {t.editor.geraet.handy}
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t.editor.geraet.hinweis}
        </Typography>
      </Box>

      <Box sx={{ overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
        <Box
          data-testid="canvas-geraet"
          data-geraet={geraet}
          sx={{
            width: geraet === 'handy' ? HANDY_BREITE : '100%',
            maxWidth: '100%',
            // Der Rahmen macht sichtbar, wo die Gerätebreite endet; er
            // gehört zur Ansicht, nicht zum Formular.
            border: geraet === 'handy' ? 1 : 0,
            borderColor: 'divider',
            borderRadius: geraet === 'handy' ? 1 : 0,
            my: geraet === 'handy' ? 1 : 0,
            flexShrink: 0,
          }}
        >
          {canvas}
        </Box>
      </Box>
    </Box>
  );
};
