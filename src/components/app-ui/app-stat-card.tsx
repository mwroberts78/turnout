import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/base-ui/card';
import { Skeleton } from '@/components/base-ui/skeleton';

export function AppStatCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}) {
  return (
    <Card className="py-4">
      <CardContent className="space-y-1 px-4">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{label}</span>
          <Icon className="size-4" />
        </div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function AppStatCardSkeleton() {
  return (
    <Card className="py-4">
      <CardContent className="space-y-2 px-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}
