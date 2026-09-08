import {
  CalendarClock,
  Eye,
  EyeOff,
  MapPin,
  Pencil,
  Shirt,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { AppCapacityDisplay } from '@/components/app-ui/app-capacity-display';
import { AppDateTime } from '@/components/app-ui/app-date-time';
import { AppInfoCard } from '@/components/app-ui/app-info-card';
import { AppOpportunityBadge } from '@/components/app-ui/app-opportunity-badge';
import { AppOpportunityTypeBlock } from '@/components/app-ui/app-opportunity-type-block';
import { Button } from '@/components/base-ui/button';
import type { OpportunityWithDetails } from '@/lib/dal/opportunity';
import { type AppUser, isAdminUser } from '@/lib/types/appUser';
import { ViewOpportunitySignupsTableSection } from './view-opportunity-signups/view-opportunity-signups-table-section';
import { ViewOpportunitiesSignupsTableSkeleton } from './view-opportunity-signups/view-opportunity-signups-table-skeleton';

export async function ViewOpportunity({
  opportunity,
  appUser,
}: {
  opportunity: OpportunityWithDetails;
  appUser: AppUser;
}) {
  if (appUser.status !== 'active') {
    notFound();
  }

  const isAdmin: boolean = isAdminUser(appUser);

  return (
    <>
      <AppBreadcrumb
        overrides={{ '/opportunities/manage/[id]': opportunity.title }}
      />
      <div className="mx-auto max-w-5xl space-y-4 lg:space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
            {opportunity.title}
          </h1>

          {isAdmin && (
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Button variant="outline" size="sm" type="button">
                <Pencil />
                Edit
              </Button>

              <Button variant="outline" size="sm" type="button">
                {opportunity.isPublished ? (
                  <>
                    {' '}
                    <EyeOff /> Unpublish
                  </>
                ) : (
                  <>
                    <Eye /> Publish
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        <section className="grid gap-3 lg:grid-cols-3">
          <div className="relative min-h-62.5 overflow-hidden rounded-md lg:col-span-2 lg:min-h-105">
            {opportunity.imageUrl ? (
              <Image
                src={opportunity.imageUrl}
                alt={opportunity.title}
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
            ) : (
              <AppOpportunityTypeBlock oppType={opportunity.opportunityType} />
            )}
          </div>
          <AppInfoCard
            title={
              <div className="flex w-full items-center justify-between">
                <span>Details</span>
                <AppOpportunityBadge
                  opportunityType={opportunity.opportunityType}
                />
              </div>
            }
          >
            <div className="flex flex-col space-y-4 text-sm">
              {opportunity.location && opportunity.location.length > 0 && (
                <p className="inline-flex items-center gap-2">
                  <MapPin className="text-muted-foreground size-4" />
                  {opportunity.location}
                </p>
              )}
              <div className="inline-flex items-center gap-2">
                <CalendarClock className="text-muted-foreground size-4" />
                <AppDateTime
                  start={opportunity.startTime}
                  end={opportunity.endTime}
                />
              </div>
              {opportunity.tshirtProvided && (
                <p className="inline-flex items-center gap-2">
                  <Shirt className="text-muted-foreground size-4" />
                  T-Shirt Provided
                </p>
              )}
              {opportunity.mealProvided && (
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-2">
                    <UtensilsCrossed className="text-muted-foreground size-4" />
                    Meal Provided
                  </span>
                  <div className="text-muted-foreground text-sm ml-6">
                    Meal Choices:
                    <ul className="list-disc list-inside text-sm marker:text-muted-foreground">
                      {opportunity.mealOptions.map((meal) => (
                        <li key={meal.id}>{meal.mealName}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <span className="inline-flex items-center gap-2">
                  <Users className="text-muted-foreground size-4" />
                  Capacity
                </span>
                <AppCapacityDisplay
                  count={opportunity.signUps.length}
                  max={opportunity.maxSignupsAllowed}
                  showRemaining
                  className="ml-6"
                />
              </div>
            </div>
          </AppInfoCard>
        </section>

        {opportunity.description && (
          <section>
            <AppInfoCard title="Description">
              {opportunity.description}
            </AppInfoCard>
          </section>
        )}

        <section>
          <AppInfoCard title="Signups">
            <Suspense fallback={<ViewOpportunitiesSignupsTableSkeleton />}>
              <div className="-m-4">
                <ViewOpportunitySignupsTableSection
                  oppId={opportunity.id}
                  tenantId={appUser.tenantId}
                  isAdmin={isAdmin}
                />
              </div>
            </Suspense>
          </AppInfoCard>
        </section>
      </div>
    </>
  );
}
