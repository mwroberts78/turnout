import type { Metadata } from 'next';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { ProjectForm } from '@/components/projects/manage-projects/project-form';

export const metadata: Metadata = { title: 'New Project' };

export default function NewProjectPage() {
  return (
    <>
      <AppBreadcrumb />
      <div className="space-y-4">
        <h1 className="mx-auto max-w-2xl text-xl font-bold tracking-tight lg:text-2xl">
          New Project
        </h1>
        <ProjectForm />
      </div>
    </>
  );
}
