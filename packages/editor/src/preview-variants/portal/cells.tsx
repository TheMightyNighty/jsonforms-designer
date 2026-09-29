/**
 * Bundesportal-Stil — Cell-Renderer (kompakte Feld-Widgets ohne eigenes
 * Label, z. B. für künftige Tabellen-/Array-Kontexte). Teilen sich keine
 * Komponenten mit dem MUI-Set.
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
      size="small"
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
      size="small"
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
      size="small"
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
      onChange={(e) => handleChange(path, e.target.checked)}
    />
  );
}

const PortalTextCell = withJsonFormsCellProps(TextCell);
const PortalNumberCell = withJsonFormsCellProps(NumberCell);
const PortalDateCell = withJsonFormsCellProps(DateCell);
const PortalBooleanCell = withJsonFormsCellProps(BooleanCell);

export const portalCells = [
  { tester: rankWith(4, isDateControl), cell: PortalDateCell },
  { tester: rankWith(3, isBooleanControl), cell: PortalBooleanCell },
  {
    tester: rankWith(3, or(isIntegerControl, isNumberControl)),
    cell: PortalNumberCell,
  },
  { tester: rankWith(2, isStringControl), cell: PortalTextCell },
];
