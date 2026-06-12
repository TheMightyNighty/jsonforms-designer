/**
 * Tests für die Konvertierung extern geladener Schemas (SchemaService)
 * in den Form-First-Zustand (ADR 0001).
 */
import { describe, expect, it } from 'vitest';

import { FlatElement } from '../model/uiElements';
import { fieldStateFromSchemas } from './fieldStateFromSchemas';

const SCHEMA = {
  type: 'object' as const,
  title: 'Antrag',
  properties: {
    vorname: { type: 'string' as const, title: 'Vorname' },
    alter: { type: 'integer' as const, title: 'Alter' },
  },
  required: ['vorname'],
};

describe('fieldStateFromSchemas()', () => {
  it('gibt undefined zurück wenn weder Schema noch uiSchema vorliegen', () => {
    expect(fieldStateFromSchemas(undefined, undefined)).toBeUndefined();
  });

  it('übernimmt Schema inkl. Titel und required, generiert Controls ohne uiSchema', () => {
    const state = fieldStateFromSchemas(SCHEMA, undefined)!;
    expect(state.schema.title).toBe('Antrag');
    expect(state.schema.required).toEqual(['vorname']);
    expect(
      state.uiSchema.elements.map((e) => ('scope' in e ? e.scope : undefined)),
    ).toEqual(['#/properties/vorname', '#/properties/alter']);
    expect(state.uiSchema.elements.every((e) => e.type === 'Control')).toBe(
      true,
    );
    // Defaults vollständig
    expect(state.tabs).toEqual([]);
    expect(state.tabAssignments).toEqual({});
  });

  it('entpackt ein VerticalLayout-Root in flache Elemente', () => {
    const state = fieldStateFromSchemas(SCHEMA, {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/alter' },
        { type: 'Label', text: 'Hinweis' },
      ],
    } as never)!;
    expect(state.uiSchema.elements).toHaveLength(2);
    expect(state.uiSchema.elements[0]).toMatchObject({
      type: 'Control',
      scope: '#/properties/alter',
    });
    expect(state.uiSchema.elements[1].type).toBe('Label');
  });

  it('konvertiert HorizontalLayout in einen ColumnContainer', () => {
    const state = fieldStateFromSchemas(SCHEMA, {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/vorname' },
            { type: 'Control', scope: '#/properties/alter' },
          ],
        },
      ],
    } as never)!;
    const [container] = state.uiSchema.elements as FlatElement[];
    expect(container.type).toBe('ColumnContainer');
    expect(container.columns).toHaveLength(2);
  });

  it('behandelt ein Nicht-Layout-Root als Einzelelement', () => {
    const state = fieldStateFromSchemas(SCHEMA, {
      type: 'Control',
      scope: '#/properties/vorname',
    } as never)!;
    expect(state.uiSchema.elements).toHaveLength(1);
    expect(state.uiSchema.elements[0]).toMatchObject({
      type: 'Control',
      scope: '#/properties/vorname',
    });
  });

  it('nur uiSchema ohne Schema → leeres Objekt-Schema', () => {
    const state = fieldStateFromSchemas(undefined, {
      type: 'VerticalLayout',
      elements: [{ type: 'Control', scope: '#/properties/x' }],
    } as never)!;
    expect(state.schema).toMatchObject({ type: 'object', properties: {} });
    expect(state.uiSchema.elements).toHaveLength(1);
  });

  it('unbekannte uiSchema-Typen werden best-effort zu Labels (kein Crash)', () => {
    const state = fieldStateFromSchemas(SCHEMA, {
      type: 'VerticalLayout',
      elements: [{ type: 'Categorization', elements: [] }],
    } as never)!;
    expect(state.uiSchema.elements).toHaveLength(1);
    expect(state.uiSchema.elements[0].type).toBe('Label');
  });
});
