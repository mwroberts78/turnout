import { AppInfoCard } from '@/components/app-ui/app-info-card';
import { Skeleton } from '@/components/base-ui/skeleton';

export function EditOpportunitySkeleton() {
  return (
    <>
      <section className="my-8 flex flex-col justify-between space-y-4 @min-[1100px]:flex-row @min-[1100px]:items-center @min-[1100px]:space-y-2">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </section>
      <section className="grid gap-4 @min-[1100px]:grid-cols-6">
        <div className="space-y-4 @min-[1100px]:col-span-3">
          <AppInfoCard title={<Skeleton className="h-4 w-16" />}>
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </AppInfoCard>
          <AppInfoCard title={<Skeleton className="h-4 w-16" />}>
            <div className="space-y-4">
              <Skeleton className="aspect-video w-full rounded-md" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-24" />
            </div>
          </AppInfoCard>
        </div>
        <div className="@container space-y-4 @min-[1100px]:col-span-3">
          <AppInfoCard title={<Skeleton className="h-4 w-16" />}>
            <div className="space-y-4">
              <Skeleton className="h-8 w-full max-w-64" />
              <div className="grid gap-x-4 @min-[420px]:grid-cols-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 max-w-sm" />
              <Skeleton className="h-8 max-w-sm" />
            </div>
          </AppInfoCard>
        </div>
      </section>
    </>
  );
}
