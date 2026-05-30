/**
 * Zeigt im Properties-Panel die Optionen für Dropdown/Radio-Felder.
 * Ermöglicht Hinzufügen, Umbenennen, Löschen und Reordering der Enum-Werte.
 * Schreibt schema.properties[key].enum via SET_FIELD_STATE.
 */
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIcon from '@mui/icons-material/DragHandle';
import {
  Box,
  Divider,
  IconButton,
  InputBase,
  List,
  ListItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { Dispatch, useState } from 'react';

import { FieldAwareState } from '../core/model/addFieldReducer';
import { createSetFieldStateAction } from '../core/model/addFieldActions';
import { useEditorContext } from '../core/context';
import { useI18n } from '../i18n';
import { EditorAction } from '../core/model/actions';

interface EnumEditorProps {
  selectedScope: string;
  schema: FieldAwareState['schema'];
  uiSchema: FieldAwareState['uiSchema'];
  tabs: FieldAwareState['tabs'];
  activeTabIndex: FieldAwareState['activeTabIndex'];
  tabAssignments: FieldAwareState['tabAssignments'];
  dispatch: Dispatch<EditorAction>;
}

export function EnumEditor({
  selectedScope, schema, uiSchema, tabs, activeTabIndex, tabAssignments, dispatch,
}: EnumEditorProps) {
  const { fieldState: ctx } = useEditorContext();
  const { t } = useI18n();
  const key = selectedScope.replace(/^#\/properties\//, '');
  const fieldDef = (schema.properties?.[key] ?? {}) as any;
  const enumValues: string[] = fieldDef.enum ?? [];

  const [dragFrom, setDragFrom] = useState<number | null>(null);

  if (!fieldDef.enum) return null;

  const updateEnum = (newEnum: string[]) => {
    const updatedSchema = {
      ...schema,
      properties: {
        ...schema.properties,
        [key]: { ...fieldDef, enum: newEnum },
      },
    };
    dispatch(
      createSetFieldStateAction({
        schema: updatedSchema,
        uiSchema,
        tabs,
        activeTabIndex,
        tabAssignments,
        lineNumbersEnabled: ctx.lineNumbersEnabled,
        sectionColors: ctx.sectionColors,
      }) as unknown as EditorAction
    );
  };

  const handleChange = (idx: number, value: string) => {
    const next = [...enumValues];
    next[idx] = value;
    updateEnum(next);
  };

  const handleAdd = () => updateEnum([...enumValues, `Option ${enumValues.length + 1}`]);

  const handleDelete = (idx: number) => {
    updateEnum(enumValues.filter((_, i) => i !== idx));
  };

  const handleDrop = (toIdx: number) => {
    if (dragFrom === null || dragFrom === toIdx) { setDragFrom(null); return; }
    const next = [...enumValues];
    const [moved] = next.splice(dragFrom, 1);
    next.splice(toIdx, 0, moved);
    updateEnum(next);
    setDragFrom(null);
  };

  return (
    <Box>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {t.properties.options}
        </Typography>
        <Tooltip title="Option hinzufügen">
          <IconButton size="small" onClick={handleAdd} aria-label="Option hinzufügen">
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <List dense disablePadding>
        {enumValues.map((val, idx) => (
          <ListItem
            key={idx}
            disablePadding
            draggable
            onDragStart={() => setDragFrom(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              mb: 0.25, borderRadius: 1,
              backgroundColor: dragFrom === idx ? 'action.selected' : 'transparent',
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            <DragIcon sx={{ fontSize: 16, color: 'text.disabled', cursor: 'grab', flexShrink: 0 }} />
            <InputBase
              value={val}
              onChange={(e) => handleChange(idx, e.target.value)}
              size="small"
              sx={{
                flex: 1, fontSize: '0.8rem',
                border: '1px solid', borderColor: 'divider',
                borderRadius: 1, px: 1, py: 0.25,
                '&:focus-within': { borderColor: 'primary.main' },
              }}
              inputProps={{ 'aria-label': `Option ${idx + 1}` }}
            />
            <Tooltip title="Löschen">
              <IconButton
                size="small"
                onClick={() => handleDelete(idx)}
                disabled={enumValues.length <= 1}
                sx={{ p: 0.25, flexShrink: 0 }}
                aria-label={`Option ${val} löschen`}
              >
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
