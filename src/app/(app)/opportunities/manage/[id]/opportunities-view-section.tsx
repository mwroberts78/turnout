import { notFound } from 'next/navigation';
import { findOpportunityById } from '@/lib/dal/opportunity';

export async function OpportunitiesViewSection({
  id,
  tenantId,
}: {
  id: string;
  tenantId: string;
}) {
  const opportunity = await findOpportunityById(id, tenantId);

  if (!opportunity) notFound();

  return <div>{opportunity.title}</div>;
}
