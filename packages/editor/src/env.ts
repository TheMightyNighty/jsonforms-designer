/// <reference types="vite/client" />
/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 *
 * Migrated: REACT_APP_DEBUG -> import.meta.env.VITE_DEBUG (Vite convention)
 * ---------------------------------------------------------------------
 */
export const env = () => {
  const DEBUG = (import.meta.env.VITE_DEBUG as string) ?? 'false';
  const NODE_ENV = import.meta.env.MODE ?? 'development';
  return { NODE_ENV, DEBUG };
};
