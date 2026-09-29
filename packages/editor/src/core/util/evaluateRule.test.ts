import { describe, expect, it } from 'vitest';

import { UISchemaRule } from '../../properties/fieldPropertiesActions';
import { evaluateFieldVisibility } from './evaluateRule';

const constRule = (effect: UISchemaRule['effect']): UISchemaRule => ({
  effect,
  condition: { scope: '#/properties/land', schema: { const: 'DE' } },
});

const enumRule = (effect: UISchemaRule['effect']): UISchemaRule => ({
  effect,
  condition: {
    scope: '#/properties/land',
    schema: { enum: ['DE', 'AT'] },
  },
});

describe('evaluateFieldVisibility', () => {
  it('liefert immer sichtbar/aktiv ohne Rule', () => {
    expect(evaluateFieldVisibility(null, {})).toEqual({
      visible: true,
      enabled: true,
    });
    expect(evaluateFieldVisibility(undefined, {})).toEqual({
      visible: true,
      enabled: true,
    });
  });

  it('SHOW mit const: sichtbar wenn Bedingung erfüllt', () => {
    expect(evaluateFieldVisibility(constRule('SHOW'), { land: 'DE' })).toEqual({
      visible: true,
      enabled: true,
    });
  });

  it('SHOW mit const: unsichtbar wenn Bedingung nicht erfüllt', () => {
    expect(evaluateFieldVisibility(constRule('SHOW'), { land: 'FR' })).toEqual({
      visible: false,
      enabled: true,
    });
  });

  it('HIDE mit const: unsichtbar wenn Bedingung erfüllt', () => {
    expect(evaluateFieldVisibility(constRule('HIDE'), { land: 'DE' })).toEqual({
      visible: false,
      enabled: true,
    });
  });

  it('HIDE mit const: sichtbar wenn Bedingung nicht erfüllt', () => {
    expect(evaluateFieldVisibility(constRule('HIDE'), { land: 'FR' })).toEqual({
      visible: true,
      enabled: true,
    });
  });

  it('DISABLE mit const: deaktiviert wenn Bedingung erfüllt', () => {
    expect(
      evaluateFieldVisibility(constRule('DISABLE'), { land: 'DE' }),
    ).toEqual({ visible: true, enabled: false });
  });

  it('DISABLE mit const: aktiviert wenn Bedingung nicht erfüllt', () => {
    expect(
      evaluateFieldVisibility(constRule('DISABLE'), { land: 'FR' }),
    ).toEqual({ visible: true, enabled: true });
  });

  it('SHOW mit enum: sichtbar wenn Wert in enum enthalten', () => {
    expect(evaluateFieldVisibility(enumRule('SHOW'), { land: 'AT' })).toEqual({
      visible: true,
      enabled: true,
    });
  });

  it('SHOW mit enum: unsichtbar wenn Wert nicht in enum enthalten', () => {
    expect(evaluateFieldVisibility(enumRule('SHOW'), { land: 'CH' })).toEqual({
      visible: false,
      enabled: true,
    });
  });

  it('HIDE mit enum: unsichtbar wenn Wert in enum enthalten', () => {
    expect(evaluateFieldVisibility(enumRule('HIDE'), { land: 'AT' })).toEqual({
      visible: false,
      enabled: true,
    });
  });

  it('DISABLE mit enum: deaktiviert wenn Wert in enum enthalten', () => {
    expect(
      evaluateFieldVisibility(enumRule('DISABLE'), { land: 'AT' }),
    ).toEqual({ visible: true, enabled: false });
  });

  it('unbekannter Effect: immer sichtbar/aktiv', () => {
    expect(
      evaluateFieldVisibility(
        { effect: 'ENABLE', condition: constRule('SHOW').condition },
        { land: 'DE' },
      ),
    ).toEqual({ visible: true, enabled: true });
  });
});

// ---------------------------------------------------------------------------
// Operator „ist nicht gleich" (not.const) — Satz-Editor der Bedingungen
// ---------------------------------------------------------------------------

describe('evaluateFieldVisibility — ist nicht gleich', () => {
  const regel = (effect: 'SHOW' | 'HIDE' | 'DISABLE') => ({
    effect,
    condition: {
      scope: '#/properties/land',
      schema: { not: { const: 'DE' } },
    },
  });

  it('zeigt ein Feld nur bei abweichendem Wert', () => {
    expect(evaluateFieldVisibility(regel('SHOW'), { land: 'AT' })).toEqual({
      visible: true,
      enabled: true,
    });
    expect(evaluateFieldVisibility(regel('SHOW'), { land: 'DE' })).toEqual({
      visible: false,
      enabled: true,
    });
  });

  it('blendet ein Feld bei abweichendem Wert aus', () => {
    expect(evaluateFieldVisibility(regel('HIDE'), { land: 'AT' })).toEqual({
      visible: false,
      enabled: true,
    });
  });

  it('sperrt ein Feld bei abweichendem Wert', () => {
    expect(evaluateFieldVisibility(regel('DISABLE'), { land: 'AT' })).toEqual({
      visible: true,
      enabled: false,
    });
  });

  it('behandelt einen fehlenden Wert als abweichend', () => {
    expect(evaluateFieldVisibility(regel('SHOW'), {})).toEqual({
      visible: true,
      enabled: true,
    });
  });
});
