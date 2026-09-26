import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { FIELD_TYPE_CATALOG } from '../../editor/src/field-types/fieldTypes';

/**
 * Die Tabler-Icon-Font ist in der App vendored (nur woff2 + getrimmtes CSS).
 * Ein Katalog-Eintrag, dessen Symbolname dort fehlt, rendert eine leere
 * Fläche — genau so fehlte am Feldtyp „Mehrfachauswahl" das Symbol
 * (`ti-checkboxes` existiert in dieser Schriftversion nicht).
 *
 * Der Test läuft in der App, weil nur sie die Schrift kennt; den Katalog
 * liest er aus den Editor-Quellen statt aus dem gebauten Paket, damit er
 * nicht von einem veralteten dist-Verzeichnis abhängt.
 */
const CSS_PFAD = fileURLToPath(
  new URL('./assets/tabler-icons/tabler-icons.min.css', import.meta.url),
);

const verfuegbareSymbole = new Set(
  Array.from(
    readFileSync(CSS_PFAD, 'utf-8').matchAll(/\.ti-([a-z0-9-]+):/g),
    (treffer) => treffer[1],
  ),
);

describe('Symbole des Feldtyp-Katalogs', () => {
  it('kennt überhaupt Symbole aus dem vendorten CSS', () => {
    expect(verfuegbareSymbole.size).toBeGreaterThan(100);
  });

  it.each(FIELD_TYPE_CATALOG.map((f) => [f.id, f.icon]))(
    'Feldtyp „%s" verweist mit „%s" auf ein vorhandenes Symbol',
    (_id, icon) => {
      expect(verfuegbareSymbole.has(icon)).toBe(true);
    },
  );
});
