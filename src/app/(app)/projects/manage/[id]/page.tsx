import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ManageProjectsSkeleton } from '@/components/projects/manage-projects/manage-projects-skeleton';
import { ViewProjectSection } from '@/components/projects/manage-projects/view-project-section';
import { getCurrentAppUser } from '@/lib/auth';
import { isUuid } from '@/lib/utils/isUuid';

export const metadata: Metadata = { title: 'Project' };

export default async function ManageProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isUuid(id)) notFound();

  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') notFound();

  return (
    <Suspense fallback={<ManageProjectsSkeleton />}>
      <ViewProjectSection id={id} tenantId={appUser.tenantId} />
    </Suspense>
  );
}
