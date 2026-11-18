import { getCurrentAppUser } from '@/lib/auth';
import { getTenantReport } from '@/lib/dal/report';
import { isReportExportType, reportToCsv } from '@/lib/reports/reportCsv';
import { isAdminUser } from '@/lib/types/appUser';
import { parseReportRange } from '@/lib/utils/reportRange';

export async function GET(request: Request) {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active' || !isAdminUser(appUser)) {
    return new Response('Not found', { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!isReportExportType(type)) {
    return new Response('Unknown export type', { status: 400 });
  }

  const range = parseReportRange(searchParams.get('range'));
  const report = await getTenantReport(appUser.tenantId, range);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(reportToCsv(report, type), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}-${range}-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
