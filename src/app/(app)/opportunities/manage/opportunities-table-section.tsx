import { columns } from '@/components/opportunities/manage-opportunities/opportunities-table/columns';
import { DataTable } from '@/components/opportunities/manage-opportunities/opportunities-table/data-table';
import { findOpportunitiesByTenant } from '@/lib/dal/opportunity';

export async function OpportunitiesTableSection({
  tenantId,
}: {
  tenantId: string;
}) {
  const opportunities = await findOpportunitiesByTenant(tenantId);
  return <DataTable data={opportunities} columns={columns} />;
}
