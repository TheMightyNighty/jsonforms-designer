import DeleteIcon from '@mui/icons-material/Delete';
import { Alert, Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { useEditorContext } from '../../core/context';
import { useI18n } from '../../i18n';
import { Dispatch } from 'react';

import { createRemoveFieldAction } from '../../core/model/addFieldActions';
import { EditorAction } from '../../core/model/actions';

export interface StructuralElement {
  scope: string;
  type: string;
  label?: string;
  options?: Record<string, unknown>;
}

interface StructuralElementRowProps {
  el: StructuralElement;
  isSelected: boolean;
  onSelect: (scope: string) => void;
  dispatch: Dispatch<EditorAction>;
}

export function StructuralElementRow({
  el, isSelected, onSelect, dispatch,
}: StructuralElementRowProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(createRemoveFieldAction(el.scope) as unknown as EditorAction);
  };

  const { fieldState } = useEditorContext();
  const { t } = useI18n();
  const bgColor = fieldState.sectionColors[el.scope] ?? undefined;

  const baseSx = {
    borderRadius: 1,
    cursor: 'pointer',
    border: '1px solid',
    borderColor: isSelected ? 'primary.main' : 'divider',
    transition: 'border-color 0.15s, background-color 0.15s',
    '&:hover': { borderColor: 'primary.light' },
  };

  // Löschen-Button
  const DeleteBtn = () => (
    <Tooltip title={t.actions.remove}>
      <IconButton
        size="small"
        onClick={handleDelete}
        sx={{ p: 0.25, opacity: 0.5, '&:hover': { opacity: 1 }, flexShrink: 0 }}
      >
        <DeleteIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );

  // HorizontalLayout / Spalten-Container
  if (el.type === 'HorizontalLayout') {
    const widths: number[] = (el.options?.widths as number[]) ?? [];
    const cols = widths.length > 0 ? widths.length : 2;
    const colLabels = widths.length > 0
      ? widths.map((w) => `${w} Teil${w > 1 ? 'e' : ''}`)
      : Array(cols).fill('1 Teil');

    return (
      <Box
        onClick={() => onSelect(el.scope)}
        sx={{ ...baseSx, p: 1, backgroundColor: isSelected ? 'action.selected' : 'action.hover' }}
        role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(el.scope)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
          <Box component="i" className="ti ti-layout-columns" sx={{ fontSize: 14, color: 'primary.main' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', flex: 1 }}>
            {cols} Spalten{widths.length > 0 ? ` (${widths.join(':')})` : ''}
          </Typography>
          <Chip label="Layout" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
          <DeleteBtn />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {colLabels.map((lbl, i) => (
            <Box
              key={i}
              sx={{
                flex: widths[i] ?? 1,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 0.5,
                minHeight: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                {lbl}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // Group
  if (el.type === 'Group') {
    return (
      <Box
        onClick={() => onSelect(el.scope)}
        sx={{ ...baseSx, p: 1, backgroundColor: isSelected ? 'action.selected' : (bgColor ?? 'transparent') }}
        role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(el.scope)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="i" className="ti ti-layout-list" sx={{ fontSize: 14, color: 'secondary.main' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, flex: 1 }}>
            {el.label ?? 'Gruppe'}
          </Typography>
          <Chip label="Gruppe" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
          <DeleteBtn />
        </Box>
      </Box>
    );
  }

  // Label / Hinweistext
  if (el.type === 'Label') {
    const variant = el.options?.variant as string | undefined;

    if (variant === 'info') {
      return (
        <Box onClick={() => onSelect(el.scope)} sx={{ ...baseSx, cursor: 'pointer' }}
          role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect(el.scope)}>
          <Alert severity="info" sx={{ py: 0.25, pr: 4, position: 'relative' }}>
            <Typography variant="caption">{el.label ?? 'Information'}</Typography>
            <Box sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}>
              <DeleteBtn />
            </Box>
          </Alert>
        </Box>
      );
    }

    if (variant === 'warning') {
      return (
        <Box onClick={() => onSelect(el.scope)} sx={{ ...baseSx, cursor: 'pointer' }}
          role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect(el.scope)}>
          <Alert severity="warning" sx={{ py: 0.25, pr: 4, position: 'relative' }}>
            <Typography variant="caption">{el.label ?? 'Hinweis'}</Typography>
            <Box sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}>
              <DeleteBtn />
            </Box>
          </Alert>
        </Box>
      );
    }

    // Normale Überschrift oder Text
    return (
      <Box
        onClick={() => onSelect(el.scope)}
        sx={{ ...baseSx, px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
          backgroundColor: isSelected ? 'action.selected' : 'transparent' }}
        role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(el.scope)}
      >
        <Box component="i" className="ti ti-text-size" sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
        <Typography variant="body2" sx={{ flex: 1, fontStyle: 'italic', color: 'text.secondary' }} noWrap>
          {el.label ?? 'Text'}
        </Typography>
        <Chip label="Text" size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
        <DeleteBtn />
      </Box>
    );
  }

  // GroupContainer (neues Format)
  if (el.type === 'GroupContainer') {
    return (
      <Box
        onClick={() => onSelect(el.scope)}
        sx={{ ...baseSx, p: 1, backgroundColor: isSelected ? 'action.selected' : (bgColor ?? 'transparent') }}
        role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(el.scope)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="i" className="ti ti-layout-list" sx={{ fontSize: 14, color: 'secondary.main' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, flex: 1 }}>
            {el.label ?? 'Gruppe'}
          </Typography>
          <Chip label="Gruppe" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
          <DeleteBtn />
        </Box>
      </Box>
    );
  }

  // Abschnittskopf (section-header)
  if (el.type === 'Label' && el.options?.variant === 'section-header') {
    const bgColor = (el.options?.bgColor as string) ?? fieldState.sectionColors[el.scope] ?? '#004A99';
    const textColor = (el.options?.textColor as string) ?? '#ffffff';
    return (
      <Box
        onClick={() => onSelect(el.scope)}
        sx={{ ...baseSx, p: 0, overflow: 'hidden', cursor: 'pointer', backgroundColor: isSelected ? undefined : bgColor }}
        role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(el.scope)}
      >
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 1.5, py: 0.75,
          backgroundColor: isSelected ? 'action.selected' : bgColor,
          borderRadius: 0.5,
        }}>
          <Typography variant="body2" sx={{ flex: 1, fontWeight: 700, color: isSelected ? 'text.primary' : textColor }}>
            {el.label ?? 'Abschnittstitel'}
          </Typography>
          <Chip label="Abschnitt" size="small"
            sx={{ height: 16, fontSize: '0.6rem',
              backgroundColor: isSelected ? 'default' : 'rgba(255,255,255,0.2)',
              color: isSelected ? 'text.primary' : textColor }} />
          <DeleteBtn />
        </Box>
      </Box>
    );
  }

  // Annotation (kleiner Hinweis rechts)
  if (el.type === 'Label' && el.options?.variant === 'annotation') {
    return (
      <Box
        onClick={() => onSelect(el.scope)}
        sx={{ ...baseSx, px: 1.5, py: 0.5, display: 'flex', alignItems: 'flex-start', gap: 1,
          backgroundColor: isSelected ? 'action.selected' : 'rgba(0,0,0,0.02)',
          borderLeft: '3px solid', borderLeftColor: isSelected ? 'primary.main' : 'text.disabled',
          cursor: 'pointer',
        }}
        role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(el.scope)}
      >
        <Box component="i" className="ti ti-notes" sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0, mt: 0.1 }} />
        <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary', fontStyle: 'italic', fontSize: '0.72rem' }} >
          {el.label ?? 'Annotation'}
        </Typography>
        <Chip label="Hinweis" size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
        <DeleteBtn />
      </Box>
    );
  }

  return null;
}
