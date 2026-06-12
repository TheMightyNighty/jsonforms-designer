/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */

import { JsonSchema7, UISchemaElement } from '@jsonforms/core';

export interface SchemaService {
  getSchema(): Promise<JsonSchema7 | undefined>;
  getUiSchema(): Promise<UISchemaElement | undefined>;
}

export class EmptySchemaService implements SchemaService {
  getSchema = async () => undefined;
  getUiSchema = async () => undefined;
}
