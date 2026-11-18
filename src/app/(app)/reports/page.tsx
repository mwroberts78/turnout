import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { ReportRangeSelect } from '@/components/reports/report-range-select';
import { ReportsSection } from '@/components/reports/reports-section';
import { ReportsSkeleton } from '@/components/reports/reports-skeleton';
import { getCurrentAppUser } from '@/lib/auth';
import { parseReportRange } from '@/lib/utils/reportRange';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  const range = parseReportRange((await searchParams).range);

  return (
    <>
      <AppBreadcrumb />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
            Reports
          </h1>
          <ReportRangeSelect range={range} />
        </div>
        <p className="text-sm text-muted-foreground">
          Covers opportunities that started in the selected period. Hours count
          once an admin marks the work completed.
        </p>
        <Suspense key={range} fallback={<ReportsSkeleton />}>
          <ReportsSection tenantId={appUser.tenantId} range={range} />
        </Suspense>
      </div>
    </>
  );
}
