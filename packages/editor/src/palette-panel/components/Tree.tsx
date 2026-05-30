/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 */
import { alpha, styled } from '@mui/material/styles';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem, TreeItemProps } from '@mui/x-tree-view/TreeItem';

export const StyledTreeView = styled(SimpleTreeView)({
  flexGrow: 1,
  maxWidth: 400,
});

interface StyledTreeItemProps extends TreeItemProps {
  isDragging?: boolean;
}

export const StyledTreeItem = styled(
  ({ isDragging: _isDragging, ...props }: StyledTreeItemProps) => (
    <TreeItem {...props} />
  )
)(({ theme, isDragging }) => ({
  opacity: isDragging ? 0.5 : 1,
  '& .MuiTreeItem-iconContainer': {
    '& .close': {
      opacity: 0.3,
    },
  },
  '& .MuiTreeItem-groupTransition': {
    marginLeft: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
}));
