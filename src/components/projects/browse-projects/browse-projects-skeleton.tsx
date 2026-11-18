import { Card, CardContent } from '@/components/base-ui/card';
import { Skeleton } from '@/components/base-ui/skeleton';

export function BrowseProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reorders
        <Card key={i}>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex justify-between border-t pt-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
