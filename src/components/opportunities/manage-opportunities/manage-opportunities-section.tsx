import { OpportunitiesTable } from '@/components/opportunities/manage-opportunities/opportunities-table/opportunities-table';
import { opportunitiesTableColumns } from '@/components/opportunities/manage-opportunities/opportunities-table/opportunities-table-columns';
import { findOpportunitiesByTenant } from '@/lib/dal/opportunity';

export async function ManageOpportunitiesSection({
  tenantId,
}: {
  tenantId: string;
}) {
  const opportunities = await findOpportunitiesByTenant(tenantId);
  return (
    <OpportunitiesTable
      data={opportunities}
      columns={opportunitiesTableColumns}
    />
  );
}
