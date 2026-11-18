import { describe, expect, it } from 'vitest';
import { reportHoursFormSchema } from '@/lib/schemas/report-hours-form';

describe('reportHoursFormSchema', () => {
  it('converts hours to a number', () => {
    expect(reportHoursFormSchema.parse({ actualHours: '2.5' })).toEqual({
      actualHours: 2.5,
    });
  });

  it('requires hours', () => {
    const result = reportHoursFormSchema.safeParse({ actualHours: ' ' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Hours are required');
  });

  it('rejects 0, more than 24, and non-numeric hours', () => {
    for (const actualHours of ['0', '24.5', 'abc']) {
      expect(reportHoursFormSchema.safeParse({ actualHours }).success).toBe(
        false,
      );
    }
  });
});
