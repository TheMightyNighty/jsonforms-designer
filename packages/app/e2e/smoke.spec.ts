/**
 * E2E-Smoke-Tests: sichern die Kernpfade des Editors gegen den
 * Produktions-Build ab — Laden, Drag & Drop (Kernfeature), Auto-Save,
 * Eigenschaften, Vorschau, Code-Modus (self-hosted Monaco) und Export.
 */
import { expect, type Locator, type Page, test } from '@playwright/test';

const STORAGE_KEY = 'jfd_fieldState_v1';

/**
 * HTML5-Drag&Drop für react-dnd: `dragTo` bleibt beim CDP-Drag hängen,
 * daher werden die DragEvents mit geteiltem DataTransfer direkt dispatcht
 * (react-dnd prüft `isTrusted` nicht).
 */
async function dragAndDrop(page: Page, source: Locator, target: Locator) {
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await source.dispatchEvent('dragstart', { dataTransfer });
  await target.dispatchEvent('dragenter', { dataTransfer });
  await target.dispatchEvent('dragover', { dataTransfer });
  await target.dispatchEvent('drop', { dataTransfer });
  await source.dispatchEvent('dragend', { dataTransfer });
}

/** Vorbereiteter Zustand: ein Textfeld „Nachname" — macht die Tests für
 * Eigenschaften/Vorschau/Code/Export unabhängig vom DnD-Test. */
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
// Vorschau (JSONForms-Rendering)
// ---------------------------------------------------------------------------

test('Vorschau rendert das Formular als ausfüllbares JSONForms', async ({
  page,
}) => {
  await gotoSeeded(page);

  await page.getByRole('button', { name: 'Vorschau' }).click();
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
  await page.getByRole('button', { name: 'Code-Modus' }).click();

  // Monaco gerendert und mit dem Schema befüllt
  await expect(page.locator('.monaco-editor').first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator('.view-lines').first()).toContainText('Nachname');

  expect(cdnRequests).toEqual([]);
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

test('Export-Dialog öffnet mit Schema- und XDF-Tab', async ({ page }) => {
  await gotoSeeded(page);

  await page.getByRole('button', { name: 'Export / Import' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'XDF 2.0' })).toBeVisible();
});
