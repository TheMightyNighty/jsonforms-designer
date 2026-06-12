import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useDrag } from 'react-dnd';

import { useI18n } from '../i18n';
import { FimDatenfeld, FimDatenfeldgruppe, FimService } from './fimService';
import { defaultMockFimService } from './mockFimService';

// ---------------------------------------------------------------------------
// DnD
// ---------------------------------------------------------------------------

export const FIM_DND_TYPE = 'FIM_BAUSTEIN' as const;

export type FimDragItem =
  | {
      dndType: typeof FIM_DND_TYPE;
      type: 'datenfeld';
      identifier: string;
      feld: FimDatenfeld;
    }
  | {
      dndType: typeof FIM_DND_TYPE;
      type: 'datenfeldgruppe';
      identifier: string;
      gruppe: FimDatenfeldgruppe;
    };

const MIN_SEARCH_LENGTH = 2;

// ---------------------------------------------------------------------------
// Identifier-Chip
// ---------------------------------------------------------------------------

function IdentifierChip({ identifier }: { identifier: string }) {
  const isGroup = identifier.startsWith('G');
  return (
    <Chip
      label={identifier}
      size="small"
      sx={{
        height: 15,
        fontSize: '0.58rem',
        fontFamily: 'monospace',
        fontWeight: 700,
        flexShrink: 0,
        bgcolor: isGroup ? 'primary.main' : 'success.main',
        color: '#fff',
        '& .MuiChip-label': { px: 0.75 },
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Gruppen-Karte (Browse-Modus)
// ---------------------------------------------------------------------------

function FimGruppeCard({ gruppe }: { gruppe: FimDatenfeldgruppe }) {
  const [{ isDragging }, dragRef] = useDrag<
    FimDragItem,
    unknown,
    { isDragging: boolean }
  >(
    () => ({
      type: FIM_DND_TYPE,
      item: {
        dndType: FIM_DND_TYPE,
        type: 'datenfeldgruppe',
        identifier: gruppe.identifier,
        gruppe,
      },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [gruppe],
  );

  const MAX_PREVIEW = 3;
  const preview = gruppe.felder
    .slice(0, MAX_PREVIEW)
    .map((f) => f.name)
    .join(', ');
  const extraCnt = gruppe.felder.length - MAX_PREVIEW;

  return (
    <Tooltip
      title={gruppe.beschreibung || gruppe.name}
      placement="right"
      enterDelay={600}
    >
      <Box
        ref={dragRef as unknown as React.Ref<HTMLDivElement>}
        sx={{
          mx: 1,
          mb: 0.75,
          px: 1.25,
          py: 1,
          border: '1px solid',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 1.5,
          cursor: 'grab',
          userSelect: 'none',
          opacity: isDragging ? 0.45 : 1,
          transition:
            'border-color 0.15s, background-color 0.15s, opacity 0.15s',
          '&:hover': {
            borderColor: 'primary.light',
            backgroundColor: 'action.hover',
          },
          '&:active': { cursor: 'grabbing' },
        }}
      >
        {/* Kopfzeile */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            mb: preview ? 0.5 : 0,
          }}
        >
          <Box
            component="i"
            className="ti ti-grip-vertical"
            sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }}
            aria-hidden
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              flex: 1,
              fontSize: '0.82rem',
              color: 'text.primary',
              lineHeight: 1.2,
            }}
            noWrap
          >
            {gruppe.name}
          </Typography>
          <IdentifierChip identifier={gruppe.identifier} />
        </Box>

        {/* Feldvorschau */}
        {(preview || gruppe.felder.length === 0) && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              fontSize: '0.7rem',
              lineHeight: 1.3,
              display: 'block',
              pl: 2.5,
            }}
          >
            {gruppe.felder.length === 0
              ? 'Gruppe – Felder werden beim Ablegen geladen'
              : `${preview}${extraCnt > 0 ? ` +${extraCnt}` : ''}`}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Einzelnes Datenfeld (Such-Modus und expanded Gruppen)
// ---------------------------------------------------------------------------

function FimFeldItem({
  feld,
  indent = false,
}: {
  feld: FimDatenfeld;
  indent?: boolean;
}) {
  const [{ isDragging }, dragRef] = useDrag<
    FimDragItem,
    unknown,
    { isDragging: boolean }
  >(
    () => ({
      type: FIM_DND_TYPE,
      item: {
        dndType: FIM_DND_TYPE,
        type: 'datenfeld',
        identifier: feld.identifier,
        feld,
      },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [feld],
  );

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {feld.identifier}
          </Typography>
          {feld.beschreibung && (
            <>
              <br />
              <Typography variant="caption">{feld.beschreibung}</Typography>
            </>
          )}
          <br />
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Typ: {feld.datentyp}
          </Typography>
        </Box>
      }
      placement="right"
      enterDelay={500}
    >
      <Box
        ref={dragRef as unknown as React.Ref<HTMLDivElement>}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          pl: indent ? 3 : 1.5,
          pr: 1.5,
          py: 0.5,
          borderRadius: 1,
          cursor: 'grab',
          userSelect: 'none',
          opacity: isDragging ? 0.4 : 1,
          transition: 'background-color 0.15s, opacity 0.15s',
          '&:hover': { backgroundColor: 'action.hover' },
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <IdentifierChip identifier={feld.identifier} />
        <Typography
          variant="body2"
          noWrap
          sx={{ fontSize: '0.8rem', color: 'text.primary', minWidth: 0 }}
        >
          {feld.name}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Gruppen-Listenzeile (Such-Modus — kompakter als Karte)
// ---------------------------------------------------------------------------

function FimGruppeRow({ gruppe }: { gruppe: FimDatenfeldgruppe }) {
  const [{ isDragging }, dragRef] = useDrag<
    FimDragItem,
    unknown,
    { isDragging: boolean }
  >(
    () => ({
      type: FIM_DND_TYPE,
      item: {
        dndType: FIM_DND_TYPE,
        type: 'datenfeldgruppe',
        identifier: gruppe.identifier,
        gruppe,
      },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [gruppe],
  );

  return (
    <Box
      ref={dragRef as unknown as React.Ref<HTMLDivElement>}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.5,
        borderRadius: 1,
        cursor: 'grab',
        userSelect: 'none',
        opacity: isDragging ? 0.4 : 1,
        transition: 'background-color 0.15s, opacity 0.15s',
        '&:hover': { backgroundColor: 'action.hover' },
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <IdentifierChip identifier={gruppe.identifier} />
      <Typography
        variant="body2"
        noWrap
        sx={{ fontSize: '0.8rem', color: 'text.primary', minWidth: 0 }}
      >
        {gruppe.name}
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Sub-Label (trennende Zeile)
// ---------------------------------------------------------------------------

function SubLabel({ label, count }: { label: string; count?: number }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.5,
        mt: 1,
        mb: 0.25,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
          fontSize: '0.68rem',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </Typography>
      {count !== undefined && (
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', fontSize: '0.68rem' }}
        >
          ({count})
        </Typography>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Hauptkomponente
// ---------------------------------------------------------------------------

interface FimPaletteSectionProps {
  service?: FimService;
}

export function FimPaletteSection({
  service = defaultMockFimService,
}: FimPaletteSectionProps) {
  const { t } = useI18n();
  const fim = t.palette.fim;
  const isServerSide = service.serverSideSearch === true;

  const [open, setOpen] = useState(true);
  const [gruppen, setGruppen] = useState<FimDatenfeldgruppe[]>([]);
  const [gruppenLoading, setGruppenLoading] = useState(true);
  const [felder, setFelder] = useState<FimDatenfeld[]>([]);
  const [felderLoading, setFelderLoading] = useState(false);
  const [filteredFelder, setFilteredFelder] = useState<FimDatenfeld[]>([]);
  const [filteredGruppen, setFilteredGruppen] = useState<FimDatenfeldgruppe[]>(
    [],
  );

  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gruppen einmalig laden
  useEffect(() => {
    setGruppenLoading(true);
    service.getDatenfeldgruppen().then((g) => {
      setGruppen(g);
      setFilteredGruppen(g);
      setGruppenLoading(false);
    });
  }, [service]);

  // Mock: Felder einmalig laden
  useEffect(() => {
    if (isServerSide) return;
    service.getDatenfelder().then((f) => {
      setFelder(f);
      setFilteredFelder(f);
    });
  }, [service, isServerSide]);

  // Suche (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const q = query.trim();
      const ql = q.toLowerCase();

      if (!q) {
        setFilteredGruppen(gruppen);
        setFilteredFelder(isServerSide ? [] : felder);
        return;
      }

      // Gruppen immer clientseitig (geladen)
      setFilteredGruppen(
        gruppen.filter(
          (g) =>
            g.name.toLowerCase().includes(ql) ||
            g.identifier.toLowerCase().includes(ql),
        ),
      );

      if (isServerSide) {
        if (q.length >= MIN_SEARCH_LENGTH) {
          setFelderLoading(true);
          service.getDatenfelder(q).then((f) => {
            setFilteredFelder(f);
            setFelderLoading(false);
          });
        }
      } else {
        setFilteredFelder(
          felder.filter(
            (f) =>
              f.name.toLowerCase().includes(ql) ||
              f.identifier.toLowerCase().includes(ql) ||
              f.beschreibung.toLowerCase().includes(ql),
          ),
        );
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, felder, gruppen, service, isServerSide]);

  const isSearching = query.trim().length > 0;
  const searchLong = query.trim().length >= MIN_SEARCH_LENGTH;
  const showFeldHint = isServerSide && !isSearching;
  const showMinHint = isServerSide && isSearching && !searchLong;
  const showFelder = isSearching && (!isServerSide || searchLong);
  const totalCount = gruppen.length;

  return (
    <Box>
      <Divider sx={{ my: 1.5 }} />

      {/* Einklappbarer Header */}
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
          sx={{ fontSize: 12, color: 'text.disabled', flexShrink: 0 }}
        />
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            flex: 1,
          }}
        >
          {fim.title}
        </Typography>
        {!gruppenLoading && (
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', fontSize: '0.68rem', mr: 0.5 }}
          >
            ({totalCount})
          </Typography>
        )}
        <Chip
          label="FitKo"
          size="small"
          sx={{
            height: 14,
            fontSize: '0.58rem',
            fontWeight: 700,
            bgcolor: 'primary.dark',
            color: '#fff',
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      </Box>

      <Collapse in={open} timeout={150}>
        {/* Suchfeld */}
        <Box sx={{ px: 1, mt: 0.75, mb: 0.5 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={fim.suche}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      component="i"
                      className="ti ti-search"
                      sx={{ fontSize: 14, color: 'text.disabled' }}
                    />
                  </InputAdornment>
                ),
                endAdornment: query ? (
                  <InputAdornment position="end">
                    <Box
                      component="i"
                      className="ti ti-x"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuery('');
                      }}
                      sx={{
                        fontSize: 12,
                        color: 'text.disabled',
                        cursor: 'pointer',
                        '&:hover': { color: 'text.primary' },
                      }}
                    />
                  </InputAdornment>
                ) : undefined,
              },
            }}
            sx={{
              '& .MuiInputBase-root': { fontSize: '0.78rem' },
              '& .MuiInputBase-input': { py: 0.5 },
            }}
          />
        </Box>

        {/* ── BROWSE-MODUS: Gruppen als Karten ─────────────────────────── */}
        {!isSearching && (
          <>
            {gruppenLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={16} />
              </Box>
            ) : (
              <>
                <SubLabel
                  label={fim.datenfeldgruppen}
                  count={filteredGruppen.length}
                />
                {filteredGruppen.map((g) => (
                  <FimGruppeCard key={g.identifier} gruppe={g} />
                ))}

                {/* Hinweis Einzelfelder */}
                <Box
                  sx={{
                    px: 1.5,
                    mt: 1.5,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  <Box
                    component="i"
                    className="ti ti-search"
                    sx={{ fontSize: 12, color: 'text.disabled' }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.disabled',
                      fontSize: '0.7rem',
                      fontStyle: 'italic',
                    }}
                  >
                    {showFeldHint ? fim.sucheHint : fim.datenfelder}
                  </Typography>
                </Box>
              </>
            )}
          </>
        )}

        {/* ── SUCH-MODUS ────────────────────────────────────────────────── */}
        {isSearching && (
          <>
            {/* Gruppen-Ergebnisse */}
            {filteredGruppen.length > 0 && (
              <>
                <SubLabel
                  label={fim.datenfeldgruppen}
                  count={filteredGruppen.length}
                />
                {filteredGruppen.map((g) => (
                  <FimGruppeRow key={g.identifier} gruppe={g} />
                ))}
              </>
            )}

            {/* Min-Length-Hinweis */}
            {showMinHint && (
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  color: 'text.disabled',
                  display: 'block',
                  py: 0.5,
                }}
              >
                {fim.sucheMinLength}
              </Typography>
            )}

            {/* Einzelfelder */}
            {showFelder && (
              <>
                {felderLoading ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 1 }}
                  >
                    <CircularProgress size={14} />
                  </Box>
                ) : filteredFelder.length > 0 ? (
                  <>
                    <SubLabel
                      label={fim.datenfelder}
                      count={filteredFelder.length}
                    />
                    {filteredFelder.map((f) => (
                      <FimFeldItem key={f.identifier} feld={f} />
                    ))}
                  </>
                ) : filteredGruppen.length === 0 ? (
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      color: 'text.disabled',
                      display: 'block',
                      py: 1,
                    }}
                  >
                    {fim.keineTreffer}
                  </Typography>
                ) : null}
              </>
            )}
          </>
        )}

        {/* Quellenangabe */}
        {!gruppenLoading && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              px: 1.5,
              mt: 1,
              mb: 0.5,
              color: 'text.disabled',
              fontSize: '0.65rem',
            }}
          >
            {fim.quelle}
          </Typography>
        )}
      </Collapse>
    </Box>
  );
}
