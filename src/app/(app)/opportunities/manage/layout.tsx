import { notFound } from 'next/navigation';
import { getCurrentAppUser } from '@/lib/auth';
import { isAdminUser } from '@/lib/types/appUser';

export default async function ManageOpportunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appUser = await getCurrentAppUser();

  if (!isAdminUser(appUser)) {
    notFound();
  }

  return children;
}
