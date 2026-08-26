import { Plus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { columns } from '@/components/opportunities/manage-opportunities/opportunities-table/columns';
import { DataTable } from '@/components/opportunities/manage-opportunities/opportunities-table/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentAppUser } from '@/lib/auth';
import { findOpportunitiesByTenant } from '@/lib/dal/opportunity';

export default async function ManageOpportunities() {
  const appUser = await getCurrentAppUser();

  if (appUser.status !== 'active') {
    notFound();
  }

  const opportunities = await findOpportunitiesByTenant(appUser.tenantId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
          Opportunities
        </h1>
        <Button>
          <Plus />
          Add New Opportunity
        </Button>
      </div>
      <Card>
        <CardContent className="flex flex-col p-0 **:data-[slot=table-container]:flex-1">
          <DataTable data={opportunities} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
