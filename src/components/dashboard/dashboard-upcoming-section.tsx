import { ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { AppDateTime } from '@/components/app-ui/app-date-time';
import { AppInfoCard } from '@/components/app-ui/app-info-card';
import { Button } from '@/components/base-ui/button';
import { Skeleton } from '@/components/base-ui/skeleton';
import { findSignUpsForUser } from '@/lib/dal/signUp';

const shownCount = 3;

export async function DashboardUpcomingSection({
  tenantId,
  userId,
}: {
  tenantId: string;
  userId: string;
}) {
  const signUps = await findSignUpsForUser(tenantId, userId);
  const now = new Date();
  const upcoming = signUps
    .filter((s) => s.opportunity.startTime > now)
    .slice(0, shownCount);

  return (
    <AppInfoCard
      title="Coming up"
      action={
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/my-signups" />}
          nativeButton={false}
        >
          My signups
          <ArrowRight />
        </Button>
      }
    >
      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center text-sm text-muted-foreground">
          Nothing on your calendar yet.
          <Button
            size="sm"
            render={<Link href="/opportunities" />}
            nativeButton={false}
          >
            Find an opportunity
          </Button>
        </div>
      ) : (
        <ul className="divide-y">
          {upcoming.map(({ id, opportunity }) => (
            <li key={id} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={`/opportunities/view/${opportunity.id}`}
                className="font-medium hover:underline"
              >
                {opportunity.title}
              </Link>
              <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <AppDateTime
                  start={opportunity.startTime}
                  end={opportunity.endTime}
                  timeZone={opportunity.timeZone}
                  variant="inline"
                />
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {opportunity.location || 'Remote'}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppInfoCard>
  );
}

export function DashboardUpcomingSkeleton() {
  return (
    <AppInfoCard title="Coming up">
      <div className="space-y-4">
        {Array.from({ length: shownCount }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reorders
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </AppInfoCard>
  );
}
