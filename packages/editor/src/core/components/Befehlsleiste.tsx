/**
 * Befehlsleiste: Datei · Bearbeiten · Ansicht · Formular.
 *
 * Vorher lagen die Befehle verstreut — die Formular-Verwaltung hinter dem
 * Formularnamen, alles Übrige in einer Sammelklappe „Weitere". Gesucht
 * wurde beides dort, wo man es aus einem Schreibprogramm kennt: in einer
 * Menüleiste, und „Öffnen" auch mit einer Datei aus einem Verzeichnis.
 *
 * Abweichung von ADR 0002 / Arbeitspaket 2, das genau eine Sammelklappe
 * vorsah — bewusst, nach Rückmeldung aus der Erprobung.
 */
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Snackbar from '@mui/material/Snackbar';
import { useEffect, useRef, useState } from 'react';

import { EditorMode } from '../../editor/editorMode';
import { ErweiterungenDialog } from '../../erweiterung/ErweiterungenDialog';
import { FormTemplate } from '../../field-types/formTemplates';
import { TemplatePickerDialog } from '../../field-types/TemplatePickerDialog';
import { useI18n } from '../../i18n';
import {
  DateiHandle,
  oeffneFormularDatei,
  speichereFormularDatei,
  unterstuetztDateiSystem,
} from '../api/dateiZugriff';
import { useEditorContext, useUndoRedo } from '../context';
import {
  createLoadTemplateAction,
  createSetFieldStateAction,
  createSetFormMetadataAction,
  createToggleLineNumbersAction,
} from '../model/addFieldActions';
import { copyToClipBoard } from '../util/clipboard';
import {
  dateinameFuer,
  formularAlsJson,
  leseFormularDatei,
  nameAusDateiname,
} from '../util/formularDatei';
import {
  FormularAblageDialog,
  FormularNameDialog,
} from './FormularAblageDialog';
import {
  AnleitungDialog,
  LizenzDialog,
  TastaturDialog,
  tippBeimStartAktiv,
  TippDialog,
  UeberDialog,
} from './HilfeDialoge';
import { ImportExportDialog } from './ImportExportDialog';
import { MetadataDialog } from './MetadataDialog';

interface BefehlsleisteProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

/** Wie lange die Klappe nach Verlassen mit der Maus noch stehen bleibt. */
const SCHLIESS_VERZOEGERUNG_MS = 150;

/**
 * Ein Menü der Leiste — Knopf plus zugehörige Klappe.
 *
 * Die Klappe öffnet beim Überfahren mit der Maus und schließt, sobald die
 * Maus Knopf und Klappe verlassen hat; die kurze Verzögerung überbrückt
 * den Weg vom Knopf in die Klappe. Klick und Tastatur öffnen sie ebenso
 * (Touch, Bedienung ohne Maus). Die Klappe ist nicht modal, damit der
 * Mauszeiger die übrigen Knöpfe der Leiste weiter erreicht. Ein Klick
 * auf einen Eintrag schließt die Klappe.
 */
function LeistenMenue({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const [anker, setAnker] = useState<null | HTMLElement>(null);
  // Per Klick/Tastatur geöffnet → erster Eintrag bekommt den Fokus;
  // beim Überfahren bleibt der Fokus, wo er ist.
  const [fokusInKlappe, setFokusInKlappe] = useState(false);
  const schliessTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const abbrechenSchliessen = () => clearTimeout(schliessTimer.current);
  const schliessen = () => {
    abbrechenSchliessen();
    setAnker(null);
  };
  const spaeterSchliessen = () => {
    abbrechenSchliessen();
    schliessTimer.current = setTimeout(
      () => setAnker(null),
      SCHLIESS_VERZOEGERUNG_MS,
    );
  };
  useEffect(() => abbrechenSchliessen, []);

  const oeffnen = (knopf: HTMLElement, mitFokus: boolean) => {
    abbrechenSchliessen();
    setAnker(knopf);
    setFokusInKlappe(mitFokus);
  };

  return (
    <>
      <Button
        size="small"
        onMouseEnter={(e) => oeffnen(e.currentTarget, false)}
        onMouseLeave={spaeterSchliessen}
        onClick={(e) => oeffnen(e.currentTarget, true)}
        aria-haspopup="menu"
        aria-expanded={anker ? true : undefined}
        sx={{
          color: 'text.primary',
          fontWeight: 400,
          textTransform: 'none',
          minWidth: 0,
          px: 1.25,
          ...(anker && { bgcolor: 'action.hover' }),
        }}
      >
        {name}
      </Button>
      <Popper
        open={Boolean(anker)}
        anchorEl={anker}
        placement="bottom-start"
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        <Paper
          elevation={8}
          onMouseEnter={abbrechenSchliessen}
          onMouseLeave={spaeterSchliessen}
        >
          <ClickAwayListener
            onClickAway={(e) => {
              if (!anker?.contains(e.target as Node)) schliessen();
            }}
          >
            <MenuList
              autoFocusItem={fokusInKlappe}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('[role="menuitem"]'))
                  schliessen();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || e.key === 'Tab') {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    anker?.focus();
                  }
                  schliessen();
                }
              }}
            >
              {children}
            </MenuList>
          </ClickAwayListener>
        </Paper>
      </Popper>
    </>
  );
}

export function Befehlsleiste({ mode, onModeChange }: BefehlsleisteProps) {
  const { dispatch, fieldState, formularAblage, reportError } =
    useEditorContext();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const { t, locale, setLocale } = useI18n();

  const [exportOpen, setExportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [ablageOffen, setAblageOffen] = useState(false);
  const [nameDialog, setNameDialog] = useState<
    null | 'speichernAls' | 'umbenennen'
  >(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [erweiterungenOffen, setErweiterungenOffen] = useState(false);
  const [hilfeDialog, setHilfeDialog] = useState<
    null | 'anleitung' | 'tastatur' | 'tipp' | 'ueber' | 'lizenzen'
  >(
    // „Tipp des Tages" beim Start — nur wenn ausdrücklich eingeschaltet.
    // Default ist aus: Ein Fenster, das ungefragt aufgeht, ist eine
    // Zumutung, kein Service.
    () => (tippBeimStartAktiv() ? 'tipp' : null),
  );

  // Handle der zuletzt geöffneten Datei: Wo der Browser es hergibt,
  // schreibt „Als Datei speichern" damit in dieselbe Datei zurück.
  const [dateiHandle, setDateiHandle] = useState<DateiHandle | undefined>();

  const isCode = mode === 'code';
  const lineNumbers = fieldState.lineNumbersEnabled;
  const formularName = (fieldState.schema as { title?: string }).title ?? '';

  const handleCopySchema = () =>
    copyToClipBoard(
      JSON.stringify(
        { schema: fieldState.schema, uiSchema: fieldState.uiSchema },
        null,
        2,
      ),
    );

  async function ausDateiOeffnen() {
    try {
      const datei = await oeffneFormularDatei();
      if (!datei) return; // abgebrochen — kein Fehler
      const geladen = leseFormularDatei(datei.inhalt);
      if (!geladen) {
        setFehler(t.header.ablage.dateiFehler);
        return;
      }
      setDateiHandle(datei.handle);
      dispatch(createSetFieldStateAction(geladen));
      // Die Datei wird zugleich ein Formular in der Ablage, damit sie
      // nicht beim nächsten „Neues Formular" verloren geht.
      const name =
        (geladen.schema as { title?: string }).title?.trim() ||
        nameAusDateiname(datei.name);
      formularAblage?.speichernAls(name);
    } catch (err) {
      reportError(err, 'Formular konnte nicht aus der Datei geladen werden');
      setFehler(t.header.ablage.dateiFehler);
    }
  }

  /**
   * `neuerOrt = false` („Speichern") schreibt in die zuletzt geöffnete
   * Datei zurück, sofern der Browser das hergibt — sonst verhält es sich
   * wie „Speichern unter".
   */
  async function alsDateiSpeichern(neuerOrt: boolean) {
    try {
      const neues = await speichereFormularDatei(
        dateinameFuer(fieldState),
        formularAlsJson(fieldState),
        neuerOrt ? undefined : dateiHandle,
      );
      if (neues) setDateiHandle(neues);
      setHinweis(t.header.ablage.gespeichert);
    } catch (err) {
      reportError(err, 'Formular konnte nicht als Datei gespeichert werden');
    }
  }

  return (
    <>
      <Box
        component="nav"
        aria-label={t.header.weitere}
        sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}
      >
        {/* ── Datei ─────────────────────────────────────────────────── */}
        <LeistenMenue name={t.header.menue.datei}>
          {[
            formularAblage && (
              <MenuItem
                key="neu"
                onClick={() => {
                  formularAblage.neu();
                  setDateiHandle(undefined);
                }}
              >
                <ListItemText>{t.header.ablage.neu}</ListItemText>
              </MenuItem>
            ),
            // „Öffnen" heißt: Datei aus einem Verzeichnis wählen — der
            // Dialog des Betriebssystems, wie man ihn kennt.
            <MenuItem
              key="oeffnen"
              onClick={() => {
                void ausDateiOeffnen();
              }}
            >
              <ListItemText>{t.header.ablage.oeffnenDatei}</ListItemText>
            </MenuItem>,
            formularAblage && (
              <MenuItem
                key="zuletzt"
                onClick={() => {
                  setAblageOffen(true);
                }}
              >
                <ListItemText>{t.header.ablage.zuletzt}</ListItemText>
              </MenuItem>
            ),
            <Divider key="t1" />,
            <MenuItem
              key="speichern"
              onClick={() => {
                void alsDateiSpeichern(false);
              }}
            >
              <ListItemText>{t.header.ablage.speichern}</ListItemText>
            </MenuItem>,
            <MenuItem
              key="speichernUnter"
              onClick={() => {
                void alsDateiSpeichern(true);
              }}
            >
              <ListItemText>{t.header.ablage.speichernUnter}</ListItemText>
            </MenuItem>,
            <Divider key="t2" />,
            <MenuItem
              key="vorlage"
              onClick={() => {
                setTemplateOpen(true);
              }}
            >
              <ListItemText>{t.header.template}</ListItemText>
            </MenuItem>,
            <MenuItem
              key="importExport"
              onClick={() => {
                setExportOpen(true);
              }}
            >
              <ListItemText>{t.header.exportImport}</ListItemText>
            </MenuItem>,
          ]}
        </LeistenMenue>

        {/* ── Bearbeiten ────────────────────────────────────────────── */}
        <LeistenMenue name={t.header.menue.bearbeiten}>
          {[
            <MenuItem
              key="undo"
              disabled={!canUndo}
              onClick={() => {
                undo();
              }}
            >
              <ListItemText>{t.header.undo}</ListItemText>
            </MenuItem>,
            <MenuItem
              key="redo"
              disabled={!canRedo}
              onClick={() => {
                redo();
              }}
            >
              <ListItemText>{t.header.redo}</ListItemText>
            </MenuItem>,
            formularAblage && <Divider key="t1" />,
            formularAblage && (
              <MenuItem
                key="umbenennen"
                onClick={() => {
                  setNameDialog('umbenennen');
                }}
              >
                <ListItemText>{t.header.ablage.umbenennen}</ListItemText>
              </MenuItem>
            ),
          ]}
        </LeistenMenue>

        {/* ── Ansicht ───────────────────────────────────────────────── */}
        <LeistenMenue name={t.header.menue.ansicht}>
          {[
            <MenuItem
              key="code"
              onClick={() => {
                onModeChange(isCode ? 'visual' : 'code');
              }}
            >
              <ListItemText>
                {isCode ? t.header.codeModeOff : t.header.codeModeOn}
              </ListItemText>
            </MenuItem>,
            <MenuItem
              key="zeilen"
              onClick={() => {
                dispatch(createToggleLineNumbersAction());
              }}
            >
              <ListItemText>
                {t.header.zeilennummern}
                {lineNumbers ? ' ✓' : ''}
              </ListItemText>
            </MenuItem>,
            <Divider key="t1" />,
            <MenuItem
              key="erweiterungen"
              onClick={() => {
                setErweiterungenOffen(true);
              }}
            >
              <ListItemText>{t.erweiterungen.menue}</ListItemText>
            </MenuItem>,
            <MenuItem
              key="sprache"
              onClick={() => {
                setLocale(locale === 'de' ? 'en' : 'de');
              }}
            >
              <ListItemText>
                {t.header.sprache}: {locale.toUpperCase()}
              </ListItemText>
            </MenuItem>,
          ]}
        </LeistenMenue>

        {/* ── Formular ──────────────────────────────────────────────── */}
        <LeistenMenue name={t.header.menue.formular}>
          {[
            <MenuItem
              key="meta"
              onClick={() => {
                setMetaOpen(true);
              }}
            >
              <ListItemText>{t.header.metadaten}</ListItemText>
            </MenuItem>,
            <MenuItem
              key="copy"
              onClick={() => {
                handleCopySchema();
              }}
            >
              <ListItemText>{t.header.copySchema}</ListItemText>
            </MenuItem>,
          ]}
        </LeistenMenue>

        {/* ── Hilfe ─────────────────────────────────────────────────── */}
        <LeistenMenue name={t.header.menue.hilfe}>
          {(
            [
              ['anleitung', t.header.hilfe.anleitung],
              ['tastatur', t.header.hilfe.tastatur],
              ['tipp', t.header.hilfe.tipp],
              ['trenner', ''],
              ['ueber', t.header.hilfe.ueber],
              ['lizenzen', t.header.hilfe.lizenzen],
            ] as const
          ).map(([schluessel, beschriftung]) =>
            schluessel === 'trenner' ? (
              <Divider key="trenner" />
            ) : (
              <MenuItem
                key={schluessel}
                onClick={() => {
                  setHilfeDialog(schluessel);
                }}
              >
                <ListItemText>{beschriftung}</ListItemText>
              </MenuItem>
            ),
          )}
        </LeistenMenue>
      </Box>

      {/* ── Dialoge ──────────────────────────────────────────────────── */}
      {formularAblage && (
        <>
          <FormularAblageDialog
            open={ablageOffen}
            onClose={() => setAblageOffen(false)}
            ablage={formularAblage}
          />
          <FormularNameDialog
            open={nameDialog !== null}
            titel={
              nameDialog === 'speichernAls'
                ? t.header.ablage.speichernAls
                : t.header.ablage.umbenennen
            }
            startwert={formularName}
            onClose={() => setNameDialog(null)}
            onBestaetigen={(name) => {
              if (nameDialog === 'speichernAls')
                formularAblage.speichernAls(name);
              else formularAblage.umbenennen(name);
            }}
          />
        </>
      )}

      <ErweiterungenDialog
        offen={erweiterungenOffen}
        onSchliessen={() => setErweiterungenOffen(false)}
      />

      <ImportExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        fieldState={fieldState}
        onImport={(state) => {
          dispatch(createSetFieldStateAction(state));
          setExportOpen(false);
        }}
      />

      <TemplatePickerDialog
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onSelect={(tpl: FormTemplate) =>
          dispatch(createLoadTemplateAction(tpl.state))
        }
      />

      <MetadataDialog
        open={metaOpen}
        onClose={() => setMetaOpen(false)}
        schema={fieldState.schema}
        manifestMeta={fieldState.manifestMeta}
        onSave={(meta) => dispatch(createSetFormMetadataAction(meta))}
      />

      <AnleitungDialog
        open={hilfeDialog === 'anleitung'}
        onClose={() => setHilfeDialog(null)}
      />
      <TastaturDialog
        open={hilfeDialog === 'tastatur'}
        onClose={() => setHilfeDialog(null)}
      />
      <TippDialog
        open={hilfeDialog === 'tipp'}
        onClose={() => setHilfeDialog(null)}
      />
      <UeberDialog
        open={hilfeDialog === 'ueber'}
        onClose={() => setHilfeDialog(null)}
      />
      <LizenzDialog
        open={hilfeDialog === 'lizenzen'}
        onClose={() => setHilfeDialog(null)}
      />

      <Snackbar
        open={hinweis !== null}
        autoHideDuration={3000}
        onClose={() => setHinweis(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setHinweis(null)}>
          {hinweis}
        </Alert>
      </Snackbar>

      <Snackbar
        open={fehler !== null}
        autoHideDuration={8000}
        onClose={() => setFehler(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setFehler(null)}>
          {fehler}
        </Alert>
      </Snackbar>
    </>
  );
}

/** Nur für Tests/Diagnose: Welcher Datei-Weg steht zur Verfügung? */
export const dateiSystemVerfuegbar = unterstuetztDateiSystem;
