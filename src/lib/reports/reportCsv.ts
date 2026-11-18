import type { TenantReport } from '../dal/report';
import { toCsv } from '../utils/toCsv';

export const reportExportTypes = [
  'volunteers',
  'opportunities',
  'projects',
] as const;

export type ReportExportType = (typeof reportExportTypes)[number];

export function isReportExportType(value: unknown): value is ReportExportType {
  return reportExportTypes.includes(value as ReportExportType);
}

export function reportToCsv(report: TenantReport, type: ReportExportType) {
  if (type === 'projects') {
    return toCsv(
      [
        'Project',
        'Opportunities',
        'Signups',
        'Volunteers',
        'Completed',
        'Hours',
      ],
      report.byProject.map((p) => [
        p.title,
        p.opportunityCount,
        p.signupCount,
        p.volunteerCount,
        p.completedCount,
        p.hours,
      ]),
    );
  }

  if (type === 'volunteers') {
    return toCsv(
      ['First name', 'Last name', 'Email', 'Signups', 'Completed', 'Hours'],
      report.byVolunteer.map((v) => [
        v.firstName,
        v.lastName,
        v.email,
        v.signupCount,
        v.completedCount,
        v.hours,
      ]),
    );
  }

  return toCsv(
    [
      'Opportunity',
      'Type',
      'Start (UTC)',
      'Capacity',
      'Signups',
      'Completed',
      'Hours',
    ],
    report.byOpportunity.map((o) => [
      o.title,
      o.opportunityType,
      o.startTime.toISOString(),
      o.maxSignupsAllowed,
      o.signupCount,
      o.completedCount,
      o.hours,
    ]),
  );
}
