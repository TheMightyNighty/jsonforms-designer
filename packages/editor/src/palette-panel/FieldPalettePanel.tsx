/**
 * Linke Palette: Suchfeld über drei Reitern — Bausteine · FIM · Einzelfelder.
 *
 * Vorher war die Palette eine flache Liste aus rund dreißig Rohfeldtypen.
 * Nach ADR 0002 ist der Einstieg der Baustein (eine benannte Feldgruppe), das
 * Einzelfeld die Ausnahme; im Reiter „Einzelfelder" stehen deshalb die acht
 * häufigsten oben und der Rest unter „Weitere Feldtypen".
 */
import {
  Box,
  Collapse,
  Divider,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { useEditorConfig } from '../config/EditorConfigContext';
import { BAUSTEIN_KATALOG } from '../field-types/bausteine';
import {
  FIELD_GROUPS,
  FIELD_TYPE_CATALOG,
  FieldGroup,
  FieldTypeDefinition,
  getFieldTypesByGroup,
} from '../field-types/fieldTypes';
import { FimPaletteSection } from '../fim/FimPaletteSection';
import { useI18n } from '../i18n';
import { OpenCodePaletteSection } from '../opencode/OpenCodePaletteSection';
import { BausteinPaletteItem } from './BausteinPaletteItem';
import { FieldPaletteItem } from './FieldPaletteItem';
import { HAEUFIGE_FELDTYP_IDS } from './haeufigeFeldtypen';
import { istSuchaktiv, sucheBausteine, sucheFeldtypen } from './paletteSuche';

// ---------------------------------------------------------------------------
// Bausteine für die Sichtbarkeit von Überschriften
// ---------------------------------------------------------------------------

function Rubrik({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        px: 1.5,
        pt: 1,
        pb: 0.5,
        color: 'text.secondary',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </Typography>
  );
}

function LeerHinweis({ text }: { text: string }) {
  return (
    <Typography
      variant="caption"
      sx={{ display: 'block', px: 1.5, py: 1.5, color: 'text.secondary' }}
    >
      {text}
    </Typography>
  );
}

// ---------------------------------------------------------------------------
// Einklappbare Feldtyp-Gruppe (Reiter „Einzelfelder", unter „Weitere")
// ---------------------------------------------------------------------------

interface CollapsibleGroupProps {
  groupId: FieldGroup;
  defaultOpen: boolean;
}

function CollapsibleFieldGroup({
  groupId,
  defaultOpen,
}: CollapsibleGroupProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);
  const label =
    t.palette.groups[groupId as keyof typeof t.palette.groups] ?? groupId;
  // Die acht häufigen Feldtypen stehen bereits oben — sie hier ein zweites
  // Mal zu zeigen, würde nur verwirren.
  const items = getFieldTypesByGroup(groupId).filter(
    (ft) => !HAEUFIGE_FELDTYP_IDS.includes(ft.id),
  );
  if (items.length === 0) return null;

  return (
    <Box>
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          cursor: 'pointer',
          userSelect: 'none',
          borderRadius: 1,
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        <Box
          component="i"
          className={`ti ti-chevron-${open ? 'down' : 'right'}`}
          sx={{ fontSize: 12, color: 'text.secondary', flexShrink: 0 }}
        />
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            flex: 1,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontSize: '0.68rem' }}
        >
          ({items.length})
        </Typography>
      </Box>

      <Collapse in={open} timeout={150}>
        <Box role="group" aria-label={label}>
          {items.map((ft) => (
            <Box key={ft.id} role="listitem">
              <FieldPaletteItem fieldType={ft} />
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Reiter-Inhalte
// ---------------------------------------------------------------------------

function BausteineTab() {
  const config = useEditorConfig();
  const { t } = useI18n();

  return (
    <Box role="list" aria-label={t.palette.tabs.bausteine}>
      {BAUSTEIN_KATALOG.map((b) => (
        <Box key={b.id} role="listitem">
          <BausteinPaletteItem baustein={b} />
        </Box>
      ))}

      {/*
        OpenCode-Bausteine sind ebenfalls fertige Bausteine und stehen
        deshalb in diesem Reiter. Die Validatoren daraus wandern mit
        Arbeitspaket 4 in den Reiter „Prüfung" der Eigenschaften.
      */}
      {config.modules?.openCode?.enabled && (
        <OpenCodePaletteSection service={config.modules.openCode.service} />
      )}
    </Box>
  );
}

function EinzelfelderTab() {
  const config = useEditorConfig();
  const { t } = useI18n();
  const [weitereOffen, setWeitereOffen] = useState(false);
  const collapsedByDefault = config.palette?.collapsedByDefault ?? [];

  const haeufige = HAEUFIGE_FELDTYP_IDS.map((id) =>
    FIELD_TYPE_CATALOG.find((ft) => ft.id === id),
  ).filter((ft): ft is FieldTypeDefinition => ft !== undefined);

  return (
    <Box role="list" aria-label={t.palette.tabs.einzelfelder}>
      {haeufige.map((ft) => (
        <Box key={ft.id} role="listitem">
          <FieldPaletteItem fieldType={ft} />
        </Box>
      ))}

      <Divider sx={{ my: 0.5 }} />

      <Box
        component="button"
        type="button"
        onClick={() => setWeitereOffen((v) => !v)}
        aria-expanded={weitereOffen}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          width: '100%',
          px: 1.5,
          py: 0.75,
          border: 'none',
          background: 'none',
          font: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
          borderRadius: 1,
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        <Box
          component="i"
          className={`ti ti-chevron-${weitereOffen ? 'down' : 'right'}`}
          sx={{ fontSize: 12, color: 'text.secondary', flexShrink: 0 }}
        />
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontWeight: 500 }}
        >
          {t.palette.weitereFeldtypen}
        </Typography>
      </Box>

      <Collapse in={weitereOffen} timeout={150}>
        {FIELD_GROUPS.map(({ id }) => (
          <Box key={id} role="listitem">
            <CollapsibleFieldGroup
              groupId={id}
              defaultOpen={!collapsedByDefault.includes(id)}
            />
          </Box>
        ))}
      </Collapse>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Suchergebnisse (über alle Reiter)
// ---------------------------------------------------------------------------

function Suchergebnisse({ suchtext }: { suchtext: string }) {
  const { t } = useI18n();
  const bausteine = sucheBausteine(BAUSTEIN_KATALOG, suchtext);
  const feldtypen = sucheFeldtypen(FIELD_TYPE_CATALOG, suchtext);

  return (
    <Box role="list" aria-label={t.palette.suchergebnisse}>
      {bausteine.length > 0 && <Rubrik label={t.palette.tabs.bausteine} />}
      {bausteine.map((b) => (
        <Box key={b.id} role="listitem">
          <BausteinPaletteItem baustein={b} />
        </Box>
      ))}

      {feldtypen.length > 0 && <Rubrik label={t.palette.tabs.einzelfelder} />}
      {feldtypen.map((ft) => (
        <Box key={ft.id} role="listitem">
          <FieldPaletteItem fieldType={ft} />
        </Box>
      ))}

      {bausteine.length === 0 && feldtypen.length === 0 && (
        <LeerHinweis text={t.palette.fim.keineTreffer} />
      )}

      {/*
        FIM-Einträge kommen aus einem entfernten Dienst mit eigener,
        debouncter Suche. Statt eine zweite Abfrage zu starten, weist die
        Ergebnisliste auf den FIM-Reiter hin.
      */}
      <Divider sx={{ my: 1 }} />
      <LeerHinweis text={t.palette.fimSucheHinweis} />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

type PaletteReiter = 'bausteine' | 'fim' | 'einzelfelder';

export function FieldPalettePanel() {
  const config = useEditorConfig();
  const { t } = useI18n();
  const [reiter, setReiter] = useState<PaletteReiter>('bausteine');
  const [suchtext, setSuchtext] = useState('');

  const fimAktiv = config.modules?.fim?.enabled ?? false;
  const sucht = istSuchaktiv(suchtext);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1 }}>
        <TextField
          size="small"
          fullWidth
          value={suchtext}
          onChange={(e) => setSuchtext(e.target.value)}
          placeholder={t.palette.suche}
          inputProps={{ 'aria-label': t.palette.suche }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box
                  component="i"
                  className="ti ti-search"
                  sx={{ fontSize: 16, color: 'text.secondary' }}
                  aria-hidden="true"
                />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {!sucht && (
        <Tabs
          value={reiter}
          onChange={(_, v: PaletteReiter) => setReiter(v)}
          variant="fullWidth"
          sx={{ minHeight: 36, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            value="bausteine"
            label={t.palette.tabs.bausteine}
            sx={{ minHeight: 36, py: 0.5 }}
          />
          {fimAktiv && (
            <Tab
              value="fim"
              label={t.palette.tabs.fim}
              sx={{ minHeight: 36, py: 0.5 }}
            />
          )}
          <Tab
            value="einzelfelder"
            label={t.palette.tabs.einzelfelder}
            sx={{ minHeight: 36, py: 0.5 }}
          />
        </Tabs>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', pb: 2 }}>
        {sucht ? (
          <Suchergebnisse suchtext={suchtext} />
        ) : (
          <>
            {reiter === 'bausteine' && <BausteineTab />}
            {reiter === 'fim' && fimAktiv && (
              <FimPaletteSection service={config.modules?.fim?.service} />
            )}
            {reiter === 'einzelfelder' && <EinzelfelderTab />}
          </>
        )}
      </Box>
    </Box>
  );
}
