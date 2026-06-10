/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 */
import { GroupLayout, LayoutProps, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { Card, CardContent, CardHeader, Grid, Typography } from '@mui/material';
import React from 'react';

import { EditorLayout } from '../model/uischema';
import { DroppableLayout } from './DroppableLayout';

const Group: React.FC<LayoutProps> = (props) => {
  const { uischema } = props;
  const groupLayout = uischema as GroupLayout & EditorLayout;
  return (
    <Card>
      <CardHeader
        component={() => (
          <Grid
            container
            direction="row"
            spacing={1}
            sx={{ padding: 2, alignItems: 'baseline' }}
          >
            <Grid>
              <Typography>Label:</Typography>
            </Grid>
            <Grid>
              <Typography
                variant="h6"
                sx={
                  groupLayout.label
                    ? undefined
                    : {
                        fontStyle: 'italic',
                        fontWeight: 'lighter',
                        color: '#9e9e9e',
                      }
                }
              >
                {groupLayout.label ?? 'no label'}
              </Typography>
            </Grid>
          </Grid>
        )}
      ></CardHeader>
      <CardContent>
        <DroppableLayout {...props} layout={groupLayout} direction={'column'} />
      </CardContent>
    </Card>
  );
};

export const DroppableGroupLayoutRegistration = {
  tester: rankWith(45, uiTypeIs('Group')),
  renderer: withJsonFormsLayoutProps(Group),
};
