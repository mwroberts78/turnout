import { Plus } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { Button } from '@/components/base-ui/button';
import { ManageProjectsSection } from '@/components/projects/manage-projects/manage-projects-section';
import { ManageProjectsSkeleton } from '@/components/projects/manage-projects/manage-projects-skeleton';
import { getCurrentAppUser } from '@/lib/auth';

export default async function ManageProjectsPage() {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  return (
    <>
      <AppBreadcrumb />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
            Manage Projects
          </h1>
          <Button
            render={<Link href="/projects/manage/new" />}
            nativeButton={false}
          >
            <Plus />
            New Project
          </Button>
        </div>
        <Suspense fallback={<ManageProjectsSkeleton />}>
          <ManageProjectsSection tenantId={appUser.tenantId} />
        </Suspense>
      </div>
    </>
  );
}
