import { describe, expect, it } from 'vitest';
import { formatHours } from '@/lib/utils/formatHours';

describe('formatHours', () => {
  it('uses the singular for exactly one hour', () => {
    expect(formatHours(1)).toBe('1 hr');
  });

  it('uses the plural otherwise', () => {
    expect(formatHours(0)).toBe('0 hrs');
    expect(formatHours(2.5)).toBe('2.5 hrs');
  });

  it('rounds to two decimal places', () => {
    expect(formatHours(1 / 3)).toBe('0.33 hrs');
  });
});
