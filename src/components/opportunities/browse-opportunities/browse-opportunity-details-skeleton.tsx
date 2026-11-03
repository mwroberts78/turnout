import { Skeleton } from '@/components/base-ui/skeleton';

export function BrowseOpportunityDetailsSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-6 p-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
