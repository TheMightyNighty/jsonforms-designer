import CheckIcon from '@mui/icons-material/Check';
import { Box, Typography } from '@mui/material';

import { FormTab } from '../../core/model/addFieldReducer';

interface FormStepperSidebarProps {
  steps: FormTab[];
  activeStep: number;
  onStepClick: (index: number) => void;
}

/**
 * Schritt-Sidebar für die mehrseitige Formular-Vorschau: dunkle Fläche mit
 * nummerierten, durch eine Linie verbundenen Kreisen — orientiert an der
 * Vorschau-Ansicht gängiger Bürger-Formulardesigner (nummerierter
 * Fortschritt statt horizontaler MUI-Stepper-Chips).
 */
export function FormStepperSidebar({
  steps,
  activeStep,
  onStepClick,
}: FormStepperSidebarProps) {
  return (
    <Box
      className="no-print"
      sx={{
        width: 240,
        flexShrink: 0,
        backgroundColor: '#003366',
        py: 4,
        px: 3,
      }}
    >
      {steps.map((step, i) => {
        const isActive = i === activeStep;
        const isDone = i < activeStep;
        const isLast = i === steps.length - 1;
        return (
          <Box key={i} sx={{ display: 'flex', position: 'relative' }}>
            {!isLast && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 15,
                  top: 32,
                  bottom: -8,
                  width: 2,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                }}
              />
            )}
            <Box
              role="button"
              tabIndex={0}
              aria-label={`Schritt ${i + 1}: ${step.label}`}
              aria-current={isActive ? 'step' : undefined}
              onClick={() => onStepClick(i)}
              onKeyDown={(e) => e.key === 'Enter' && onStepClick(i)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1,
                fontWeight: 700,
                fontSize: '0.8rem',
                backgroundColor: isActive
                  ? '#009EE0'
                  : isDone
                    ? '#FFFFFF'
                    : 'transparent',
                color: isActive ? '#FFFFFF' : isDone ? '#003366' : '#FFFFFF',
                border:
                  isActive || isDone
                    ? 'none'
                    : '2px solid rgba(255,255,255,0.5)',
              }}
            >
              {isDone ? <CheckIcon fontSize="small" /> : i + 1}
            </Box>
            <Typography
              onClick={() => onStepClick(i)}
              variant="body2"
              sx={{
                ml: 1.5,
                mb: 4,
                pt: 0.5,
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
              }}
            >
              {step.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
