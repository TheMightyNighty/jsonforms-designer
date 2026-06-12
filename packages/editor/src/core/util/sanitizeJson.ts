/**
 * Hardening for JSON parsed from untrusted-at-rest sources (imported files,
 * localStorage). `JSON.parse` happily produces own enumerable keys such as
 * `__proto__`, `constructor` and `prototype`; once that data is spread,
 * cloned or merged into application state it becomes a prototype-pollution
 * vector. This strips those keys recursively and returns a clean copy.
 */

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function sanitizeParsedJson<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeParsedJson(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (FORBIDDEN_KEYS.has(key)) continue;
      clean[key] = sanitizeParsedJson(child);
    }
    return clean as T;
  }
  return value;
}
