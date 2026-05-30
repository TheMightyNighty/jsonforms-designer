/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 */
import { Container, Typography } from '@mui/material';
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
      }}
    >
      <Typography variant="body2" color="textSecondary">
        {`Copyright © ${new Date().getFullYear()}`}
      </Typography>
    </Container>
  );
};
