import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { MySignupsSection } from '@/components/signups/my-signups/my-signups-section';
import { MySignupsSkeleton } from '@/components/signups/my-signups/my-signups-skeleton';
import { getCurrentAppUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'My Signups' };

export default async function MySignupsPage() {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  return (
    <>
      <AppBreadcrumb />
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
          My Signups
        </h1>
        <Suspense fallback={<MySignupsSkeleton />}>
          <MySignupsSection tenantId={appUser.tenantId} userId={appUser.id} />
        </Suspense>
      </div>
    </>
  );
}
