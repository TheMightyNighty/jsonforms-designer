/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 */
import { Box } from '@mui/material';
import React from 'react';

interface LayoutProps {
  HeaderComponent?: React.ComponentType;
  FooterComponent?: React.ComponentType;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  HeaderComponent,
  FooterComponent,
  children,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        height: '100vh',
        gridTemplateAreas: 'header content footer',
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto 1fr auto',
      }}
    >
      <header>{HeaderComponent ? <HeaderComponent /> : null}</header>
      <Box
        component="main"
        sx={{ marginTop: 0, marginBottom: 0, minHeight: 0 }}
      >
        {children}
      </Box>
      <Box
        component="footer"
        sx={
          FooterComponent
            ? {
                padding: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[200]
                    : theme.palette.grey[800],
              }
            : undefined
        }
      >
        {FooterComponent ? <FooterComponent /> : null}
      </Box>
    </Box>
  );
};
