import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentAppUser } from '@/lib/auth';
import { OpportunitiesViewSection } from './opportunities-view-section';
import { OpportunitiesViewSkeleton } from './opportunities-view-skeleton';

export default async function ViewOpportunity({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
          View Opportunity
        </h1>
      </div>
      <Card>
        <CardContent className="flex flex-col p-0 **:data-[slot=table-container]:flex-1">
          <Suspense fallback={<OpportunitiesViewSkeleton />}>
            <OpportunitiesViewSection id={id} tenantId={appUser.tenantId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
