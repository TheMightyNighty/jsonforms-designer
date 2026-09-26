/**
 * Bundesportal-Stil — eigenständige Control-Komponenten (kein CSS-Override
 * des MUI-Sets aus @jsonforms/material-renderers, sondern frische
 * Komponenten auf MUI-Primitiven). Muster: Label oberhalb des Feldes, ruhige
 * Fläche, deutlicher Fokus-Zustand (siehe theme.ts).
 */
import {
  ControlProps,
  isBooleanControl,
  isDateControl,
  isEnumControl,
  isIntegerControl,
  isMultiLineControl,
  isNumberControl,
  isOneOfEnumControl,
  isStringControl,
  or,
  rankWith,
} from '@jsonforms/core';
import {
  withJsonFormsControlProps,
  withJsonFormsEnumProps,
  withJsonFormsOneOfEnumProps,
} from '@jsonforms/react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';

function FieldFrame({
  label,
  required,
  errors,
  description,
  children,
}: {
  label: string;
  required?: boolean;
  errors?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        component="label"
        variant="body2"
        sx={{ display: 'block', fontWeight: 600, mb: 0.5, color: '#1A2033' }}
      >
        {label}
        {required && (
          <Box component="span" sx={{ color: '#B3261E' }}>
            {' '}
            *
          </Box>
        )}
      </Typography>
      {children}
      {description && !errors && (
        <FormHelperText sx={{ ml: 0 }}>{description}</FormHelperText>
      )}
      {errors && (
        <FormHelperText error sx={{ ml: 0 }}>
          {errors}
        </FormHelperText>
      )}
    </Box>
  );
}

function TextInput({
  data,
  handleChange,
  path,
  label,
  description,
  errors,
  required,
  visible,
  enabled,
  uischema,
}: ControlProps) {
  if (visible === false) return null;
  const multiline = Boolean(uischema.options?.multi);
  return (
    <FieldFrame
      label={label}
      required={required}
      errors={errors}
      description={description}
    >
      <TextField
        fullWidth
        size="small"
        multiline={multiline}
        minRows={multiline ? 3 : undefined}
        value={data ?? ''}
        disabled={enabled === false}
        error={Boolean(errors)}
        onChange={(e) => handleChange(path, e.target.value)}
      />
    </FieldFrame>
  );
}

function NumberInput({
  data,
  handleChange,
  path,
  label,
  description,
  errors,
  required,
  visible,
  enabled,
}: ControlProps) {
  if (visible === false) return null;
  return (
    <FieldFrame
      label={label}
      required={required}
      errors={errors}
      description={description}
    >
      <TextField
        fullWidth
        size="small"
        type="number"
        value={data ?? ''}
        disabled={enabled === false}
        error={Boolean(errors)}
        onChange={(e) =>
          handleChange(
            path,
            e.target.value === '' ? undefined : Number(e.target.value),
          )
        }
      />
    </FieldFrame>
  );
}

function DateInput({
  data,
  handleChange,
  path,
  label,
  description,
  errors,
  required,
  visible,
  enabled,
}: ControlProps) {
  if (visible === false) return null;
  return (
    <FieldFrame
      label={label}
      required={required}
      errors={errors}
      description={description}
    >
      <TextField
        fullWidth
        size="small"
        type="date"
        value={data ?? ''}
        disabled={enabled === false}
        error={Boolean(errors)}
        onChange={(e) => handleChange(path, e.target.value)}
      />
    </FieldFrame>
  );
}

function BooleanInput({
  data,
  handleChange,
  path,
  label,
  description,
  errors,
  visible,
  enabled,
}: ControlProps) {
  if (visible === false) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(data)}
            disabled={enabled === false}
            onChange={(e) => handleChange(path, e.target.checked)}
          />
        }
        label={label}
      />
      {description && !errors && (
        <FormHelperText sx={{ ml: 4 }}>{description}</FormHelperText>
      )}
      {errors && (
        <FormHelperText error sx={{ ml: 4 }}>
          {errors}
        </FormHelperText>
      )}
    </Box>
  );
}

function EnumSelect({
  data,
  handleChange,
  path,
  label,
  description,
  errors,
  required,
  visible,
  enabled,
  options,
}: ControlProps & { options?: { label: string; value: unknown }[] }) {
  if (visible === false) return null;
  return (
    <FieldFrame
      label={label}
      required={required}
      errors={errors}
      description={description}
    >
      <TextField
        select
        fullWidth
        size="small"
        value={data ?? ''}
        disabled={enabled === false}
        error={Boolean(errors)}
        onChange={(e) => handleChange(path, e.target.value)}
      >
        {(options ?? []).map((opt) => (
          <MenuItem key={String(opt.value)} value={opt.value as string}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    </FieldFrame>
  );
}

const PortalTextControl = withJsonFormsControlProps(TextInput);
const PortalNumberControl = withJsonFormsControlProps(NumberInput);
const PortalDateControl = withJsonFormsControlProps(DateInput);
const PortalBooleanControl = withJsonFormsControlProps(BooleanInput);
const PortalEnumControl = withJsonFormsEnumProps(EnumSelect);
const PortalOneOfEnumControl = withJsonFormsOneOfEnumProps(EnumSelect);

export const portalControlRenderers = [
  { tester: rankWith(5, isOneOfEnumControl), renderer: PortalOneOfEnumControl },
  { tester: rankWith(4, isEnumControl), renderer: PortalEnumControl },
  { tester: rankWith(4, isDateControl), renderer: PortalDateControl },
  { tester: rankWith(4, isMultiLineControl), renderer: PortalTextControl },
  { tester: rankWith(3, isBooleanControl), renderer: PortalBooleanControl },
  {
    tester: rankWith(3, or(isIntegerControl, isNumberControl)),
    renderer: PortalNumberControl,
  },
  { tester: rankWith(2, isStringControl), renderer: PortalTextControl },
];
