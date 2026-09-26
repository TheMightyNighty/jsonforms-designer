/**
 * KERN-Stil — Layout-Renderer (VerticalLayout, HorizontalLayout, Group,
 * Categorization/Category, Label). Bewusst andere Anmutung als der
 * Bundesportal-Stil: Group ohne gefüllte Fläche, sondern mit linkem
 * Akzentrahmen; Categorization als schlanke unterstrichene Tab-Leiste statt
 * Box-Tabs; Label gedämpft und kursiv. Nutzt dieselbe Breiten-Mathematik aus
 * shared/layoutWidth wie alle anderen Varianten.
 */
import {
  ControlElement,
  GroupLayout,
  isCategorization,
  LabelElement,
  LayoutProps,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';

import { flexBasisFor, ofmWidthOf } from '../shared/layoutWidth';

const SECTION_COLOR_BORDER: Record<string, string> = {
  blue: '#3A5F82',
  green: '#2C5F4F',
  yellow: '#9C8420',
  red: '#8A3B2E',
  purple: '#6B4C82',
  gray: '#5C6355',
};

function VerticalLayoutRenderer({
  uischema,
  schema,
  path,
  renderers,
  cells,
  visible,
}: LayoutProps) {
  if (visible === false) return null;
  const elements = (uischema as { elements?: unknown[] }).elements ?? [];
  return (
    <Box>
      {elements.map((el, i) => (
        <JsonFormsDispatch
          key={i}
          uischema={el as never}
          schema={schema}
          path={path}
          renderers={renderers}
          cells={cells}
        />
      ))}
    </Box>
  );
}

function HorizontalLayoutRenderer({
  uischema,
  schema,
  path,
  renderers,
  cells,
  visible,
}: LayoutProps) {
  if (visible === false) return null;
  const elements = (uischema as { elements?: ControlElement[] }).elements ?? [];
  return (
    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {elements.map((el, i) => (
        <Box
          key={i}
          sx={{
            flexBasis: flexBasisFor(ofmWidthOf(el.options), elements.length),
            flexGrow: 0,
            minWidth: 0,
          }}
        >
          <JsonFormsDispatch
            uischema={el}
            schema={schema}
            path={path}
            renderers={renderers}
            cells={cells}
          />
        </Box>
      ))}
    </Box>
  );
}

function GroupRenderer({
  uischema,
  schema,
  path,
  renderers,
  cells,
  visible,
}: LayoutProps) {
  if (visible === false) return null;
  const group = uischema as GroupLayout;
  const token = (group.options?.['ofm:sectionColor'] as string) ?? undefined;
  const accent = token ? SECTION_COLOR_BORDER[token] : '#2C5F4F';
  return (
    <Box
      sx={{
        mb: 3,
        pl: 2.5,
        py: 0.5,
        borderLeft: `4px solid ${accent}`,
      }}
    >
      {group.label && (
        <Typography
          variant="overline"
          sx={{
            display: 'block',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#5C6355',
            mb: 1.5,
          }}
        >
          {group.label}
        </Typography>
      )}
      {(group.elements ?? []).map((el, i) => (
        <JsonFormsDispatch
          key={i}
          uischema={el}
          schema={schema}
          path={path}
          renderers={renderers}
          cells={cells}
        />
      ))}
    </Box>
  );
}

function CategorizationRenderer({
  uischema,
  schema,
  path,
  renderers,
  cells,
  visible,
}: LayoutProps) {
  const [tab, setTab] = useState(0);
  if (visible === false) return null;
  const categories =
    (uischema as { elements?: { label?: string; elements?: unknown[] }[] })
      .elements ?? [];
  const active = categories[tab];
  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="standard"
        TabIndicatorProps={{ sx: { height: 2, backgroundColor: '#2C5F4F' } }}
        sx={{ borderBottom: '1px solid #E4E0D6', mb: 2.5, minHeight: 36 }}
      >
        {categories.map((cat, i) => (
          <Tab
            key={i}
            label={cat.label ?? `Schritt ${i + 1}`}
            sx={{ minHeight: 36, textTransform: 'none', fontSize: '0.85rem' }}
          />
        ))}
      </Tabs>
      {active &&
        (active.elements ?? []).map((el, i) => (
          <JsonFormsDispatch
            key={i}
            uischema={el as never}
            schema={schema}
            path={path}
            renderers={renderers}
            cells={cells}
          />
        ))}
    </Box>
  );
}

function LabelRenderer({ uischema, visible }: LayoutProps) {
  if (visible === false) return null;
  const text = (uischema as LabelElement).text ?? '';
  return (
    <Typography
      variant="body2"
      sx={{ mb: 2, fontStyle: 'italic', color: '#5C6355' }}
    >
      {text}
    </Typography>
  );
}

const KernVerticalLayout = withJsonFormsLayoutProps(VerticalLayoutRenderer);
const KernHorizontalLayout = withJsonFormsLayoutProps(HorizontalLayoutRenderer);
const KernGroup = withJsonFormsLayoutProps(GroupRenderer);
const KernCategorization = withJsonFormsLayoutProps(CategorizationRenderer);
const KernLabel = withJsonFormsLayoutProps(LabelRenderer);

export const kernLayoutRenderers = [
  {
    tester: rankWith(2, uiTypeIs('VerticalLayout')),
    renderer: KernVerticalLayout,
  },
  {
    tester: rankWith(2, uiTypeIs('HorizontalLayout')),
    renderer: KernHorizontalLayout,
  },
  { tester: rankWith(2, uiTypeIs('Group')), renderer: KernGroup },
  {
    tester: rankWith(2, (uischema) => isCategorization(uischema)),
    renderer: KernCategorization,
  },
  { tester: rankWith(2, uiTypeIs('Label')), renderer: KernLabel },
];
