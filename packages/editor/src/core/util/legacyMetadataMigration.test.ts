/**
 * Migration von Alt-Beständen: x-Metadaten aus dem Schema in den
 * Manifest-Datenhalter (OFM-R-304), Hex-Abschnittsfarben auf Token
 * (OFM-R-421), Übernahme importierter ofm:sectionColor-Options.
 */
import { describe, expect, it } from 'vitest';

import { FieldAwareState } from '../model/addFieldReducer';
import { emptyManifestMeta } from '../model/manifestMeta';
import {
  hasLegacySchemaMetadata,
  migrateLegacyFieldState,
} from './legacyMetadataMigration';

function stateWith(partial: Partial<FieldAwareState>): FieldAwareState {
  return {
    schema: { type: 'object', properties: {} },
    uiSchema: { type: 'VerticalLayout', elements: [] },
    tabs: [],
    activeTabIndex: 0,
    tabAssignments: {},
    lineNumbersEnabled: false,
    typvorschlagIgnoriert: {},
    sectionColors: {},
    manifestMeta: { ...emptyManifestMeta },
    ...partial,
  };
}

describe('migrateLegacyFieldState', () => {
  it('zieht x-Metadaten aus dem Schema in den Manifest-Zustand um', () => {
    const state = stateWith({
      schema: {
        type: 'object',
        properties: {},
        'x-publisher': 'Stadt Bonn',
        'x-legal-basis': '§ 45 StVO',
        'x-version': '2.1.0',
        'x-valid-from': '2026-08-01',
      } as never,
    });
    const { state: migrated, migratedMetadata } =
      migrateLegacyFieldState(state);
    expect(migratedMetadata).toBe(true);
    expect(migrated.manifestMeta.publisher).toBe('Stadt Bonn');
    expect(migrated.manifestMeta.legalBasis).toBe('§ 45 StVO');
    expect(migrated.manifestMeta.version).toBe('2.1.0');
    expect(migrated.manifestMeta.validFrom).toBe('2026-08-01');
    const s = migrated.schema as Record<string, unknown>;
    expect(s['x-publisher']).toBeUndefined();
    expect(s['x-legal-basis']).toBeUndefined();
    expect(s['x-version']).toBeUndefined();
    expect(s['x-valid-from']).toBeUndefined();
  });

  it('überschreibt vorhandene Manifest-Werte nicht', () => {
    const state = stateWith({
      schema: {
        type: 'object',
        properties: {},
        'x-publisher': 'Altes Amt',
      } as never,
      manifestMeta: { ...emptyManifestMeta, publisher: 'Neues Amt' },
    });
    const { state: migrated } = migrateLegacyFieldState(state);
    expect(migrated.manifestMeta.publisher).toBe('Neues Amt');
    expect(
      (migrated.schema as Record<string, unknown>)['x-publisher'],
    ).toBeUndefined();
  });

  it('mappt Hex-Abschnittsfarben auf Token', () => {
    const state = stateWith({
      sectionColors: { grp_1: '#C8D8F0', grp_2: '#C8EAE8', grp_3: 'red' },
    });
    const { state: migrated } = migrateLegacyFieldState(state);
    expect(migrated.sectionColors).toEqual({
      grp_1: 'blue',
      grp_2: 'green',
      grp_3: 'red',
    });
  });

  it('hebt importierte ofm:sectionColor-Options in den Farb-Zustand', () => {
    const state = stateWith({
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          {
            id: 'grp_1',
            type: 'GroupContainer',
            label: 'Gruppe',
            children: [],
            options: { 'ofm:sectionColor': 'purple' },
          },
        ],
      },
    });
    const { state: migrated } = migrateLegacyFieldState(state);
    expect(migrated.sectionColors['grp_1']).toBe('purple');
  });

  it('lässt konforme Zustände unverändert (Referenzgleichheit)', () => {
    const state = stateWith({ sectionColors: { a: 'blue' } });
    const { state: migrated, migratedMetadata } =
      migrateLegacyFieldState(state);
    expect(migratedMetadata).toBe(false);
    expect(migrated).toBe(state);
  });
});

describe('hasLegacySchemaMetadata', () => {
  it('erkennt Alt-Schemata', () => {
    expect(hasLegacySchemaMetadata({ 'x-publisher': 'Amt' })).toBe(true);
    expect(hasLegacySchemaMetadata({ title: 'ok' })).toBe(false);
    expect(hasLegacySchemaMetadata(null)).toBe(false);
  });
});
