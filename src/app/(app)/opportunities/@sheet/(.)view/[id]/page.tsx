import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BrowseOpportunityDetailsSection } from '@/components/opportunities/browse-opportunities/browse-opportunity-details-section';
import { BrowseOpportunityDetailsSkeleton } from '@/components/opportunities/browse-opportunities/browse-opportunity-details-skeleton';
import { BrowseOpportunitySheet } from '@/components/opportunities/browse-opportunities/browse-opportunity-sheet';
import { getCurrentAppUser } from '@/lib/auth';
import { isUuid } from '@/lib/utils/isUuid';

export default async function OpportunitySheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  return (
    <BrowseOpportunitySheet>
      <Suspense fallback={<BrowseOpportunityDetailsSkeleton />}>
        <BrowseOpportunityDetailsSection
          id={id}
          tenantId={appUser.tenantId}
          userId={appUser.id}
        />
      </Suspense>
    </BrowseOpportunitySheet>
  );
}
