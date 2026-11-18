import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { BrowseProjectsSection } from '@/components/projects/browse-projects/browse-projects-section';
import { BrowseProjectsSkeleton } from '@/components/projects/browse-projects/browse-projects-skeleton';
import { getCurrentAppUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Projects' };

export default async function ProjectsPage() {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  return (
    <>
      <AppBreadcrumb />
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Groups of related opportunities you can join together.
          </p>
        </div>
        <Suspense fallback={<BrowseProjectsSkeleton />}>
          <BrowseProjectsSection tenantId={appUser.tenantId} />
        </Suspense>
      </div>
    </>
  );
}
