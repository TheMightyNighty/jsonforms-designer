/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 *
 * Now complete: includes all three palette tabs.
 * ---------------------------------------------------------------------
 */
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import React, { useState } from 'react';

import { usePaletteService, useSchema } from '../../core/context';
import { JsonSchemaPanel } from './JsonSchemaPanel';
import { SchemaTreeView } from './SchemaTree';
import { UIElementsTree } from './UIElementsTree';
import { UISchemaPanel } from './UISchemaPanel';

export const PalettePanel: React.FC = () => {
  const paletteService = usePaletteService();
  const schema = useSchema();
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable">
        <Tab label="UI Elements" />
        <Tab label="Controls" />
        <Tab label="JSON Schema" />
        <Tab label="UI Schema" />
      </Tabs>
      <Box sx={{ flex: 1, overflow: 'auto', pt: 1 }}>
        {tab === 0 && (
          <UIElementsTree elements={paletteService.getPaletteElements()} />
        )}
        {tab === 1 && <SchemaTreeView schema={schema} />}
        {tab === 2 && <JsonSchemaPanel />}
        {tab === 3 && <UISchemaPanel />}
      </Box>
    </Box>
  );
};
