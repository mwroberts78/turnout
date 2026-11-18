import { Card, CardContent } from '@/components/base-ui/card';
import { Skeleton } from '@/components/base-ui/skeleton';

export function ManageProjectsSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reorders
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
