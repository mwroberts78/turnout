import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { Card } from '@/components/base-ui/card';
import { BrowseOpportunityDetailsSection } from '@/components/opportunities/browse-opportunities/browse-opportunity-details-section';
import { BrowseOpportunityDetailsSkeleton } from '@/components/opportunities/browse-opportunities/browse-opportunity-details-skeleton';
import { getCurrentAppUser } from '@/lib/auth';
import { isUuid } from '@/lib/utils/isUuid';

export default async function OpportunityPage({
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
    <>
      <AppBreadcrumb />
      <Card className="mx-auto w-full max-w-md py-0">
        <Suspense fallback={<BrowseOpportunityDetailsSkeleton />}>
          <BrowseOpportunityDetailsSection
            id={id}
            tenantId={appUser.tenantId}
            userId={appUser.id}
          />
        </Suspense>
      </Card>
    </>
  );
}
