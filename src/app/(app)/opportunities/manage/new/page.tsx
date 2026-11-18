import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditOpportunityForm } from '@/components/opportunities/manage-opportunities/edit-opportunity/edit-opportunity-form';
import { getCurrentAppUser } from '@/lib/auth';
import { findProjectById } from '@/lib/dal/project';
import { isUuid } from '@/lib/utils/isUuid';

export const metadata: Metadata = { title: 'New Opportunity' };

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  const { project: projectParam } = await searchParams;

  if (projectParam === undefined) {
    return <EditOpportunityForm />;
  }

  if (typeof projectParam !== 'string' || !isUuid(projectParam)) notFound();

  const project = await findProjectById(projectParam, appUser.tenantId);

  if (!project) notFound();

  return (
    <EditOpportunityForm project={{ id: project.id, title: project.title }} />
  );
}
