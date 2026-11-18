import { BarChart3, ClipboardList } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { AppInfoCard } from '@/components/app-ui/app-info-card';
import { Button } from '@/components/base-ui/button';
import {
  DashboardStatsSection,
  DashboardStatsSkeleton,
} from '@/components/dashboard/dashboard-stats-section';
import {
  DashboardUpcomingSection,
  DashboardUpcomingSkeleton,
} from '@/components/dashboard/dashboard-upcoming-section';
import { getCurrentAppUser } from '@/lib/auth';
import { isAdminUser } from '@/lib/types/appUser';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  return (
    <>
      <AppBreadcrumb />
      <div className="space-y-6">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
          Welcome back, {appUser.firstName}
        </h1>

        <Suspense fallback={<DashboardStatsSkeleton />}>
          <DashboardStatsSection
            tenantId={appUser.tenantId}
            userId={appUser.id}
          />
        </Suspense>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Suspense fallback={<DashboardUpcomingSkeleton />}>
            <DashboardUpcomingSection
              tenantId={appUser.tenantId}
              userId={appUser.id}
            />
          </Suspense>

          {isAdminUser(appUser) && (
            <AppInfoCard title="Admin">
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                <Button
                  variant="outline"
                  render={<Link href="/opportunities/manage" />}
                  nativeButton={false}
                >
                  <ClipboardList />
                  Manage opportunities
                </Button>
                <Button
                  variant="outline"
                  render={<Link href="/reports" />}
                  nativeButton={false}
                >
                  <BarChart3 />
                  View reports
                </Button>
              </div>
            </AppInfoCard>
          )}
        </div>
      </div>
    </>
  );
}
