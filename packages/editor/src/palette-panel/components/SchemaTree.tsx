/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 *
 * Migrated: @material-ui -> @mui, useDrag v16, nodeId -> itemId,
 * defaultExpanded -> defaultExpandedItems
 * ---------------------------------------------------------------------
 */
import Typography from '@mui/material/Typography';
import React from 'react';
import { useDrag } from 'react-dnd';

import { DndItems } from '../../core/dnd';
import { SchemaIcon } from '../../core/icons';
import {
  getChildren,
  getLabel,
  getPath,
  isArrayElement,
  isObjectElement,
  SchemaElement,
} from '../../core/model/schema';
import { EditorUISchemaElement } from '../../core/model/uischema';
import { createControl } from '../../core/util/generators/uiSchema';
import { StyledTreeItem, StyledTreeView } from './Tree';

interface SchemaTreeItemProps {
  schemaElement: SchemaElement;
}

const SchemaTreeItem: React.FC<SchemaTreeItemProps> = ({ schemaElement }) => {
  const uiSchemaElement: EditorUISchemaElement = createControl(schemaElement);
  const dndItem = DndItems.newUISchemaElement(uiSchemaElement, schemaElement.uuid);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: dndItem.type,
    item: dndItem,
    canDrag: () => schemaElement.schema.type !== 'object',
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const schemaElementPath = getPath(schemaElement);
  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      data-cy={`${schemaElementPath}-source`}
    >
      <StyledTreeItem
        itemId={schemaElementPath}
        label={getLabel(schemaElement)}
        slots={{ icon: () => <SchemaIcon type={schemaElement.type} /> }}
        isDragging={isDragging}
      >
        {getChildrenToRender(schemaElement).map((child) => (
          <SchemaTreeItem schemaElement={child} key={getPath(child)} />
        ))}
      </StyledTreeItem>
    </div>
  );
};

const getChildrenToRender = (schemaElement: SchemaElement) =>
  getChildren(schemaElement).flatMap((child) => {
    if (
      isObjectElement(child) &&
      isArrayElement(child.parent) &&
      child.parent.items === child
    ) {
      return getChildren(child);
    }
    return [child];
  });

export const SchemaTreeView: React.FC<{ schema: SchemaElement | undefined }> = ({
  schema,
}) => (
  <>
    <Typography variant="h6" color="inherit" noWrap>
      Controls
    </Typography>
    {schema !== undefined ? (
      <StyledTreeView defaultExpandedItems={['']}>
        <SchemaTreeItem schemaElement={schema} />
      </StyledTreeView>
    ) : (
      <div>No JSON Schema available</div>
    )}
  </>
);
