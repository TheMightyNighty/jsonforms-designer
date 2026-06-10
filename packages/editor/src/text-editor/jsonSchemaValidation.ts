/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 *
 * Monaco instance is passed as a parameter to ensure a single source
 * (from @monaco-editor/react) across the app.
 */
import { Monaco } from '@monaco-editor/react';

import { jsonSchemaDraft7, ruleSchema } from '../core/jsonschema';

export type TextType = 'JSON' | 'JSON Schema' | 'UI Schema';

// Use Monaco from @monaco-editor/react as the canonical type
export type EditorApi = Monaco;

interface SchemaEntry {
  uri: string;
  fileMatch?: string[];
  schema?: unknown;
}

/**
 * Register a new schema for the JSON language, if it isn't already registered.
 */
export const addSchema = (monaco: Monaco, schemas: SchemaEntry[]) => {
  const registeredSchemas =
    monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas;
  if (registeredSchemas === undefined) {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [...schemas],
    });
  } else {
    for (const schema of schemas) {
      const fileMatch = schema.fileMatch;
      const existing = registeredSchemas.find(
        (s: SchemaEntry) => s.fileMatch === fileMatch && s.uri === schema.uri,
      );
      if (!existing) {
        registeredSchemas.push({ ...schema });
      }
    }
  }
};

/**
 * Configures the Monaco Editor to validate input against JSON Schema Draft 7.
 */
export const configureJsonSchemaValidation = (
  monaco: Monaco,
  modelUri: ReturnType<Monaco['Uri']['parse']>,
) => {
  addSchema(monaco, [
    { ...jsonSchemaDraft7, fileMatch: [modelUri.toString()] },
  ]);
};

/**
 * Configures the Monaco Editor to validate input against the Rule UI Schema.
 */
export const configureRuleSchemaValidation = (
  monaco: Monaco,
  modelUri: ReturnType<Monaco['Uri']['parse']>,
) => {
  addSchema(monaco, [
    { ...jsonSchemaDraft7 },
    { ...ruleSchema, fileMatch: [modelUri.toString()] },
  ]);
};

/**
 * Get or create a Monaco model for the given URI.
 * Monaco instance must be passed to ensure a single source.
 */
export const getMonacoModelForUri = (
  monaco: Monaco,
  modelUri: ReturnType<Monaco['Uri']['parse']>,
  initialValue: string | undefined,
) => {
  const value = initialValue ?? '';
  let model = monaco.editor.getModel(modelUri);
  if (model) {
    model.setValue(value);
  } else {
    model = monaco.editor.createModel(value, 'json', modelUri);
  }
  return model;
};
