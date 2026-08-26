import { Card, CardContent } from '../ui/card';

export default async function EmployeeOpportunities() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
          Opportunities
        </h1>
      </div>
      <Card>
        <CardContent className="flex flex-col p-0 **:data-[slot=table-container]:flex-1">
          <div className="flex min-h-14 items-center gap-2 border-b px-(--card-spacing) py-3">
            Employee Opportunities
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
