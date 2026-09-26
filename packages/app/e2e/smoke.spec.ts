/**
 * E2E-Smoke-Tests: sichern die Kernpfade des Editors gegen den
 * Produktions-Build ab — Laden, Drag & Drop (Kernfeature), Auto-Save,
 * Eigenschaften, Testmodus, Code-Modus (self-hosted Monaco) und Export.
 */
import { expect, type Locator, type Page, test } from '@playwright/test';

const STORAGE_KEY = 'jfd_fieldState_v1';

/**
 * HTML5-Drag&Drop für react-dnd: `dragTo` bleibt beim CDP-Drag hängen,
 * daher werden die DragEvents mit geteiltem DataTransfer direkt dispatcht
 * (react-dnd prüft `isTrusted` nicht).
 */
/**
 * Seltene Aktionen liegen seit dem Kopfzeilen-Umbau im Menü „Weitere"
 * (Code-Modus, Schema kopieren, Import/Export, Vorlagen, Metadaten,
 * Editorsprache).
 */
async function ausMenueWeitere(page: Page, eintrag: string) {
  await page.getByRole('button', { name: 'Weitere' }).click();
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
  await ausMenueWeitere(page, 'Code-Modus');

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

  // Seltene Aktionen liegen im Menü
  await page.getByRole('button', { name: 'Weitere' }).click();
  const menu = page.getByRole('menu');
  for (const eintrag of [
    'Code-Modus',
    'Schema kopieren',
    'Export / Import',
    'Vorlage laden',
    'Formular-Metadaten',
  ]) {
    await expect(menu.getByRole('menuitem', { name: eintrag })).toBeVisible();
  }
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

test('Export-Dialog öffnet mit Schema- und XDF-Tab', async ({ page }) => {
  await gotoSeeded(page);

  await ausMenueWeitere(page, 'Export / Import');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'XDF 2.0' })).toBeVisible();
});
