import { Plus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentAppUser } from '@/lib/auth';
import { OpportunitiesTableSection } from './opportunities-table-section';
import { OpportunitiesTableSkeleton } from './opportunities-table-skeleton';

export default async function ManageOpportunities() {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  return (
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
      <Card>
        <CardContent className="flex flex-col p-0 **:data-[slot=table-container]:flex-1">
          <Suspense fallback={<OpportunitiesTableSkeleton />}>
            <OpportunitiesTableSection tenantId={appUser.tenantId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
