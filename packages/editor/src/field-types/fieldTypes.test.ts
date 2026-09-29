/**
 * F-1: Tests für den Feldtypen-Katalog
 *
 * Prüft Vollständigkeit, Struktur und Hilfsfunktionen.
 * Test-Runner: Vitest (wie im migrierten Stack).
 */

import { describe, expect, it } from 'vitest';

import { de } from '../i18n/de';
import { en } from '../i18n/en';
import type { EditorTranslations } from '../i18n/types';
import {
  FIELD_GROUPS,
  FIELD_TYPE_CATALOG,
  type FieldTypeDefinition,
  getFieldType,
  getFieldTypesByGroup,
} from './fieldTypes';

// ---------------------------------------------------------------------------
// Strukturprüfung für jeden Katalogeintrag
// ---------------------------------------------------------------------------

describe('FIELD_TYPE_CATALOG — Vollständigkeit', () => {
  it('enthält mindestens einen Eintrag pro Gruppe', () => {
    const groups = new Set(FIELD_TYPE_CATALOG.map((f) => f.group));
    expect(groups.has('eingabe')).toBe(true);
    expect(groups.has('auswahl')).toBe(true);
    expect(groups.has('layout')).toBe(true);
  });

  it('alle erwarteten IDs sind vorhanden', () => {
    const ids = FIELD_TYPE_CATALOG.map((f) => f.id);
    const expected = [
      'text-short',
      'text-long',
      'number',
      'date',
      'checkbox',
      'dropdown',
      'radio',
      'group',
    ];
    for (const id of expected) {
      expect(ids).toContain(id);
    }
  });

  it('enthält den Datei-Upload-Eintrag (seit F-3)', () => {
    const ids = FIELD_TYPE_CATALOG.map((f) => f.id);
    expect(ids).toContain('file-upload');
  });
});

describe('FIELD_TYPE_CATALOG — Struktur jedes Eintrags', () => {
  FIELD_TYPE_CATALOG.forEach((fieldType: FieldTypeDefinition) => {
    describe(`Feldtyp "${fieldType.id}"`, () => {
      it('hat eine nicht-leere id', () => {
        expect(fieldType.id).toBeTruthy();
      });

      it('hat ein gültiges schema.type', () => {
        if (fieldType.isStructural) {
          // Strukturelle Einträge (Label, Alert, Spalten, Gruppe) erzeugen
          // keine schema.property und tragen daher type 'null'.
          expect(fieldType.schema.type).toBe('null');
        } else {
          expect([
            'string',
            'number',
            'integer',
            'boolean',
            'object',
            'array',
          ]).toContain(fieldType.schema.type);
        }
      });

      it('hat einen passenden uiSchema.type', () => {
        if (fieldType.isStructural) {
          expect([
            'Label',
            'HorizontalLayout',
            'VerticalLayout',
            'Group',
          ]).toContain(fieldType.uiSchema.type);
        } else {
          expect(fieldType.uiSchema.type).toBe('Control');
        }
      });

      it('hat einen leeren uiSchema.scope als Platzhalter', () => {
        // scope wird erst von ADD_FIELD (F-2) befüllt
        expect(fieldType.uiSchema.scope).toBe('');
      });

      it('hat defaults mit required', () => {
        expect(typeof fieldType.defaults.required).toBe('boolean');
      });

      it('hat ein icon', () => {
        expect(fieldType.icon).toBeTruthy();
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Enum-Felder
// ---------------------------------------------------------------------------

describe('Enum-Feldtypen (dropdown, radio)', () => {
  it('dropdown hat ein nicht-leeres enum-Array', () => {
    const dropdown = getFieldType('dropdown');
    expect(Array.isArray(dropdown.schema.enum)).toBe(true);
    expect((dropdown.schema.enum as string[]).length).toBeGreaterThan(0);
  });

  it('radio hat format: "radio" in uiSchema.options', () => {
    const radio = getFieldType('radio');
    expect(radio.uiSchema.options?.format).toBe('radio');
  });
});

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

describe('getFieldType()', () => {
  it('gibt den korrekten Typ für eine bekannte ID zurück', () => {
    const result = getFieldType('text-short');
    expect(result.id).toBe('text-short');
  });

  it('wirft bei unbekannter ID', () => {
    expect(() => getFieldType('does-not-exist')).toThrow(
      'Unbekannter Feldtyp: "does-not-exist"',
    );
  });
});

describe('getFieldTypesByGroup()', () => {
  it('gibt nur Einträge der angegebenen Gruppe zurück', () => {
    const eingabe = getFieldTypesByGroup('eingabe');
    expect(eingabe.every((f) => f.group === 'eingabe')).toBe(true);
  });

  it('gibt eine nicht-leere Liste für jede definierte Gruppe zurück', () => {
    for (const id of FIELD_GROUPS) {
      expect(getFieldTypesByGroup(id).length).toBeGreaterThan(0);
    }
  });
});

describe('FIELD_GROUPS — Reihenfolge', () => {
  it('beginnt mit "eingabe"', () => {
    expect(FIELD_GROUPS[0]).toBe('eingabe');
  });

  it('enthält alle drei Gruppen', () => {
    expect(FIELD_GROUPS).toContain('eingabe');
    expect(FIELD_GROUPS).toContain('auswahl');
    expect(FIELD_GROUPS).toContain('layout');
  });
});

// ---------------------------------------------------------------------------
// Katalog und Sprachdateien müssen sich decken (ADR 0007)
// ---------------------------------------------------------------------------

describe('Feldtyp-Texte', () => {
  const kataloge: Array<[string, EditorTranslations]> = [
    ['de', de],
    ['en', en],
  ];

  for (const [sprache, texte] of kataloge) {
    describe(sprache, () => {
      it('kennt jeden Feldtyp des Katalogs', () => {
        const fehlend = FIELD_TYPE_CATALOG.map((f) => f.id).filter(
          (id) => !texte.feldtypen[id],
        );
        expect(fehlend).toEqual([]);
      });

      it('hat für jeden Feldtyp Name und Vorgabe-Label', () => {
        for (const { id } of FIELD_TYPE_CATALOG) {
          expect(texte.feldtypen[id]?.name, id).toBeTruthy();
          expect(texte.feldtypen[id]?.label, id).toBeTruthy();
        }
      });

      it('kennt jede Palettengruppe', () => {
        for (const gruppe of FIELD_GROUPS) {
          expect(
            (texte.palette.groups as Record<string, string>)[gruppe],
            gruppe,
          ).toBeTruthy();
        }
      });

      it('führt keinen Text, den der Katalog nicht kennt', () => {
        const bekannt = new Set(FIELD_TYPE_CATALOG.map((f) => f.id));
        const verwaist = Object.keys(texte.feldtypen).filter(
          (id) => !bekannt.has(id),
        );
        expect(verwaist).toEqual([]);
      });
    });
  }
});
