import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { BrowseOpportunitiesSection } from '@/components/opportunities/browse-opportunities/browse-opportunities-section';
import { BrowseOpportunitiesSkeleton } from '@/components/opportunities/browse-opportunities/browse-opportunities-skeleton';
import { getCurrentAppUser } from '@/lib/auth';

export default async function OpportunitiesPage() {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  return (
    <>
      <AppBreadcrumb />
      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
          Opportunities
        </h1>
        <Suspense fallback={<BrowseOpportunitiesSkeleton />}>
          <BrowseOpportunitiesSection
            tenantId={appUser.tenantId}
            userId={appUser.id}
          />
        </Suspense>
      </div>
    </>
  );
}
