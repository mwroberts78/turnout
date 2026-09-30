import { notFound } from 'next/navigation';
import { ViewOpportunity } from '@/components/opportunities/view-opportunity/view-opportunity';
import { getCurrentAppUser } from '@/lib/auth';
import { findOpportunityById } from '@/lib/dal/opportunity';

export async function ViewOpportunitySection({
  id,
  tenantId,
}: {
  id: string;
  tenantId: string;
}) {
  const opportunity = await findOpportunityById(id, tenantId);

  if (!opportunity) notFound();

  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  return <ViewOpportunity opportunity={opportunity} appUser={appUser} />;
}
