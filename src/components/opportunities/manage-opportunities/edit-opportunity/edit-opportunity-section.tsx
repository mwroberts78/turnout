import { notFound } from 'next/navigation';
import { findOpportunityById } from '@/lib/dal/opportunity';
import { EditOpportunityForm } from './edit-opportunity-form';

export async function EditOpportunitySection({
  id,
  tenantId,
}: {
  id: string;
  tenantId: string;
}) {
  const opportunity = await findOpportunityById(id, tenantId);
  if (!opportunity) notFound();
  return <EditOpportunityForm opportunity={opportunity} />;
}
