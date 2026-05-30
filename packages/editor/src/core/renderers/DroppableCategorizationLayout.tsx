/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 *
 * Migrated: @material-ui -> @mui/material + @mui/icons-material
 * ---------------------------------------------------------------------
 */
import { Category, isCategorization, rankWith, StatePropsOfLayout } from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import PlusOneIcon from '@mui/icons-material/PlusOne';
import TabIcon from '@mui/icons-material/Tab';
import AppBar from '@mui/material/AppBar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { findIndex } from 'lodash';
import React, { useMemo, useState } from 'react';

import { useCategorizationService, useSelection } from '../../core/context';
import { CategorizationLayout } from '../model/uischema';
import { createCategory } from '../util/generators/uiSchema';
import { DroppableElementRegistration } from './DroppableElement';

interface DroppableCategorizationLayoutProps extends StatePropsOfLayout {
  uischema: CategorizationLayout;
}

const DroppableCategorizationLayout: React.FC<DroppableCategorizationLayoutProps> = (props) => {
  const { uischema, schema, path, renderers, cells } = props;
  const [, setSelection] = useSelection();
  const categorizationService = useCategorizationService();
  const categories = uischema.elements;

  const defaultIndex = findIndex(
    categories,
    (cat) => cat.uuid === categorizationService.getTabSelection(uischema)?.uuid
  );

  const [currentIndex, setCurrentIndex] = useState<number | undefined>(
    defaultIndex === -1 ? undefined : defaultIndex
  );

  const indicatorColor: 'secondary' | 'primary' = categories.length === 0 ? 'primary' : 'secondary';

  const setIndex = (value: number, event?: React.SyntheticEvent) => {
    event?.stopPropagation();
    if (value < categories.length) {
      const selectedUuid = categories[value].uuid;
      categorizationService.setTabSelection(uischema, { uuid: selectedUuid });
      setSelection({ uuid: selectedUuid });
      setCurrentIndex(value);
    }
  };

  const renderersToUse = useMemo(
    () => renderers && [...renderers, DroppableElementRegistration],
    [renderers]
  );

  const handleChange = (_event: React.SyntheticEvent, value: number) => {
    setIndex(value);
  };

  const addTab = (event: React.SyntheticEvent) => {
    const tab = createCategory('New Tab ' + (categories.length + 1));
    tab.parent = uischema;
    categories.push(tab);
    setIndex(categories.length - 1, event);
  };

  if (currentIndex !== undefined) {
    if (categories.length === 0) {
      setCurrentIndex(undefined);
    } else if (currentIndex > categories.length - 1) {
      setIndex(categories.length - 1);
    } else if (currentIndex !== defaultIndex) {
      setIndex(currentIndex);
    }
  }

  return (
    <Card>
      <CardHeader
        component={() => (
          <AppBar position="static">
            <Tabs
              indicatorColor={indicatorColor}
              value={currentIndex === undefined ? false : currentIndex}
              onChange={handleChange}
              variant="scrollable"
            >
              {categories.map((e: Category, idx: number) => (
                <Tab key={idx} label={e.label} />
              ))}
              <Tab
                key={categories.length}
                icon={
                  <span>
                    <TabIcon fontSize="small" />
                    <PlusOneIcon />
                  </span>
                }
                onClick={addTab}
              />
            </Tabs>
          </AppBar>
        )}
      />
      <CardContent>
        {categories.length > 0 && currentIndex !== undefined ? (
          <JsonFormsDispatch
            schema={schema}
            uischema={categories[currentIndex]}
            path={path}
            renderers={renderersToUse}
            cells={cells}
          />
        ) : (
          categories.length === 0 && (
            <span>
              {'No Category. Use '}
              <TabIcon fontSize="small" />
              <PlusOneIcon />
              {' to add a new tab.'}
            </span>
          )
        )}
      </CardContent>
    </Card>
  );
};

export const DroppableCategorizationLayoutRegistration = {
  tester: rankWith(40, isCategorization),
  renderer: withJsonFormsLayoutProps(
    DroppableCategorizationLayout as React.FC<StatePropsOfLayout>
  ),
};
