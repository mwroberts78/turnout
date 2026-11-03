import { describe, expect, it } from 'vitest';
import { isUuid } from '@/lib/utils/isUuid';

describe('isUuid', () => {
  it('accepts a UUID in either case', () => {
    expect(isUuid(crypto.randomUUID())).toBe(true);
    expect(isUuid(crypto.randomUUID().toUpperCase())).toBe(true);
  });

  it('rejects non-UUID segments', () => {
    expect(isUuid('abc')).toBe(false);
    expect(isUuid('new')).toBe(false);
    expect(isUuid(`${crypto.randomUUID()}x`)).toBe(false);
  });
});
