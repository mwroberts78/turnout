import { AppInfoCard } from '@/components/app-ui/app-info-card';
import { AppStatCardSkeleton } from '@/components/app-ui/app-stat-card';
import { Skeleton } from '@/components/base-ui/skeleton';

export function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reorders
          <AppStatCardSkeleton key={i} />
        ))}
      </div>
      {['By opportunity', 'By volunteer'].map((title) => (
        <AppInfoCard key={title} title={title}>
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reorders
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </AppInfoCard>
      ))}
    </div>
  );
}
