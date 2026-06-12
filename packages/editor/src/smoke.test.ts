import { describe, expect, it } from 'vitest';

import pkg from '../package.json';
import { EDITOR_VERSION } from './version';

describe('package smoke test', () => {
  it('EDITOR_VERSION entspricht der package.json-Version (SemVer)', () => {
    expect(EDITOR_VERSION).toBe(pkg.version);
    expect(EDITOR_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
