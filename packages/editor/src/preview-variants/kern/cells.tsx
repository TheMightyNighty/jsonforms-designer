/**
 * KERN-Stil — Cell-Renderer (kompakte Feld-Widgets ohne eigenes Label, z. B.
 * für künftige Tabellen-/Array-Kontexte). Teilen sich keine Komponenten mit
 * dem MUI- oder Bundesportal-Set.
 */
import {
  CellProps,
  isBooleanControl,
  isDateControl,
  isIntegerControl,
  isNumberControl,
  isStringControl,
  or,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { Checkbox, TextField } from '@mui/material';

function TextCell({ data, handleChange, path, enabled }: CellProps) {
  return (
    <TextField
      variant="standard"
      fullWidth
      value={data ?? ''}
      disabled={enabled === false}
      onChange={(e) => handleChange(path, e.target.value)}
    />
  );
}

function NumberCell({ data, handleChange, path, enabled }: CellProps) {
  return (
    <TextField
      variant="standard"
      fullWidth
      type="number"
      value={data ?? ''}
      disabled={enabled === false}
      onChange={(e) =>
        handleChange(
          path,
          e.target.value === '' ? undefined : Number(e.target.value),
        )
      }
    />
  );
}

function DateCell({ data, handleChange, path, enabled }: CellProps) {
  return (
    <TextField
      variant="standard"
      fullWidth
      type="date"
      value={data ?? ''}
      disabled={enabled === false}
      onChange={(e) => handleChange(path, e.target.value)}
    />
  );
}

function BooleanCell({ data, handleChange, path, enabled }: CellProps) {
  return (
    <Checkbox
      checked={Boolean(data)}
      disabled={enabled === false}
      sx={{ color: '#2C5F4F' }}
      onChange={(e) => handleChange(path, e.target.checked)}
    />
  );
}

const KernTextCell = withJsonFormsCellProps(TextCell);
const KernNumberCell = withJsonFormsCellProps(NumberCell);
const KernDateCell = withJsonFormsCellProps(DateCell);
const KernBooleanCell = withJsonFormsCellProps(BooleanCell);

export const kernCells = [
  { tester: rankWith(4, isDateControl), cell: KernDateCell },
  { tester: rankWith(3, isBooleanControl), cell: KernBooleanCell },
  {
    tester: rankWith(3, or(isIntegerControl, isNumberControl)),
    cell: KernNumberCell,
  },
  { tester: rankWith(2, isStringControl), cell: KernTextCell },
];
