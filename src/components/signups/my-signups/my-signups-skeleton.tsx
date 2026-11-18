import { Card } from '@/components/base-ui/card';
import { Skeleton } from '@/components/base-ui/skeleton';

export function MySignupsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-28" />
      {Array.from({ length: 3 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reorders
        <Card key={i} className="flex flex-col gap-4 p-4 sm:flex-row">
          <Skeleton className="h-36 rounded-lg sm:h-28 sm:w-40" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}
