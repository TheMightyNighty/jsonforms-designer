/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 *
 * Bug fix: destructure props correctly so object is serialized, not wrapper.
 * ---------------------------------------------------------------------
 */
import React from 'react';

interface FormattedJsonProps {
  object?: unknown;
}

export const FormattedJson: React.FC<FormattedJsonProps> = ({ object }) => {
  return <pre>{JSON.stringify(object, null, 2)}</pre>;
};
