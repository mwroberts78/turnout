import { Plus } from 'lucide-react';
import type { AppUser } from '@/lib/types/appUser';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export interface AdminOpportunitiesProps {
  appUser: AppUser;
}

export default async function AdminOpportunities({
  appUser,
}: AdminOpportunitiesProps) {
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
          <div className="flex min-h-14 items-center gap-2 border-b px-(--card-spacing) py-3">
            Admin Opportunities for
            {appUser.status === 'active' ? `${appUser.email}` : 'nothing'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
