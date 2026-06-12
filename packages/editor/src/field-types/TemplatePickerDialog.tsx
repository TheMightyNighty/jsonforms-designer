import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { useI18n } from '../i18n';
import { FORM_TEMPLATES, FormTemplate } from './formTemplates';

interface TemplatePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: FormTemplate) => void;
}

export function TemplatePickerDialog({
  open,
  onClose,
  onSelect,
}: TemplatePickerDialogProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    const tpl = FORM_TEMPLATES.find((t) => t.id === selected);
    if (tpl) {
      onSelect(tpl);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t.dialog.templateTitle}</DialogTitle>
      <DialogContent>
        <Box
          sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}
        >
          {FORM_TEMPLATES.map((tpl) => (
            <Card
              key={tpl.id}
              variant="outlined"
              sx={{
                borderColor: selected === tpl.id ? 'primary.main' : 'divider',
                borderWidth: selected === tpl.id ? 2 : 1,
              }}
            >
              <CardActionArea onClick={() => setSelected(tpl.id)}>
                <CardContent
                  sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  <Box
                    component="i"
                    className={`ti ti-${tpl.icon}`}
                    sx={{ fontSize: 28, color: 'primary.main', flexShrink: 0 }}
                    aria-hidden
                  />
                  <Box>
                    <Typography variant="subtitle2">
                      {tpl.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tpl.description}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.dialog.cancel}</Button>
        <Button
          variant="contained"
          disabled={!selected}
          onClick={handleConfirm}
        >
          Vorlage laden
        </Button>
      </DialogActions>
    </Dialog>
  );
}
