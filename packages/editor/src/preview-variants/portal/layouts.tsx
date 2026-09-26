/**
 * Bundesportal-Stil — Layout-Renderer (VerticalLayout, HorizontalLayout,
 * Group, Categorization/Category, Label). Nutzt die gemeinsame
 * Breiten-Mathematik aus shared/layoutWidth für ofm:width.
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

const SECTION_COLOR_BG: Record<string, string> = {
  blue: '#E6EDF7',
  green: '#E3F1E6',
  yellow: '#FBF3D9',
  red: '#F7E4E2',
  purple: '#EFE5F7',
  gray: '#EDEEF0',
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
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
  const bg = token ? SECTION_COLOR_BG[token] : '#FFFFFF';
  return (
    <Box
      sx={{
        mb: 3,
        p: 2.5,
        borderRadius: 1,
        border: '1px solid #D8DEE6',
        backgroundColor: bg,
      }}
    >
      {group.label && (
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: '#004A99', mb: 1.5 }}
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
        sx={{ borderBottom: '2px solid #D8DEE6', mb: 2 }}
      >
        {categories.map((cat, i) => (
          <Tab key={i} label={cat.label ?? `Schritt ${i + 1}`} />
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
    <Typography variant="body2" sx={{ mb: 1.5, color: '#3A4256' }}>
      {text}
    </Typography>
  );
}

const PortalVerticalLayout = withJsonFormsLayoutProps(VerticalLayoutRenderer);
const PortalHorizontalLayout = withJsonFormsLayoutProps(
  HorizontalLayoutRenderer,
);
const PortalGroup = withJsonFormsLayoutProps(GroupRenderer);
const PortalCategorization = withJsonFormsLayoutProps(CategorizationRenderer);
const PortalLabel = withJsonFormsLayoutProps(LabelRenderer);

export const portalLayoutRenderers = [
  {
    tester: rankWith(2, uiTypeIs('VerticalLayout')),
    renderer: PortalVerticalLayout,
  },
  {
    tester: rankWith(2, uiTypeIs('HorizontalLayout')),
    renderer: PortalHorizontalLayout,
  },
  { tester: rankWith(2, uiTypeIs('Group')), renderer: PortalGroup },
  {
    tester: rankWith(2, (uischema) => isCategorization(uischema)),
    renderer: PortalCategorization,
  },
  { tester: rankWith(2, uiTypeIs('Label')), renderer: PortalLabel },
];
