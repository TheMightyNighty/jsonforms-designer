/**
 * Pins the Monaco runtime to a fixed, audited version.
 *
 * `@monaco-editor/react` loads the Monaco editor at runtime via
 * `@monaco-editor/loader`, which by default pulls an unpinned build from a
 * public CDN. Pinning the version here makes the loaded code deterministic and
 * keeps us off the Monaco builds (>= 0.54) that ship the DOMPurify versions
 * affected by GHSA-h8r8-wccr-v5f2 / GHSA-v9jr-rg53-9pgp / GHSA-crv5-9vww-q3g8.
 *
 * Importing this module for its side effect (see ../index.ts) guarantees the
 * configuration runs before the first `<Editor>` triggers `loader.init()`.
 */
import { loader } from '@monaco-editor/react';

/** Audited Monaco version — predates the vulnerable DOMPurify advisories. */
export const PINNED_MONACO_VERSION = '0.52.2';

loader.config({
  paths: {
    vs: `https://cdn.jsdelivr.net/npm/monaco-editor@${PINNED_MONACO_VERSION}/min/vs`,
  },
});
