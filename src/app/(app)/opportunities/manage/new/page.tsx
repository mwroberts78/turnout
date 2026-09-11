import { notFound } from 'next/navigation';
import { EditOpportunityForm } from '@/components/opportunities/manage-opportunities/edit-opportunity/edit-opportunity-form';
import { getCurrentAppUser } from '@/lib/auth';

export default async function NewOpportunityPage() {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  return <EditOpportunityForm />;
}
