/** Drag-Reordering uses HTML5 DnD to avoid conflicts with the react-dnd context. */
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { Box, IconButton, InputBase, Tab, Tabs, Tooltip } from '@mui/material';
import { Dispatch, useState } from 'react';

import { EditorAction } from '../../core/model/actions';
import {
  createAddTabAction,
  createRemoveTabAction,
  createRenameTabAction,
  createReorderTabsAction,
  createSetActiveTabAction,
} from '../../core/model/addFieldActions';
import { FormTab } from '../../core/model/addFieldReducer';

interface TabBarProps {
  tabs: FormTab[];
  activeTabIndex: number;
  dispatch: Dispatch<EditorAction>;
}

export function TabBar({ tabs, activeTabIndex, dispatch }: TabBarProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const startEdit = (idx: number, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIndex(idx);
    setEditValue(label);
  };

  const commitEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      dispatch(createRenameTabAction(editingIndex, editValue.trim()));
    }
    setEditingIndex(null);
  };

  const handleDragStart = (idx: number) => setDragFrom(idx);
  const handleDrop = (toIdx: number) => {
    if (dragFrom !== null && dragFrom !== toIdx) {
      dispatch(createReorderTabsAction(dragFrom, toIdx));
    }
    setDragFrom(null);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Tabs
        value={activeTabIndex}
        onChange={(_, v) => dispatch(createSetActiveTabAction(v))}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ flex: 1, minHeight: 36 }}
        TabIndicatorProps={{ style: { height: 2 } }}
      >
        {tabs.map((tab, idx) => (
          <Tab
            key={idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            sx={{ minHeight: 36, py: 0.5, px: 1 }}
            label={
              editingIndex === idx ? (
                <InputBase
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') setEditingIndex(null);
                  }}
                  autoFocus
                  sx={{ fontSize: '0.78rem', width: 90 }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <span style={{ fontSize: '0.78rem' }}>{tab.label}</span>
                  <Tooltip title="Umbenennen">
                    <IconButton
                      size="small"
                      sx={{ p: 0.1, opacity: 0.5, '&:hover': { opacity: 1 } }}
                      onClick={(e) => startEdit(idx, tab.label, e)}
                      aria-label={`Tab ${tab.label} umbenennen`}
                    >
                      <EditIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Tooltip>
                  {tabs.length > 1 && (
                    <Tooltip title="Tab löschen">
                      <IconButton
                        size="small"
                        sx={{ p: 0.1, opacity: 0.5, '&:hover': { opacity: 1 } }}
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(createRemoveTabAction(idx));
                        }}
                        aria-label={`Tab ${tab.label} löschen`}
                      >
                        <CloseIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )
            }
          />
        ))}
      </Tabs>

      {/* Tab hinzufügen */}
      <Tooltip title="Neuer Tab">
        <IconButton
          size="small"
          sx={{ mx: 0.5, flexShrink: 0 }}
          onClick={() => dispatch(createAddTabAction(`Tab ${tabs.length + 1}`))}
          aria-label="Neuen Tab hinzufügen"
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
