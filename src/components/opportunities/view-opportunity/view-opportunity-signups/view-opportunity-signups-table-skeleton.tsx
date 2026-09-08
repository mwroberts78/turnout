import { Skeleton } from '@/components/base-ui/skeleton';

export function ViewOpportunitiesSignupsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-4 bg-muted px-4 py-2.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="ml-auto h-4 w-16" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reorders
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="ml-auto h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
