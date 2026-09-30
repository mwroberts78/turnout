import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ViewOpportunitySection } from '@/components/opportunities/view-opportunity/view-opportunity-section';
import { ViewOpportunitySkeleton } from '@/components/opportunities/view-opportunity/view-opportunity-skeleton';
import { getCurrentAppUser } from '@/lib/auth';

export default async function ManageOpportunityPage({
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
    <Suspense fallback={<ViewOpportunitySkeleton />}>
      <ViewOpportunitySection id={id} tenantId={appUser.tenantId} />
    </Suspense>
  );
}
