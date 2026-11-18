import { describe, expect, it } from 'vitest';
import { parseReportRange, reportRangeStart } from '@/lib/utils/reportRange';

const now = new Date('2026-11-18T12:00:00Z');

describe('parseReportRange', () => {
  it('accepts each known range', () => {
    for (const range of ['30d', '90d', '12m', 'all']) {
      expect(parseReportRange(range)).toBe(range);
    }
  });

  it('falls back to the last 12 months for missing or unknown values', () => {
    expect(parseReportRange(undefined)).toBe('12m');
    expect(parseReportRange('7d')).toBe('12m');
    expect(parseReportRange(['30d'])).toBe('12m');
  });
});

describe('reportRangeStart', () => {
  // Compares calendar dates only: date-fns counts days in local time, so the
  // hour can shift by one across a daylight saving change.
  it('counts back from now', () => {
    const day = (range: '30d' | '90d' | '12m') =>
      reportRangeStart(range, now)?.toISOString().slice(0, 10);

    expect(day('30d')).toBe('2026-10-19');
    expect(day('90d')).toBe('2026-08-20');
    expect(day('12m')).toBe('2025-11-18');
  });

  it('has no start for all time', () => {
    expect(reportRangeStart('all', now)).toBeNull();
  });
});
