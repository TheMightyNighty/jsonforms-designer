/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 *
 * Migrated: @material-ui -> @mui, makeStyles -> sx, useDrop v16.
 * ---------------------------------------------------------------------
 */
import {
  ArrayControlProps,
  isObjectArrayControl,
  rankWith,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  withJsonFormsArrayControlProps,
} from '@jsonforms/react';
import Typography from '@mui/material/Typography';
import React, { useMemo } from 'react';
import { useDrop } from 'react-dnd';

import { useDispatch, useSchema } from '../context';
import {
  canDropIntoScope,
  MOVE_UI_SCHEMA_ELEMENT,
  MoveUISchemaElement,
  NEW_UI_SCHEMA_ELEMENT,
  NewUISchemaElement,
} from '../dnd';
import { Actions } from '../model';
import {
  containsControls,
  EditorControl,
  EditorUISchemaElement,
} from '../model/uischema';
import { DroppableElementRegistration } from './DroppableElement';

interface DroppableArrayControlProps extends ArrayControlProps {
  uischema: EditorControl;
}

const DroppableArrayControl: React.FC<DroppableArrayControlProps> = ({
  uischema,
  schema,
  path,
  renderers,
  cells,
}) => {
  const dispatch = useDispatch();
  const rootSchema = useSchema();

  const [{ isOver, uiSchemaElement }, drop] = useDrop<
    NewUISchemaElement | MoveUISchemaElement,
    void,
    { isOver: boolean; uiSchemaElement: EditorUISchemaElement | undefined }
  >(() => ({
    accept: [NEW_UI_SCHEMA_ELEMENT, MOVE_UI_SCHEMA_ELEMENT],
    canDrop: (item): boolean => {
      switch (item.type) {
        case NEW_UI_SCHEMA_ELEMENT:
          return canDropIntoScope(
            item as NewUISchemaElement,
            rootSchema,
            uischema,
          );
        case MOVE_UI_SCHEMA_ELEMENT:
          return !containsControls(uiSchemaElement as EditorUISchemaElement);
      }
      return false;
    },
    collect: (mon) => ({
      isOver: !!mon.isOver() && mon.canDrop(),
      uiSchemaElement: mon.getItem()?.uiSchemaElement,
    }),
    drop: (item) => {
      if (!uiSchemaElement) return;
      switch (item.type) {
        case NEW_UI_SCHEMA_ELEMENT:
          dispatch(Actions.addDetail(uischema.uuid, uiSchemaElement));
          break;
        case MOVE_UI_SCHEMA_ELEMENT:
          dispatch(
            Actions.moveUiSchemaElement(uiSchemaElement.uuid, uischema.uuid, 0),
          );
          break;
      }
    },
  }));

  const renderersToUse = useMemo(
    () => renderers && [...renderers, DroppableElementRegistration],
    [renderers],
  );

  if (!uischema.options?.detail) {
    return (
      <Typography
        ref={drop as unknown as React.Ref<HTMLElement>}
        sx={{
          padding: '10px',
          fontSize: isOver ? '1.1em' : '1em',
          border: isOver ? '1px solid #D3D3D3' : 'none',
        }}
      >
        Default array layout. Drag and drop an item here to customize array
        layout.
      </Typography>
    );
  }

  return (
    <JsonFormsDispatch
      schema={schema}
      uischema={uischema.options.detail}
      path={path}
      renderers={renderersToUse}
      cells={cells}
    />
  );
};

export const DroppableArrayControlRegistration = {
  tester: rankWith(40, isObjectArrayControl),
  renderer: withJsonFormsArrayControlProps(
    DroppableArrayControl as React.FC<ArrayControlProps>,
  ),
};
