import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { EditOpportunitySection } from '@/components/opportunities/manage-opportunities/edit-opportunity/edit-opportunity-section';
import { EditOpportunitySkeleton } from '@/components/opportunities/manage-opportunities/edit-opportunity/edit-opportunity-skeleton';
import { getCurrentAppUser } from '@/lib/auth';

export default async function EditOpportunityPage({
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
    <Suspense fallback={<EditOpportunitySkeleton />}>
      <EditOpportunitySection id={id} tenantId={appUser.tenantId} />
    </Suspense>
  );
}
