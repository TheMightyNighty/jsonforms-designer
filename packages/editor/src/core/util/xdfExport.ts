/**
 * XDatenfelder 2.0 (XDF2) Exporter
 *
 * Generiert ein minimal-konformes XDF-XML aus dem internen FieldAwareState.
 * Mapping-Grundlage: FIM-Standard XDatenfelder_2 / urn:xoev-de:fim:standard:xdatenfelder_2
 */
import { JsonSchema7 } from '@jsonforms/core';

import { FieldAwareState } from '../model/addFieldReducer';

// ---------------------------------------------------------------------------
// Typ-Mapping JSON Schema → XDF Datentyp
// ---------------------------------------------------------------------------

type XdfDatentyp =
  | 'text'
  | 'date'
  | 'datetime'
  | 'num_int'
  | 'num_gk'
  | 'bool'
  | 'file';
type XdfFeldart = 'input' | 'select' | 'label';

function mapDatentyp(schema: JsonSchema7): XdfDatentyp {
  if (schema.enum) return 'text'; // Codeliste → text + code
  if (schema.format === 'date') return 'date';
  if (schema.format === 'date-time') return 'datetime';
  if (schema.type === 'integer') return 'num_int';
  if (schema.type === 'number') return 'num_gk';
  if (schema.type === 'boolean') return 'bool';
  if (schema.type === 'string' && schema.format === 'uri') return 'file';
  return 'text';
}

function mapFeldart(schema: JsonSchema7): XdfFeldart {
  if (schema.enum) return 'select';
  if (schema.type === 'null') return 'label';
  return 'input';
}

// ---------------------------------------------------------------------------
// XML-Hilfsfunktionen
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function elem(
  tag: string,
  content: string,
  attrs: Record<string, string> = {},
): string {
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join('');
  return `<${tag}${attrStr}>${content}</${tag}>`;
}

function code(tagGroup: string, code: string, name: string): string {
  return `<${tagGroup}>${elem('code', esc(code))}${elem('name', esc(name))}</${tagGroup}>`;
}

// ---------------------------------------------------------------------------
// Exportfunktion
// ---------------------------------------------------------------------------

export interface XdfExportOptions {
  /** ID der Datenfeldgruppe, z. B. "G000000001". Default: "G000000001" */
  gruppenId?: string;
  version?: string;
}

export function exportToXdf(
  state: FieldAwareState,
  opts: XdfExportOptions = {},
): string {
  const { schema } = state;
  const s = schema as Record<string, unknown>;
  const gruppenId = opts.gruppenId ?? 'G000000001';
  const version = String(opts.version ?? s['x-version'] ?? '1.0');
  const title = String(s.title ?? 'Unbenanntes Formular');
  const description = String(s.description ?? '');
  const publisher = String(s['x-publisher'] ?? '');
  const legalBasis = String(s['x-legal-basis'] ?? '');

  // Datenfelder generieren
  let feldIndex = 1;
  const felder = Object.entries(schema.properties ?? {})
    .map(([key, raw]) => {
      const fs = raw as JsonSchema7 & {
        'x-fim-id'?: string;
        beschreibung?: string;
      };
      const id = fs['x-fim-id'] ?? `F${String(feldIndex++).padStart(9, '0')}`;
      const name = fs.title ?? key;
      const desc = fs.beschreibung ?? fs.description ?? '';

      const dt = mapDatentyp(fs);
      const fa = mapFeldart(fs);

      let einschraenkungen = '';
      if (fs.minLength)
        einschraenkungen += elem('xdf:minLength', String(fs.minLength));
      if (fs.maxLength)
        einschraenkungen += elem('xdf:maxLength', String(fs.maxLength));
      if (fs.minimum !== undefined)
        einschraenkungen += elem('xdf:minimum', String(fs.minimum));
      if (fs.maximum !== undefined)
        einschraenkungen += elem('xdf:maximum', String(fs.maximum));
      if (fs.pattern) einschraenkungen += elem('xdf:pattern', esc(fs.pattern));

      let codelisteRef = '';
      if (fs.enum?.length) {
        const werte = (fs.enum as unknown[])
          .map(
            (v) =>
              `<xdf:wert>${elem('xdf:code', esc(String(v)))}${elem('xdf:name', esc(String(v)))}</xdf:wert>`,
          )
          .join('');
        codelisteRef = `<xdf:codeliste><xdf:werte>${werte}</xdf:werte></xdf:codeliste>`;
      }

      return `
      <xdf:enthaelt>
        <xdf:datenfeld>
          <xdf:identifikation>
            ${elem('xdf:id', esc(id))}
            ${elem('xdf:version', esc(version))}
          </xdf:identifikation>
          <xdf:allgemeineAngaben>
            ${elem('xdf:bezeichnungEingabe', esc(name))}
            ${desc ? elem('xdf:beschreibung', esc(desc)) : ''}
            ${code('xdf:datentyp', dt, dt)}
            ${code('xdf:feldart', fa, fa)}
            ${legalBasis ? elem('xdf:bezug', esc(legalBasis)) : ''}
          </xdf:allgemeineAngaben>
          ${einschraenkungen ? `<xdf:einschraenkungen>${einschraenkungen}</xdf:einschraenkungen>` : ''}
          ${codelisteRef}
        </xdf:datenfeld>
      </xdf:enthaelt>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<xdf:xdatenfelder.datenfeldgruppe.0401
  xmlns:xdf="urn:xoev-de:fim:standard:xdatenfelder_2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="urn:xoev-de:fim:standard:xdatenfelder_2 xdatenfelder.xsd">
  <xdf:datenfeldgruppe>
    <xdf:identifikation>
      ${elem('xdf:id', esc(gruppenId))}
      ${elem('xdf:version', esc(version))}
    </xdf:identifikation>
    <xdf:allgemeineAngaben>
      ${elem('xdf:bezeichnungEingabe', esc(title))}
      ${description ? elem('xdf:beschreibung', esc(description)) : ''}
      ${publisher ? elem('xdf:herausgebendestelle', esc(publisher)) : ''}
      ${code('xdf:freigabestatus', '1', 'in Bearbeitung')}
    </xdf:allgemeineAngaben>
    <xdf:struktur>${felder}
    </xdf:struktur>
  </xdf:datenfeldgruppe>
</xdf:xdatenfelder.datenfeldgruppe.0401>`;
}

export function downloadXdf(state: FieldAwareState): void {
  const xml = exportToXdf(state);
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = ((state.schema as JsonSchema7).title ?? 'formular')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
  a.href = url;
  a.download = `${name}_xdf2.xml`;
  a.click();
  URL.revokeObjectURL(url);
}
