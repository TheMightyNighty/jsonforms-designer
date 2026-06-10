/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 */
import Cancel from '@mui/icons-material/Cancel';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import React, { useState } from 'react';

import { FormattedJson } from './Formatted';

export interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  schema: unknown;
  uiSchema: unknown;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  schema,
  uiSchema,
}) => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      aria-labelledby="export-dialog-title"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="export-dialog-title" sx={{ textAlign: 'center' }}>
        Export
      </DialogTitle>
      <DialogContent sx={{ maxHeight: '90vh', height: '90vh' }}>
        <Tabs
          value={selectedTab}
          onChange={(_event: React.SyntheticEvent, newValue: number) =>
            setSelectedTab(newValue)
          }
        >
          <Tab label="Schema" />
          <Tab label="UI Schema" />
        </Tabs>
        {/* Hidden removed in v7 — use sx display instead */}
        <Box sx={{ display: selectedTab === 0 ? 'block' : 'none' }}>
          <FormattedJson object={schema} />
        </Box>
        <Box sx={{ display: selectedTab === 1 ? 'block' : 'none' }}>
          <FormattedJson object={uiSchema} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          aria-label="Close"
          variant="contained"
          color="primary"
          sx={{ margin: 1 }}
          startIcon={<Cancel />}
          onClick={onClose}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
