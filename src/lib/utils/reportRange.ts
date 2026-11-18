import { subDays, subMonths } from 'date-fns';

export const reportRanges = ['30d', '90d', '12m', 'all'] as const;

export type ReportRange = (typeof reportRanges)[number];

export const reportRangeLabels: Record<ReportRange, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '12m': 'Last 12 months',
  all: 'All time',
};

export const defaultReportRange: ReportRange = '12m';

export function parseReportRange(value: unknown): ReportRange {
  return reportRanges.includes(value as ReportRange)
    ? (value as ReportRange)
    : defaultReportRange;
}

export function reportRangeStart(
  range: ReportRange,
  now: Date = new Date(),
): Date | null {
  switch (range) {
    case '30d':
      return subDays(now, 30);
    case '90d':
      return subDays(now, 90);
    case '12m':
      return subMonths(now, 12);
    case 'all':
      return null;
  }
}
