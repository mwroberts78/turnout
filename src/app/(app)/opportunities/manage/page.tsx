import { Plus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import {
  TableRefreshOverlay,
  TableRefreshProvider,
} from '@/components/app-ui/data-table/table-refresh-context';
import { Button } from '@/components/base-ui/button';
import { Card, CardContent } from '@/components/base-ui/card';
import { ManageOpportunitiesSection } from '@/components/opportunities/manage-opportunities/manage-opportunities-section';
import { ManageOpportunitiesSkeleton } from '@/components/opportunities/manage-opportunities/manage-opportunities-skeleton';
import { getCurrentAppUser } from '@/lib/auth';

export default async function ManageOpportunitiesPage() {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  return (
    <>
      <AppBreadcrumb />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
            Manage Opportunities
          </h1>
          <Button>
            <Plus />
            Add New Opportunity
          </Button>
        </div>
        <TableRefreshProvider>
          <Card className="relative">
            <TableRefreshOverlay />
            <CardContent className="flex flex-col p-0 **:data-[slot=table-container]:flex-1">
              <Suspense fallback={<ManageOpportunitiesSkeleton />}>
                <ManageOpportunitiesSection tenantId={appUser.tenantId} />
              </Suspense>
            </CardContent>
          </Card>
        </TableRefreshProvider>
      </div>
    </>
  );
}
