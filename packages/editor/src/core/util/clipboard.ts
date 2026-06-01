/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
export const copyToClipBoard = (text: string) => {
  // Prefer the async Clipboard API (secure contexts). Fall back to the legacy
  // execCommand approach only where it is unavailable (e.g. non-HTTPS origins).
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
    return;
  }
  legacyCopy(text);
};

const legacyCopy = (text: string) => {
  const textArea = document.createElement('textarea');
  document.body.appendChild(textArea);
  textArea.value = text;
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};
