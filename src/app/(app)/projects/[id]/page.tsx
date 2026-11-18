import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BrowseOpportunitiesSkeleton } from '@/components/opportunities/browse-opportunities/browse-opportunities-skeleton';
import { BrowseProjectSection } from '@/components/projects/browse-projects/browse-project-section';
import { getCurrentAppUser } from '@/lib/auth';
import { isUuid } from '@/lib/utils/isUuid';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isUuid(id)) notFound();

  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') notFound();

  return (
    <Suspense fallback={<BrowseOpportunitiesSkeleton />}>
      <BrowseProjectSection
        id={id}
        tenantId={appUser.tenantId}
        userId={appUser.id}
      />
    </Suspense>
  );
}
