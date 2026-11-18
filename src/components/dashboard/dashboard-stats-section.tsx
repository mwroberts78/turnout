import { CalendarCheck, CircleCheck, Clock, Hourglass } from 'lucide-react';
import {
  AppStatCard,
  AppStatCardSkeleton,
} from '@/components/app-ui/app-stat-card';
import { getVolunteerSummary } from '@/lib/dal/report';
import { formatHours } from '@/lib/utils/formatHours';

const statGridClassName = 'grid grid-cols-2 gap-3 lg:grid-cols-4';

export async function DashboardStatsSection({
  tenantId,
  userId,
}: {
  tenantId: string;
  userId: string;
}) {
  const summary = await getVolunteerSummary(tenantId, userId);

  return (
    <div className={statGridClassName}>
      <AppStatCard
        label="Hours volunteered"
        value={formatHours(summary.hours)}
        icon={Clock}
        description="Confirmed by an admin"
      />
      <AppStatCard
        label="Completed"
        value={summary.completedCount}
        icon={CircleCheck}
        description="Opportunities finished"
      />
      <AppStatCard
        label="Upcoming"
        value={summary.upcomingCount}
        icon={CalendarCheck}
        description="Signups ahead of you"
      />
      <AppStatCard
        label="Awaiting confirmation"
        value={summary.awaitingCount}
        icon={Hourglass}
        description="Past, not yet confirmed"
      />
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className={statGridClassName}>
      {Array.from({ length: 4 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reorders
        <AppStatCardSkeleton key={i} />
      ))}
    </div>
  );
}
