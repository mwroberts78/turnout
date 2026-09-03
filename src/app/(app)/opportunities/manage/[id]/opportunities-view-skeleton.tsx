import TurnoutInfoCard from '@/components/app-layout/turnout-ui/turnout-info-card';
import { Skeleton } from '@/components/ui/skeleton';

export function OpportunitiesViewSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-7 w-64" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      <section className="grid gap-3 lg:grid-cols-3">
        <Skeleton className="min-h-62.5 w-full rounded-md lg:col-span-2 lg:min-h-105" />
        <TurnoutInfoCard title={<Skeleton className="h-4 w-16" />}>
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </TurnoutInfoCard>
      </section>

      <section>
        <TurnoutInfoCard title={<Skeleton className="h-4 w-24" />}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </TurnoutInfoCard>
      </section>
    </div>
  );
}
