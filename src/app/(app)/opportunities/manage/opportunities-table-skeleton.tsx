import { Skeleton } from '@/components/ui/skeleton';

export function OpportunitiesTableSkeleton() {
  return (
    <div className="overflow-hidden">
      <div className="flex items-center gap-4 border-b px-4 pt-1 pb-5">
        <Skeleton className="h-9 w-full max-w-sm" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reorders
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="aspect-video w-24 shrink-0 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
