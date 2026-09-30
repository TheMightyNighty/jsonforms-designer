/**
 * E2E-Smoke-Tests: sichern die Kernpfade des Editors gegen den
 * Produktions-Build ab — Laden, Drag & Drop (Kernfeature), Auto-Save,
 * Eigenschaften, Testmodus, Code-Modus (self-hosted Monaco) und Export.
 */
import { fileURLToPath } from 'node:url';

import { expect, type Locator, type Page, test } from '@playwright/test';

const STORAGE_KEY = 'jfd_fieldState_v1';

/**
 * HTML5-Drag&Drop für react-dnd: `dragTo` bleibt beim CDP-Drag hängen,
 * daher werden die DragEvents mit geteiltem DataTransfer direkt dispatcht
 * (react-dnd prüft `isTrusted` nicht).
 */
/**
 * Die Befehle liegen in der Befehlsleiste: Datei · Bearbeiten · Ansicht ·
 * Formular.
 */
async function ausBefehlsleiste(page: Page, menue: string, eintrag: string) {
  await page.getByRole('button', { name: menue, exact: true }).click();
  await page.getByRole('menuitem', { name: eintrag }).click();
}

/**
 * Die Palette hat seit dem Umbau drei Reiter; „Bausteine" ist der Standard.
 * Die Katalog-Feldtypen liegen unter „Einzelfelder".
 */
async function oeffneEinzelfelder(page: Page) {
  await page.getByRole('tab', { name: 'Einzelfelder' }).click();
}

async function dragAndDrop(page: Page, source: Locator, target: Locator) {
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await source.dispatchEvent('dragstart', { dataTransfer });
  await target.dispatchEvent('dragenter', { dataTransfer });
  await target.dispatchEvent('dragover', { dataTransfer });
  await target.dispatchEvent('drop', { dataTransfer });
  await source.dispatchEvent('dragend', { dataTransfer });
}

/** Vorbereiteter Zustand: ein Textfeld „Nachname" — macht die Tests für
 * Eigenschaften/Testmodus/Code/Export unabhängig vom DnD-Test. */
const SEEDED_STATE = {
  schema: {
    type: 'object',
    properties: { nachname: { type: 'string', title: 'Nachname' } },
    required: [],
  },
  uiSchema: {
    type: 'VerticalLayout',
    elements: [{ type: 'Control', scope: '#/properties/nachname' }],
  },
  tabs: [],
  activeTabIndex: 0,
  tabAssignments: {},
  lineNumbersEnabled: false,
  sectionColors: {},
};

async function gotoSeeded(page: Page) {
  await page.addInitScript(([key, state]) => localStorage.setItem(key, state), [
    STORAGE_KEY,
    JSON.stringify(SEEDED_STATE),
  ] as const);
  await page.goto('/');
}

// ---------------------------------------------------------------------------
// Laden
// ---------------------------------------------------------------------------

test('App lädt mit Palette und leerem Formular', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('JSONForms Designer').first()).toBeVisible();
  // Standard-Reiter: Bausteine
  await expect(
    page.getByTestId('palette-baustein-baustein-antragsteller'),
  ).toBeVisible();
  await oeffneEinzelfelder(page);
  await expect(page.getByTestId('palette-item-text-short')).toBeVisible();
  await expect(page.getByTestId('field-row')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Drag & Drop (Kernfeature) + Auto-Save
// ---------------------------------------------------------------------------

test('Feld per Drag & Drop hinzufügen — überlebt Reload (Auto-Save)', async ({
  page,
}) => {
  await page.goto('/');
  await oeffneEinzelfelder(page);

  const source = page.getByTestId('palette-item-text-short');
  // Leeres Formular → EmptyEditor ist die Drop-Fläche
  await dragAndDrop(page, source, page.getByTestId('empty-editor-drop'));

  const row = page.getByTestId('field-row');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Textfeld');

  // Zweites Feld: jetzt existieren die regulären Drop-Zonen
  await dragAndDrop(
    page,
    page.getByTestId('palette-item-checkbox'),
    page.getByTestId('dropzone').last(),
  );
  await expect(page.getByTestId('field-row')).toHaveCount(2);

  // Auto-Save: nach Reload sind beide Felder noch da (localStorage-Adapter)
  await page.reload();
  await expect(page.getByTestId('field-row')).toHaveCount(2);
});

// ---------------------------------------------------------------------------
// Tastatur-Alternativpfad (BITV): Enter auf Palette-Eintrag fügt Feld hinzu
// ---------------------------------------------------------------------------

test('Feld per Tastatur hinzufügen (Enter auf Palette-Eintrag)', async ({
  page,
}) => {
  await page.goto('/');
  await oeffneEinzelfelder(page);

  const item = page.getByTestId('palette-item-text-short');
  await expect(item).toHaveRole('button');
  await item.focus();
  await page.keyboard.press('Enter');

  const row = page.getByTestId('field-row');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Textfeld');

  // Leertaste funktioniert ebenfalls
  await page.getByTestId('palette-item-checkbox').focus();
  await page.keyboard.press(' ');
  await expect(page.getByTestId('field-row')).toHaveCount(2);
});

// ---------------------------------------------------------------------------
// Palette: Reiter, Suche, Bausteine (auch per Tastatur)
// ---------------------------------------------------------------------------

test('Baustein per Tastatur einfügen legt eine benannte Gruppe an', async ({
  page,
}) => {
  await page.goto('/');

  const baustein = page.getByTestId('palette-baustein-baustein-anschrift');
  await expect(baustein).toHaveRole('button');
  await baustein.focus();
  await page.keyboard.press('Enter');

  // Der Baustein legt eine benannte Gruppe mit seinen Feldern an
  await expect(page.getByText('Anschrift').first()).toBeVisible();
  await expect(page.getByTestId('field-row')).toHaveCount(4);
});

test('Palette-Suche findet Bausteine und Einzelfelder über die Reiter hinweg', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('textbox', { name: /suchen/i }).fill('iban');

  // Der Baustein „Bankverbindung" enthält ein IBAN-Feld …
  await expect(
    page.getByTestId('palette-baustein-baustein-bankverbindung'),
  ).toBeVisible();
  // … und der Einzelfeldtyp IBAN steht ebenfalls im Ergebnis
  await expect(page.getByTestId('palette-item-iban')).toBeVisible();
  // Nicht passende Einträge sind ausgeblendet
  await expect(
    page.getByTestId('palette-baustein-baustein-antragsteller'),
  ).toHaveCount(0);
});

test('FIM-Datenfeldgruppe per Tastatur einfügen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'FIM' }).click();

  const gruppe = page.getByRole('button', { name: /Anschrift Inland/ }).first();
  await expect(gruppe).toBeVisible();
  await gruppe.focus();
  await page.keyboard.press('Enter');

  // Die Gruppe landet im Formular: die leere Editor-Fläche verschwindet und
  // die Aktion ist rücknehmbar. (Die Felder einer FIM-Gruppe liefert der
  // Mock-Dienst erst beim Ablegen nach — der Tastatur-Pfad verhält sich
  // exakt wie der Maus-Pfad, weil beide dieselbe Action erzeugen.)
  await expect(page.getByTestId('empty-editor-drop')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Rückgängig' })).toBeEnabled();
});

// ---------------------------------------------------------------------------
// Tastatur-Umsortieren (BITV): Alt+Pfeiltasten verschieben das Element
// ---------------------------------------------------------------------------

test('Felder per Alt+Pfeiltasten umsortieren', async ({ page }) => {
  await page.goto('/');
  await oeffneEinzelfelder(page);

  // Zwei Felder per Tastatur anlegen: Textfeld, dann Checkbox (Reihenfolge!)
  await page.getByTestId('palette-item-text-short').focus();
  await page.keyboard.press('Enter');
  await page.getByTestId('palette-item-checkbox').focus();
  await page.keyboard.press('Enter');

  const rows = page.getByTestId('field-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Textfeld');

  // Checkbox (Position 2) fokussieren und nach oben sortieren
  await rows.nth(1).focus();
  await page.keyboard.press('Alt+ArrowUp');
  await expect(page.getByTestId('field-row').first()).toContainText('Checkbox');

  // Und wieder nach unten
  await page.getByTestId('field-row').first().focus();
  await page.keyboard.press('Alt+ArrowDown');
  await expect(page.getByTestId('field-row').first()).toContainText('Textfeld');
});

// ---------------------------------------------------------------------------
// Eigenschaften bearbeiten
// ---------------------------------------------------------------------------

test('Label im Eigenschaften-Panel ändern aktualisiert das Formular', async ({
  page,
}) => {
  await gotoSeeded(page);

  await page.getByTestId('field-row').click();
  const panel = page.getByRole('form', { name: 'Feldeigenschaften' });
  // Accessible Name kommt aus inputProps.aria-label, nicht aus dem MUI-Label
  const labelInput = panel.getByLabel('Label des Feldes');
  await expect(labelInput).toHaveValue('Nachname');

  await labelInput.fill('Familienname');
  await expect(page.getByTestId('field-row')).toContainText('Familienname');
});

test('Eigenschaften stehen in den Reitern Inhalt, Prüfung, Bedingungen, Übersetzung', async ({
  page,
}) => {
  await gotoSeeded(page);
  await page.getByTestId('field-row').click();

  const panel = page.getByRole('form', { name: 'Feldeigenschaften' });
  for (const reiter of ['Inhalt', 'Prüfung', 'Bedingungen', 'Übersetzung']) {
    await expect(panel.getByRole('tab', { name: reiter })).toBeVisible();
  }

  // Reiter „Inhalt": Art des Feldes ist sichtbar und wechselbar
  await expect(panel.getByLabel('Art des Feldes ändern')).toBeVisible();

  // Reiter „Prüfung": am Textfeld bleibt die Steuer-ID-Prüfung übrig,
  // die E-Mail-Prüfung nicht.
  await panel.getByRole('tab', { name: 'Prüfung' }).click();
  await expect(panel.getByText('Steuer-ID')).toBeVisible();
  await expect(panel.getByText('E-Mail validieren')).toHaveCount(0);
});

test('Art des Feldes wechseln ändert das gerenderte Feld', async ({ page }) => {
  await gotoSeeded(page);
  await page.getByTestId('field-row').click();

  const panel = page.getByRole('form', { name: 'Feldeigenschaften' });
  await panel.getByLabel('Art des Feldes ändern').click();
  await page.getByRole('option', { name: 'Datum', exact: true }).click();

  // Das Feld wird jetzt als Datumsfeld gerendert, die Bezeichnung bleibt
  await expect(panel.getByLabel('Label des Feldes')).toHaveValue('Nachname');
  await expect(page.getByTestId('field-row')).toContainText('Nachname');
});

// ---------------------------------------------------------------------------
// Testmodus (JSONForms-Rendering)
// ---------------------------------------------------------------------------

test('Testmodus macht das Formular ausfüllbar', async ({ page }) => {
  await gotoSeeded(page);

  await page.getByRole('button', { name: 'Ausprobieren' }).click();
  const input = page.getByRole('textbox', { name: /Nachname/ });
  await expect(input).toBeVisible();
  await input.fill('Mustermann');
  await expect(input).toHaveValue('Mustermann');
});

// ---------------------------------------------------------------------------
// Code-Modus: self-hosted Monaco, kein CDN
// ---------------------------------------------------------------------------

test('Code-Modus lädt Monaco lokal — keine CDN-Requests', async ({ page }) => {
  const cdnRequests: string[] = [];
  page.on('request', (req) => {
    if (/jsdelivr|unpkg|cdnjs/.test(req.url())) cdnRequests.push(req.url());
  });

  await gotoSeeded(page);
  await ausBefehlsleiste(page, 'Ansicht', 'Code-Modus');

  // Monaco gerendert und mit dem Schema befüllt
  await expect(page.locator('.monaco-editor').first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator('.view-lines').first()).toContainText('Nachname');

  expect(cdnRequests).toEqual([]);
});

// ---------------------------------------------------------------------------
// Kopfzeile
// ---------------------------------------------------------------------------

test('Kopfzeile zeigt Formularname, Speicherstatus und das Menü „Weitere"', async ({
  page,
}) => {
  await gotoSeeded(page);

  const kopfzeile = page.getByRole('banner').first();
  // Speicherstatus: Der Editor speichert beim Start automatisch.
  await expect(kopfzeile).toContainText('Entwurf');
  await expect(kopfzeile).toContainText('gespeichert vor');

  // Hauptaktion und Rückgängig/Wiederholen sind beschriftet, nicht nur Symbol
  await expect(
    page.getByRole('button', { name: 'Ausprobieren' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rückgängig' })).toBeVisible();

  // Die Befehlsleiste trägt die Klassiker
  for (const menue of ['Datei', 'Bearbeiten', 'Ansicht', 'Formular']) {
    await expect(
      page.getByRole('button', { name: menue, exact: true }),
    ).toBeVisible();
  }

  await page.getByRole('button', { name: 'Datei', exact: true }).click();
  const dateiMenue = page.getByRole('menu');
  for (const eintrag of [
    'Neues Formular',
    'Öffnen …',
    'Speichern',
    'Speichern unter …',
    'Vorlage laden',
    'Export / Import',
  ]) {
    await expect(
      dateiMenue.getByRole('menuitem', { name: eintrag, exact: true }),
    ).toBeVisible();
  }
});

test('Befehlsleiste öffnet ihre Menüs beim Überfahren mit der Maus', async ({
  page,
}) => {
  await gotoSeeded(page);

  await page.getByRole('button', { name: 'Datei', exact: true }).hover();
  const menue = page.getByRole('menu');
  await expect(
    menue.getByRole('menuitem', { name: 'Neues Formular', exact: true }),
  ).toBeVisible();

  // Über den Nachbarknopf wechselt die Klappe ohne Klick
  await page.getByRole('button', { name: 'Ansicht', exact: true }).hover();
  await expect(
    menue.getByRole('menuitem', { name: 'Code-Modus' }),
  ).toBeVisible();
  await expect(page.getByRole('menu')).toHaveCount(1);

  // Maus weg von Leiste und Klappe → Klappe schließt von selbst
  await page.mouse.move(600, 500);
  await expect(page.getByRole('menu')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Formular-Verwaltung (ADR 0006)
// ---------------------------------------------------------------------------

test('Neues Formular legt ein zweites an, ohne das erste zu verlieren', async ({
  page,
}) => {
  await gotoSeeded(page);
  await expect(page.getByTestId('field-row')).toHaveCount(1);

  await ausBefehlsleiste(page, 'Datei', 'Neues Formular');

  // Das neue Formular ist leer …
  await expect(page.getByTestId('field-row')).toHaveCount(0);
  await expect(page.getByTestId('empty-editor-drop')).toBeVisible();

  // … und das alte liegt weiterhin in der Ablage.
  await ausBefehlsleiste(page, 'Datei', 'Zuletzt bearbeitet');
  const dialog = page.getByTestId('ablage-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Unbenanntes Formular')).toHaveCount(2);
});

test('Formular speichern unter, wechseln und wieder öffnen', async ({
  page,
}) => {
  await gotoSeeded(page);

  // Formular benennen (der Name ist der Titel)
  await page.getByTestId('formular-menue').click();
  await page.getByLabel('Name des Formulars').fill('Wohngeld');
  await page.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(page.getByTestId('formular-menue')).toContainText('Wohngeld');

  // Neues Formular anlegen
  await ausBefehlsleiste(page, 'Datei', 'Neues Formular');
  await expect(page.getByTestId('field-row')).toHaveCount(0);

  // Zurück zum ersten Formular — der Inhalt ist noch da
  await ausBefehlsleiste(page, 'Datei', 'Zuletzt bearbeitet');
  await page
    .getByTestId('ablage-dialog')
    .getByRole('button', { name: /^Wohngeld / })
    .click();
  await expect(page.getByTestId('field-row')).toHaveCount(1);
  await expect(page.getByTestId('field-row')).toContainText('Nachname');
});

test('Formular umbenennen ändert Name und Titel', async ({ page }) => {
  await gotoSeeded(page);

  // Der Name ist dort änderbar, wo er steht
  await page.getByTestId('formular-menue').click();
  await page.getByLabel('Name des Formulars').fill('Antrag auf Elterngeld');
  await page.getByRole('button', { name: 'Übernehmen' }).click();

  await expect(page.getByTestId('formular-menue')).toContainText(
    'Antrag auf Elterngeld',
  );
});

test('Formular löschen fragt vorher nach', async ({ page }) => {
  await gotoSeeded(page);
  await page.getByTestId('formular-menue').click();
  await page.getByLabel('Name des Formulars').fill('Weg damit');
  await page.getByRole('button', { name: 'Übernehmen' }).click();

  await ausBefehlsleiste(page, 'Datei', 'Zuletzt bearbeitet');
  await page.getByRole('button', { name: /Löschen: Weg damit/ }).click();

  // Rückfrage, weil Löschen nicht über Rückgängig zurückzuholen ist
  await expect(page.getByText('Formular löschen?')).toBeVisible();
  await page.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(
    page.getByTestId('ablage-dialog').getByText('Weg damit'),
  ).toBeVisible();
});

// ---------------------------------------------------------------------------
// Qualitäts-Ampel
// ---------------------------------------------------------------------------

test('Qualitäts-Ampel zählt Befunde und führt zum betroffenen Feld', async ({
  page,
}) => {
  await gotoSeeded(page);

  // Das vorbereitete Formular hat ein Feld, aber keinen Titel und keine
  // Rechtsgrundlage — am ganz leeren Formular schweigt die Ampel.
  const ampel = page.getByTestId('qualitaets-ampel');
  await expect(ampel).toBeVisible();
  await ampel.click();

  const liste = page.getByRole('dialog').or(page.getByRole('presentation'));
  await expect(liste.getByText('Das Formular hat keinen Titel.')).toBeVisible();

  // Ein Feld ohne Bezeichnung erzeugt einen Eintrag, der zum Feld führt
  await page.keyboard.press('Escape');
  await page.getByTestId('field-row').click();
  const panel = page.getByRole('form', { name: 'Feldeigenschaften' });
  await panel.getByLabel('Label des Feldes').fill('');

  await ampel.click();
  const eintrag = page.getByText('hat keine Bezeichnung');
  await expect(eintrag).toBeVisible();
  await eintrag.click();
  await expect(panel.getByLabel('Label des Feldes')).toBeVisible();
});

// ---------------------------------------------------------------------------
// Typvorschlag
// ---------------------------------------------------------------------------

test('Typvorschlag erscheint bei abweichender Bezeichnung und lässt sich übernehmen', async ({
  page,
}) => {
  await gotoSeeded(page);
  await page.getByTestId('field-row').click();

  const panel = page.getByRole('form', { name: 'Feldeigenschaften' });
  await panel.getByLabel('Label des Feldes').fill('Geburtsdatum');

  const hinweis = page.getByTestId('typvorschlag-hinweis');
  await expect(hinweis).toContainText('Datum');

  await hinweis.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(panel.getByLabel('Art des Feldes ändern')).toContainText(
    'Datum',
  );
  await expect(page.getByTestId('typvorschlag-hinweis')).toHaveCount(0);
});

test('Typvorschlag lässt sich ignorieren und bleibt nach Reload weg', async ({
  page,
}) => {
  await gotoSeeded(page);
  await page.getByTestId('field-row').click();

  const panel = page.getByRole('form', { name: 'Feldeigenschaften' });
  await panel.getByLabel('Label des Feldes').fill('Geburtsdatum');
  await page
    .getByTestId('typvorschlag-hinweis')
    .getByRole('button', { name: 'Ignorieren' })
    .click();
  await expect(page.getByTestId('typvorschlag-hinweis')).toHaveCount(0);

  // Die Entscheidung liegt im gespeicherten Stand, nicht nur im Speicher
  await page.reload();
  await page.getByTestId('field-row').click();
  await expect(page.getByTestId('typvorschlag-hinweis')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Geräte-Ansicht (Prototyp hinter Feature-Flag, ADR 0003)
// ---------------------------------------------------------------------------

test('Geräte-Ansicht ist ohne Flag nicht vorhanden', async ({ page }) => {
  await gotoSeeded(page);
  await expect(page.getByTestId('canvas-geraet')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Handy' })).toHaveCount(0);
});

test('Geräte-Ansicht mit Flag: Umschalten verengt die Fläche, Auswahl bleibt', async ({
  page,
}) => {
  await page.addInitScript(([key, state]) => localStorage.setItem(key, state), [
    STORAGE_KEY,
    JSON.stringify(SEEDED_STATE),
  ] as const);
  await page.goto('/?geraeteansicht=1');

  const canvas = page.getByTestId('canvas-geraet');
  await expect(canvas).toHaveAttribute('data-geraet', 'desktop');
  const breiteDesktop = (await canvas.boundingBox())!.width;

  await page.getByRole('button', { name: 'Handy' }).click();
  await expect(canvas).toHaveAttribute('data-geraet', 'handy');
  const breiteHandy = (await canvas.boundingBox())!.width;
  expect(breiteHandy).toBeLessThan(breiteDesktop);

  // Auswahl per Overlay funktioniert auch in der schmalen Ansicht
  await page.getByTestId('field-row').click();
  await expect(
    page.getByRole('form', { name: 'Feldeigenschaften' }),
  ).toBeVisible();
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

test('Export-Dialog öffnet mit Schema- und XDF-Tab', async ({ page }) => {
  await gotoSeeded(page);

  await ausBefehlsleiste(page, 'Datei', 'Export / Import');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'XDF 2.0' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Erweiterungen (ADR 0007)
// ---------------------------------------------------------------------------

const PAKET_DATEI = fileURLToPath(
  new URL('../../../beispiele/erweiterungen/musterstadt.json', import.meta.url),
);

test('Erweiterungspaket hinzufügen: Feldtyp, Baustein und Begriff wirken', async ({
  page,
}) => {
  await gotoSeeded(page);

  await ausBefehlsleiste(page, 'Ansicht', 'Erweiterungen');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Noch keine Erweiterung')).toBeVisible();

  await dialog.locator('input[type=file]').setInputFiles(PAKET_DATEI);

  // Der Dialog muss offen bleiben: Das Hinzufügen ändert die Texte des
  // Editors, und wenn davon die Kopfzeile neu eingehängt wird, verliert sie
  // ihren Dialogzustand — die Redakteurin sähe ihr Paket nie in der Liste.
  await expect(dialog.getByText('Musterstadt 1.0.0')).toBeVisible();

  await dialog.getByRole('button', { name: 'Schließen' }).click();

  // Begriff aus dem Paket ersetzt den Produktnamen in der Kopfzeile.
  await expect(page.getByText('Antragsdesigner Musterstadt')).toBeVisible();

  // Feldtyp aus dem Paket steht in der Palette und lässt sich einfügen.
  await oeffneEinzelfelder(page);
  await page.getByRole('button', { name: /Weitere Feldtypen/ }).click();
  const neuerTyp = page.getByTestId('palette-item-kfz-kennzeichen');
  await expect(neuerTyp).toHaveAttribute(
    'aria-label',
    'Kfz-Kennzeichen hinzufügen',
  );
  await neuerTyp.press('Enter');
  // Das Feld steht im Formular; Label und Legende tragen denselben Text.
  await expect(
    page.getByRole('main').getByText('Kennzeichen', { exact: true }).first(),
  ).toBeVisible();

  // Baustein aus dem Paket steht neben denen des Dienstes.
  await page.getByRole('tab', { name: 'Bausteine' }).click();
  await expect(page.getByText('Fahrzeug', { exact: true })).toBeVisible();
});

test('Erweiterung abschalten nimmt ihre Beiträge wieder zurück', async ({
  page,
}) => {
  await gotoSeeded(page);

  await ausBefehlsleiste(page, 'Ansicht', 'Erweiterungen');
  const dialog = page.getByRole('dialog');
  await dialog.locator('input[type=file]').setInputFiles(PAKET_DATEI);
  await expect(dialog.getByText('Musterstadt 1.0.0')).toBeVisible();

  await dialog.getByRole('switch').first().click();
  await dialog.getByRole('button', { name: 'Schließen' }).click();

  await expect(page.getByText('Antragsdesigner Musterstadt')).toHaveCount(0);
  await oeffneEinzelfelder(page);
  await page.getByRole('button', { name: /Weitere Feldtypen/ }).click();
  await expect(page.getByTestId('palette-item-kfz-kennzeichen')).toHaveCount(0);
});
