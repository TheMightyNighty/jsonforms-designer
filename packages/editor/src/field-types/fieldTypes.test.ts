/**
 * F-1: Tests für den Feldtypen-Katalog
 *
 * Prüft Vollständigkeit, Struktur und Hilfsfunktionen.
 * Test-Runner: Vitest (wie im migrierten Stack).
 */

import { describe, it, expect } from 'vitest';
import {
  FIELD_TYPE_CATALOG,
  FIELD_GROUPS,
  getFieldType,
  getFieldTypesByGroup,
  type FieldTypeDefinition,
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

  it('enthält keinen Datei-Upload-Eintrag (bewusst ausgelassen bis F-3)', () => {
    const ids = FIELD_TYPE_CATALOG.map((f) => f.id);
    expect(ids).not.toContain('file-upload');
  });
});

describe('FIELD_TYPE_CATALOG — Struktur jedes Eintrags', () => {
  FIELD_TYPE_CATALOG.forEach((fieldType: FieldTypeDefinition) => {
    describe(`Feldtyp "${fieldType.id}"`, () => {
      it('hat eine nicht-leere id', () => {
        expect(fieldType.id).toBeTruthy();
      });

      it('hat einen displayName', () => {
        expect(fieldType.displayName).toBeTruthy();
      });

      it('hat ein gültiges schema.type', () => {
        expect(['string', 'number', 'boolean', 'object', 'array']).toContain(
          fieldType.schema.type
        );
      });

      it('hat ein uiSchema vom type "Control"', () => {
        expect(fieldType.uiSchema.type).toBe('Control');
      });

      it('hat einen leeren uiSchema.scope als Platzhalter', () => {
        // scope wird erst von ADD_FIELD (F-2) befüllt
        expect(fieldType.uiSchema.scope).toBe('');
      });

      it('hat defaults mit label, description und required', () => {
        expect(typeof fieldType.defaults.label).toBe('string');
        expect(typeof fieldType.defaults.description).toBe('string');
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
      'Unbekannter Feldtyp: "does-not-exist"'
    );
  });
});

describe('getFieldTypesByGroup()', () => {
  it('gibt nur Einträge der angegebenen Gruppe zurück', () => {
    const eingabe = getFieldTypesByGroup('eingabe');
    expect(eingabe.every((f) => f.group === 'eingabe')).toBe(true);
  });

  it('gibt eine nicht-leere Liste für jede definierte Gruppe zurück', () => {
    for (const { id } of FIELD_GROUPS) {
      expect(getFieldTypesByGroup(id).length).toBeGreaterThan(0);
    }
  });
});

describe('FIELD_GROUPS — Reihenfolge', () => {
  it('beginnt mit "eingabe"', () => {
    expect(FIELD_GROUPS[0].id).toBe('eingabe');
  });

  it('enthält alle drei Gruppen', () => {
    const ids = FIELD_GROUPS.map((g) => g.id);
    expect(ids).toContain('eingabe');
    expect(ids).toContain('auswahl');
    expect(ids).toContain('layout');
  });
});
