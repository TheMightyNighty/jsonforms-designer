/**
 * OFM-Export (Produzenten-Konformität Klasse A, OFM 1.0):
 * erzeugt schema.json, uischema.json und form.manifest.json nach den
 * Meta-Schemata der Spezifikation (Kapitel 2, 3, 4).
 *
 * Grundsatz: Whitelist statt Blacklist — exportiert wird nur, was das
 * OFM-Profil kennt. Editor-interne Optionen (placeholder, variant, widths …)
 * bleiben im Projektzustand und tauchen im Artefakt nicht auf.
 */
import { FieldAwareState } from '../model/addFieldReducer';
import { FormManifestMeta, isValidFormUrn } from '../model/manifestMeta';
import {
  isSectionColorToken,
  legacyColorToToken,
} from '../model/sectionColorTokens';
import { UiElement } from '../model/uiElements';
import { stripHtml } from './plainText';

export const OFM_FORMAT_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// schema.json
// ---------------------------------------------------------------------------

const REGISTERED_X_KEY = /^x-(fim-id|fim-version|codelist-id)$/;
const VENDOR_X_KEY = /^x-v-[a-z0-9]+-[a-z0-9-]+$/;
const ALLOWED_FORMATS = new Set(['date', 'time', 'date-time', 'email', 'uri']);
const PROPERTY_NAME = /^[A-Za-z][A-Za-z0-9_]*$/;
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z-.]+)?(\+[0-9A-Za-z-.]+)?$/;

type Dict = Record<string, unknown>;

function copyXExtensions(source: Dict, target: Dict): void {
  for (const [key, value] of Object.entries(source)) {
    if (REGISTERED_X_KEY.test(key) || VENDOR_X_KEY.test(key)) {
      target[key] = value;
    }
  }
}

function copyIf(
  source: Dict,
  target: Dict,
  key: string,
  accept: (v: unknown) => boolean,
): void {
  const value = source[key];
  if (value !== undefined && accept(value)) target[key] = value;
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number';
const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';
const isInteger = (v: unknown): v is number => Number.isInteger(v);

function copyTexts(source: Dict, target: Dict): void {
  if (isString(source.title)) target.title = stripHtml(source.title);
  if (isString(source.description))
    target.description = stripHtml(source.description);
}

/**
 * Übersetzt ein internes Feldschema in die OFM-Teilmenge (Kapitel 3).
 * Unbekannte Schlüsselwörter werden weggelassen; strukturell nicht
 * abbildbare Felder (z. B. unbekannter type) liefern null und werden vom
 * Aufrufer ausgelassen.
 */
export function sanitizeFieldSchema(field: unknown): Dict | null {
  if (!field || typeof field !== 'object') return null;
  const src = field as Dict;

  if (isString(src.$ref)) {
    return /^#\/definitions\/[A-Za-z][A-Za-z0-9_]*$/.test(src.$ref)
      ? { $ref: src.$ref }
      : null;
  }

  const type = src.type;
  const out: Dict = {};

  if (type === 'string' || type === 'number' || type === 'integer') {
    // Labeled-Enum-Variante (oneOf mit const/title)
    if (Array.isArray(src.oneOf)) {
      const oneOf = src.oneOf
        .map((entry) => {
          const e = entry as Dict;
          if ((isString(e.const) || isNumber(e.const)) && isString(e.title)) {
            return { const: e.const, title: stripHtml(e.title) };
          }
          return null;
        })
        .filter(Boolean);
      if (oneOf.length === 0) return null;
      out.type = type;
      copyTexts(src, out);
      if (src.default !== undefined) out.default = src.default;
      out.oneOf = oneOf;
      copyXExtensions(src, out);
      return out;
    }
  }

  if (type === 'string') {
    out.type = 'string';
    copyTexts(src, out);
    copyIf(src, out, 'default', isString);
    copyIf(src, out, 'minLength', (v) => isInteger(v) && (v as number) >= 0);
    copyIf(src, out, 'maxLength', (v) => isInteger(v) && (v as number) >= 0);
    copyIf(src, out, 'pattern', isString);
    copyIf(src, out, 'format', (v) => isString(v) && ALLOWED_FORMATS.has(v));
    copyIf(
      src,
      out,
      'enum',
      (v) =>
        Array.isArray(v) &&
        v.length > 0 &&
        v.every(isString) &&
        new Set(v).size === v.length,
    );
    copyXExtensions(src, out);
    return out;
  }

  if (type === 'number' || type === 'integer') {
    out.type = type;
    copyTexts(src, out);
    copyIf(src, out, 'default', isNumber);
    for (const k of [
      'minimum',
      'maximum',
      'exclusiveMinimum',
      'exclusiveMaximum',
    ]) {
      copyIf(src, out, k, isNumber);
    }
    copyIf(src, out, 'multipleOf', (v) => isNumber(v) && (v as number) > 0);
    copyIf(
      src,
      out,
      'enum',
      (v) =>
        Array.isArray(v) &&
        v.length > 0 &&
        v.every(isNumber) &&
        new Set(v).size === v.length,
    );
    copyXExtensions(src, out);
    return out;
  }

  if (type === 'boolean') {
    out.type = 'boolean';
    copyTexts(src, out);
    copyIf(src, out, 'default', isBoolean);
    copyXExtensions(src, out);
    return out;
  }

  if (type === 'object') {
    out.type = 'object';
    copyTexts(src, out);
    const { properties, required } = sanitizePropertyMap(
      src.properties,
      src.required,
    );
    out.properties = properties;
    if (required.length > 0) out.required = required;
    out.additionalProperties = false;
    copyXExtensions(src, out);
    return out;
  }

  if (type === 'array') {
    const items = sanitizeFieldSchema(src.items);
    if (!items) return null;
    out.type = 'array';
    copyTexts(src, out);
    copyIf(src, out, 'minItems', (v) => isInteger(v) && (v as number) >= 0);
    copyIf(src, out, 'maxItems', (v) => isInteger(v) && (v as number) >= 1);
    out.items = items;
    copyXExtensions(src, out);
    return out;
  }

  return null;
}

function sanitizePropertyMap(
  properties: unknown,
  required: unknown,
): { properties: Dict; required: string[] } {
  const out: Dict = {};
  if (properties && typeof properties === 'object') {
    for (const [key, value] of Object.entries(properties as Dict)) {
      if (!PROPERTY_NAME.test(key)) continue;
      const sanitized = sanitizeFieldSchema(value);
      if (sanitized) out[key] = sanitized;
    }
  }
  const requiredList = Array.isArray(required)
    ? [...new Set(required.filter(isString))].filter((k) => k in out)
    : [];
  return { properties: out, required: requiredList };
}

export function buildOfmSchema(state: FieldAwareState): Dict {
  const src = state.schema as Dict;
  const out: Dict = { type: 'object' };
  copyTexts(src, out);
  const { properties, required } = sanitizePropertyMap(
    src.properties,
    src.required,
  );
  out.properties = properties;
  if (required.length > 0) out.required = required;
  out.additionalProperties = false;
  if (src.definitions && typeof src.definitions === 'object') {
    const defs: Dict = {};
    for (const [key, value] of Object.entries(src.definitions as Dict)) {
      if (!PROPERTY_NAME.test(key)) continue;
      const sanitized = sanitizeFieldSchema(value);
      if (sanitized) defs[key] = sanitized;
    }
    if (Object.keys(defs).length > 0) out.definitions = defs;
  }
  copyXExtensions(src, out);
  return out;
}

// ---------------------------------------------------------------------------
// uischema.json
// ---------------------------------------------------------------------------

const RULE_EFFECTS = new Set(['SHOW', 'HIDE', 'ENABLE', 'DISABLE']);
const SCOPE_POINTER = /^#(\/properties\/[A-Za-z][A-Za-z0-9_]*)+$/;

/**
 * Übernimmt eine Rule nur, wenn sie exakt dem OFM-Profil entspricht
 * (effect + condition mit scope und const-/enum-Schema). Nicht abbildbare
 * Rules werden weggelassen — der Editor erzeugt ausschließlich konforme.
 */
function sanitizeRule(rule: unknown): Dict | undefined {
  if (!rule || typeof rule !== 'object') return undefined;
  const r = rule as Dict;
  if (!isString(r.effect) || !RULE_EFFECTS.has(r.effect)) return undefined;
  const condition = r.condition as Dict | undefined;
  if (!condition || typeof condition !== 'object') return undefined;
  if (!isString(condition.scope) || !SCOPE_POINTER.test(condition.scope))
    return undefined;
  const condSchema = condition.schema as Dict | undefined;
  if (!condSchema || typeof condSchema !== 'object') return undefined;
  if (condSchema.const !== undefined) {
    return {
      effect: r.effect,
      condition: {
        scope: condition.scope,
        schema: { const: condSchema.const },
      },
    };
  }
  if (Array.isArray(condSchema.enum) && condSchema.enum.length > 0) {
    return {
      effect: r.effect,
      condition: {
        scope: condition.scope,
        schema: { enum: condSchema.enum },
      },
    };
  }
  return undefined;
}

function controlOptions(
  options: Record<string, unknown> | undefined,
): Dict | undefined {
  // OFM-R-420: unpräfixierte options außer `multi` sind unzulässig —
  // Editor-interne Optionen (placeholder, format, variant …) bleiben intern.
  if (options && isBoolean(options.multi) && options.multi) {
    return { multi: true };
  }
  return undefined;
}

function sectionColorFor(
  el: UiElement,
  sectionColors: Record<string, string>,
): string | undefined {
  const raw =
    sectionColors[el.id] ??
    ('scope' in el && el.scope ? sectionColors[el.scope] : undefined);
  if (!raw) return undefined;
  return isSectionColorToken(raw) ? raw : legacyColorToToken(raw);
}

/**
 * Verteilt interne Spaltenverhältnisse auf das 12er-Raster von `ofm:width`
 * (Ganzzahlen 1–12, Summe 12; größte-Reste-Verfahren).
 */
export function widthsToGrid(widths: number[]): number[] {
  const positive = widths.map((w) => (w > 0 ? w : 1));
  const sum = positive.reduce((a, b) => a + b, 0);
  const exact = positive.map((w) => (w / sum) * 12);
  const floors = exact.map((v) => Math.max(1, Math.floor(v)));
  let rest = 12 - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (rest <= 0) break;
    floors[i] += 1;
    rest -= 1;
  }
  return floors;
}

function exportElement(
  el: UiElement,
  sectionColors: Record<string, string>,
): Dict | null {
  const rule = sanitizeRule(el.rule);

  if (el.type === 'Label') {
    // OFM-R-404: reiner Text; das Label-Profil kennt weder options noch rule.
    return { type: 'Label', text: stripHtml(el.label ?? '') };
  }

  if (el.type === 'Control') {
    if (!el.scope || !SCOPE_POINTER.test(el.scope)) return null;
    const out: Dict = { type: 'Control', scope: el.scope };
    const options = controlOptions(el.options);
    if (options) out.options = options;
    if (rule) out.rule = rule;
    return out;
  }

  if (el.type === 'GroupContainer') {
    const out: Dict = {
      type: 'Group',
      elements: el.children
        .map((child) => exportElement(child, sectionColors))
        .filter(Boolean),
    };
    if (el.label) out.label = stripHtml(el.label);
    const token = sectionColorFor(el, sectionColors);
    if (token) out.options = { 'ofm:sectionColor': token };
    if (rule) out.rule = rule;
    return out;
  }

  if (el.type === 'ColumnContainer') {
    const filled = el.columns
      .map((column, i) => ({ column, width: el.widths[i] ?? 1 }))
      .filter(({ column }) => column.length > 0);
    if (filled.length === 0) return null;
    const grid = widthsToGrid(filled.map(({ width }) => width));
    const elements = filled.map(({ column }, i) => {
      // ofm:width kann nur an Elementen mit options-Unterstützung hängen
      // (Control, Group). Einelementige Spalten behalten daher ihre Breite;
      // mehrelementige Spalten degradieren definiert zur Gleichverteilung
      // über ein VerticalLayout (siehe SPEC-FINDINGS im ofm-spec-Repo).
      if (column.length === 1) {
        const single = exportElement(column[0], sectionColors);
        if (single && (single.type === 'Control' || single.type === 'Group')) {
          single.options = {
            ...(single.options as Dict | undefined),
            'ofm:width': grid[i],
          };
          return single;
        }
        if (single) return single;
      }
      return {
        type: 'VerticalLayout',
        elements: column
          .map((child) => exportElement(child, sectionColors))
          .filter(Boolean),
      };
    });
    const out: Dict = { type: 'HorizontalLayout', elements };
    if (rule) out.rule = rule;
    return out;
  }

  return null;
}

export function buildOfmUiSchema(state: FieldAwareState): Dict {
  const { uiSchema, tabs, tabAssignments, sectionColors } = state;

  if (tabs.length === 0) {
    return {
      type: 'VerticalLayout',
      elements: uiSchema.elements
        .map((el) => exportElement(el, sectionColors))
        .filter(Boolean),
    };
  }

  const buckets: Dict[][] = tabs.map(() => []);
  for (const el of uiSchema.elements) {
    const key = 'scope' in el ? (el.scope ?? el.id) : el.id;
    const idx = Math.min(tabAssignments[key] ?? 0, buckets.length - 1);
    const exported = exportElement(el, sectionColors);
    if (exported) buckets[idx].push(exported);
  }
  return {
    type: 'Categorization',
    elements: tabs.map((tab, i) => ({
      type: 'Category',
      label: stripHtml(tab.label),
      elements: [{ type: 'VerticalLayout', elements: buckets[i] }],
    })),
  };
}

// ---------------------------------------------------------------------------
// form.manifest.json + Paket
// ---------------------------------------------------------------------------

async function sha256Hex(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Pflichtangaben für ein gültiges Manifest (OFM-R-200). Liefert die Labels
 * fehlender bzw. ungültiger Angaben für die Anzeige im Export-Dialog.
 */
export function missingManifestFields(state: FieldAwareState): string[] {
  const missing: string[] = [];
  const meta = state.manifestMeta;
  const title = (state.schema as Dict).title;
  if (!isString(title) || title.trim() === '') {
    missing.push('Formular-Titel');
  }
  if (!isValidFormUrn(meta.id)) {
    missing.push('Formular-ID (URN)');
  }
  if (!SEMVER.test(meta.version)) {
    missing.push('Version (SemVer, z. B. 1.0.0)');
  }
  if (!meta.publisher.trim()) {
    missing.push('Herausgebende Behörde');
  }
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(meta.language)) {
    missing.push('Sprache (z. B. de)');
  }
  if (meta.validFrom && !/^\d{4}-\d{2}-\d{2}$/.test(meta.validFrom)) {
    missing.push('Gültig ab (Datum JJJJ-MM-TT)');
  }
  return missing;
}

export interface OfmExportFile {
  name: string;
  content: string;
}

export interface OfmExportResult {
  files: OfmExportFile[];
  manifest: Dict;
}

function buildManifest(
  meta: FormManifestMeta,
  title: string,
  hashes: { schema: string; uischema: string },
): Dict {
  const form: Dict = {
    id: meta.id,
    version: meta.version,
    title: stripHtml(title),
    publisher: meta.publisher,
  };
  if (meta.legalBasis) form.legalBasis = meta.legalBasis;
  if (meta.validFrom) form.validFrom = meta.validFrom;
  form.language = meta.language;
  return {
    formatVersion: OFM_FORMAT_VERSION,
    form,
    conformanceClass: 'A',
    artifacts: {
      schema: { path: 'schema.json', sha256: hashes.schema },
      uischema: { path: 'uischema.json', sha256: hashes.uischema },
    },
  };
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}

/**
 * Erzeugt das vollständige OFM-Paket (Klasse A): schema.json, uischema.json
 * und form.manifest.json. Die SHA-256-Hashes werden über die tatsächlich
 * exportierten Datei-Inhalte (nach Serialisierung) berechnet — OFM-R-203.
 */
export async function serializeOfmExport(
  state: FieldAwareState,
): Promise<OfmExportResult> {
  const schemaContent = serializeJson(buildOfmSchema(state));
  const uischemaContent = serializeJson(buildOfmUiSchema(state));
  const manifest = buildManifest(
    state.manifestMeta,
    String((state.schema as Dict).title ?? ''),
    {
      schema: await sha256Hex(schemaContent),
      uischema: await sha256Hex(uischemaContent),
    },
  );
  return {
    manifest,
    files: [
      { name: 'form.manifest.json', content: serializeJson(manifest) },
      { name: 'schema.json', content: schemaContent },
      { name: 'uischema.json', content: uischemaContent },
    ],
  };
}
