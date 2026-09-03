import { notFound } from 'next/navigation';
import { Suspense } from 'react';

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
    <Suspense fallback={<OpportunitiesViewSkeleton />}>
      <OpportunitiesViewSection id={id} tenantId={appUser.tenantId} />
    </Suspense>
  );
}
