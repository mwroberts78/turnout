import { Card, CardContent } from '@/components/base-ui/card';
import { Skeleton } from '@/components/base-ui/skeleton';

export function BrowseOpportunitiesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reorders
        <Card key={i}>
          <Skeleton className="mx-(--card-spacing) h-44 rounded-lg" />
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex justify-between border-t pt-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-14" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
