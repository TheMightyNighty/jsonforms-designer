/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 */
import { Grid, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React from 'react';
import { useDrag } from 'react-dnd';

import { OkCancelDialog } from '../../core/components/OkCancelDialog';
import { useDispatch, useSchema, useSelection } from '../../core/context';
import { DndItems } from '../../core/dnd';
import { SchemaIcon, UISchemaIcon } from '../../core/icons';
import { Actions } from '../../core/model';
import {
  EditorUISchemaElement,
  getUISchemaPath,
  hasChildren,
} from '../../core/model/uischema';
import { isEditorControl, tryFindByUUID } from '../../core/util/schemasUtil';

export interface EditorElementProps {
  wrappedElement: EditorUISchemaElement;
  elementIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const EditorElement: React.FC<EditorElementProps> = ({
  wrappedElement,
  elementIcon,
  children,
}) => {
  const schema = useSchema();
  const [selection, setSelection] = useSelection();
  const dispatch = useDispatch();
  const [openConfirmRemoveDialog, setOpenConfirmRemoveDialog] =
    React.useState(false);
  const elementSchema = tryFindByUUID(
    schema,
    wrappedElement.linkedSchemaElement
  );
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DndItems.moveUISchemaElement(wrappedElement, elementSchema).type,
    item: DndItems.moveUISchemaElement(wrappedElement, elementSchema),
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const uiPath = getUISchemaPath(wrappedElement);
  const isSelected = selection?.uuid === wrappedElement.uuid;
  const ruleEffect = wrappedElement.rule?.effect.toLocaleUpperCase();

  const ruleSx = {
    fontWeight: 'bolder',
    color: 'text.primary',
    marginRight: 0.5,
    marginLeft: 1,
  };
  const ruleEffectSx = { fontStyle: 'italic', color: 'text.secondary' };

  const icon =
    elementIcon ??
    (elementSchema ? (
      <SchemaIcon type={elementSchema.type} />
    ) : (
      <UISchemaIcon type={wrappedElement.type} />
    ));
  return (
    <Grid
      data-cy={`editorElement-${uiPath}`}
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      onClick={(event) => {
        event.stopPropagation();
        setSelection({ uuid: wrappedElement.uuid });
      }}
      sx={{
        border: isSelected ? '1px solid #a9a9a9' : '1px solid #d3d3d3',
        padding: 1,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isSelected ? 'rgba(63, 81, 181, 0.08)' : '#fafafa',
        width: '100%',
        alignSelf: 'baseline',
        minWidth: 'fit-content',
        '&:hover .element-controls': {
          opacity: 1,
        },
      }}
    >
      <Grid
        container
        direction="row"
        wrap="nowrap"
        data-cy={`editorElement-${uiPath}-header`}
      >
        <Grid container alignItems="center" size="grow">
          {icon}
          {ruleEffect ? (
            <Grid
              container
              direction="row"
              alignItems="center"
              wrap="nowrap"
              size="grow"
            >
              <Typography variant="subtitle2" sx={ruleSx}>
                {'R'}
              </Typography>
              <Typography variant="caption" sx={ruleEffectSx}>
                {`(${ruleEffect})`}
              </Typography>
            </Grid>
          ) : null}
          {isEditorControl(wrappedElement) && (
            <Grid
              container
              direction="row"
              alignItems="center"
              wrap="nowrap"
              size="grow"
            >
              <Typography variant="caption" sx={ruleEffectSx}>
                {wrappedElement.scope}
              </Typography>
            </Grid>
          )}
        </Grid>
        <Grid
          container
          className="element-controls"
          justifyContent="flex-end"
          alignItems="center"
          size="grow"
          sx={{ opacity: 0 }}
        >
          <IconButton
            data-cy={`editorElement-${uiPath}-removeButton`}
            size="small"
            onClick={() => {
              hasChildren(wrappedElement)
                ? setOpenConfirmRemoveDialog(true)
                : dispatch(Actions.removeUiSchemaElement(wrappedElement.uuid));
            }}
          >
            <DeleteIcon />
          </IconButton>

          <OkCancelDialog
            open={openConfirmRemoveDialog}
            text={'Remove element and all its contents from the UI Schema?'}
            onOk={() => {
              dispatch(Actions.removeUiSchemaElement(wrappedElement.uuid));
              setOpenConfirmRemoveDialog(false);
            }}
            onCancel={() => setOpenConfirmRemoveDialog(false)}
          />
        </Grid>
      </Grid>
      {children}
    </Grid>
  );
};
