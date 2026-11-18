import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { ProjectForm } from '@/components/projects/manage-projects/project-form';
import { getCurrentAppUser } from '@/lib/auth';
import { findProjectById } from '@/lib/dal/project';
import { isUuid } from '@/lib/utils/isUuid';

export const metadata: Metadata = { title: 'Edit Project' };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isUuid(id)) notFound();

  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') notFound();

  const project = await findProjectById(id, appUser.tenantId);

  if (!project) notFound();

  return (
    <>
      <AppBreadcrumb overrides={{ '/projects/manage/[id]': project.title }} />
      <div className="space-y-4">
        <h1 className="mx-auto max-w-2xl text-xl font-bold tracking-tight lg:text-2xl">
          Edit Project
        </h1>
        <ProjectForm
          project={{
            id: project.id,
            title: project.title,
            description: project.description,
          }}
        />
      </div>
    </>
  );
}
