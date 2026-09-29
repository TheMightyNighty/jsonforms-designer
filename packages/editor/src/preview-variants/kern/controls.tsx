/**
 * KERN-Stil — eigenständige Control-Komponenten. Muster: unterstrichene
 * Eingabelinie (MUI "standard"-Variante) statt Kachel, kleine
 * Versal-Labels, großzügiger Zeilenabstand — bewusst anderes Vokabular als
 * die Bundesportal-Variante, obwohl beide auf MUI-Primitiven aufbauen.
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
    <Box sx={{ mb: 2.5 }}>
      <Typography
        component="label"
        variant="caption"
        sx={{
          display: 'block',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          mb: 0.5,
          color: '#5C6355',
        }}
      >
        {label}
        {required && (
          <Box component="span" sx={{ color: '#8A3B2E' }}>
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
        variant="standard"
        fullWidth
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
        variant="standard"
        fullWidth
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
        variant="standard"
        fullWidth
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
    <Box sx={{ mb: 2.5 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(data)}
            disabled={enabled === false}
            onChange={(e) => handleChange(path, e.target.checked)}
            sx={{ color: '#2C5F4F' }}
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
        variant="standard"
        fullWidth
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

const KernTextControl = withJsonFormsControlProps(TextInput);
const KernNumberControl = withJsonFormsControlProps(NumberInput);
const KernDateControl = withJsonFormsControlProps(DateInput);
const KernBooleanControl = withJsonFormsControlProps(BooleanInput);
const KernEnumControl = withJsonFormsEnumProps(EnumSelect);
const KernOneOfEnumControl = withJsonFormsOneOfEnumProps(EnumSelect);

export const kernControlRenderers = [
  { tester: rankWith(5, isOneOfEnumControl), renderer: KernOneOfEnumControl },
  { tester: rankWith(4, isEnumControl), renderer: KernEnumControl },
  { tester: rankWith(4, isDateControl), renderer: KernDateControl },
  { tester: rankWith(4, isMultiLineControl), renderer: KernTextControl },
  { tester: rankWith(3, isBooleanControl), renderer: KernBooleanControl },
  {
    tester: rankWith(3, or(isIntegerControl, isNumberControl)),
    renderer: KernNumberControl,
  },
  { tester: rankWith(2, isStringControl), renderer: KernTextControl },
];
