import { describe, expect, it } from 'vitest';

import { EDITOR_VERSION } from './index';

describe('package smoke test', () => {
  it('exposes a version', () => {
    expect(EDITOR_VERSION).toBe('0.1.0');
  });
});
