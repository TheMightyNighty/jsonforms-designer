/**
 * Generator für die README-Screenshots (docs/*.png).
 *
 * Läuft NUR auf Anforderung:
 *   npm run build && GEN_SCREENSHOTS=1 npx playwright test screenshots.gen
 *
 * FIM-Antworten werden gemockt, damit die Bilder deterministisch und ohne
 * Netzzugriff entstehen.
 */
import { expect, type Page, test } from '@playwright/test';

test.skip(
  !process.env.GEN_SCREENSHOTS,
  'Nur mit GEN_SCREENSHOTS=1 ausführen (Screenshot-Generator, kein Test)',
);

const DOCS = '../../docs';

const DEMO_STATE = {
  schema: {
    type: 'object',
    title: 'Antrag auf Wohngeld',
    'x-publisher': 'Wohngeldstelle Musterstadt',
    properties: {
      vorname: { type: 'string', title: 'Vorname' },
      nachname: { type: 'string', title: 'Nachname' },
      geburtsdatum: { type: 'string', format: 'date', title: 'Geburtsdatum' },
      iban: {
        type: 'string',
        title: 'IBAN',
        pattern: '^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$',
      },
      einverstanden: {
        type: 'boolean',
        title: 'Datenschutzerklärung gelesen',
      },
    },
    required: ['vorname', 'nachname'],
  },
  uiSchema: {
    type: 'VerticalLayout',
    elements: [
      {
        id: 'col_demo',
        type: 'ColumnContainer',
        widths: [1, 1],
        columns: [
          [{ id: 'c1', type: 'Control', scope: '#/properties/vorname' }],
          [{ id: 'c2', type: 'Control', scope: '#/properties/nachname' }],
        ],
      },
      { type: 'Control', scope: '#/properties/geburtsdatum' },
      { type: 'Control', scope: '#/properties/iban' },
      { type: 'Control', scope: '#/properties/einverstanden' },
    ],
  },
  tabs: [],
  activeTabIndex: 0,
  tabAssignments: {},
  lineNumbersEnabled: false,
  sectionColors: {},
};

const FIM_GROUPS = {
  items: [
    {
      fim_id: 'G60000086',
      fim_version: '1.2',
      name: 'Anschrift Inland',
      beschreibung: 'Straße, Hausnummer, PLZ, Ort',
    },
    {
      fim_id: 'G60000090',
      fim_version: '1.0',
      name: 'Natürliche Person (Basisdaten)',
      beschreibung: 'Name, Vorname, Geburtsdatum',
    },
  ],
};

const FIM_FIELDS = {
  items: [
    {
      fim_id: 'F60000227',
      fim_version: '1.1',
      name: 'Familienname',
      beschreibung: 'Nachname der Person',
      datentyp: 'text',
    },
    {
      fim_id: 'F60000240',
      fim_version: '1.0',
      name: 'Geburtsdatum',
      beschreibung: 'Tag der Geburt',
      datentyp: 'date',
    },
  ],
};

async function gotoDemo(page: Page) {
  await page.route('**/fimportal.de/api/v1/groups**', (route) =>
    route.fulfill({ json: FIM_GROUPS }),
  );
  await page.route('**/fimportal.de/api/v1/fields**', (route) =>
    route.fulfill({ json: FIM_FIELDS }),
  );
  await page.addInitScript(([key, state]) => localStorage.setItem(key, state), [
    'jfd_fieldState_v1',
    JSON.stringify(DEMO_STATE),
  ] as const);
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/');
  await expect(page.getByTestId('field-row').first()).toBeVisible();
}

test('screenshot: visueller Modus', async ({ page }) => {
  await gotoDemo(page);
  // Feld selektieren, damit das Eigenschaften-Panel gefüllt ist
  await page.getByTestId('field-row').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DOCS}/screenshot-visual.png` });
});

test('screenshot: Code-Modus', async ({ page }) => {
  await gotoDemo(page);
  await page.getByRole('button', { name: 'Code-Modus' }).click();
  await expect(page.locator('.view-lines').first()).toContainText('Wohngeld', {
    timeout: 15_000,
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${DOCS}/screenshot-code.png` });
});

test('screenshot: FIM-Bausteine', async ({ page }) => {
  await gotoDemo(page);
  // FIM-Sektion aufklappen, falls sie nicht schon offen ist
  const fimItem = page.getByText('Anschrift Inland').first();
  if (!(await fimItem.isVisible().catch(() => false))) {
    await page.getByText('FIM-Bausteine', { exact: false }).first().click();
  }
  await expect(fimItem).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DOCS}/screenshot-fim.png` });
});
