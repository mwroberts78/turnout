import {
  CalendarClock,
  CircleCheck,
  Mail,
  MapPin,
  Shirt,
  User,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import type React from 'react';
import { AppCapacityDisplay } from '@/components/app-ui/app-capacity-display';
import { AppDateTime } from '@/components/app-ui/app-date-time';
import { AppOpportunityBadge } from '@/components/app-ui/app-opportunity-badge';
import { AppOpportunityImage } from '@/components/app-ui/app-opportunity-image';
import { Badge } from '@/components/base-ui/badge';
import type { PublishedOpportunityDetails } from '@/lib/dal/opportunity';

function signupBlockedReason(opportunity: PublishedOpportunityDetails) {
  if (opportunity.isSignedUp) return null;
  if (opportunity.startTime <= new Date()) {
    return 'Sign-ups are closed. This opportunity has already started.';
  }
  if (
    opportunity.maxSignupsAllowed !== null &&
    opportunity.signupCount >= opportunity.maxSignupsAllowed
  ) {
    return 'This opportunity is full.';
  }
  return null;
}

export function BrowseOpportunityDetails({
  opportunity,
  children,
}: {
  opportunity: PublishedOpportunityDetails;
  children?: React.ReactNode;
}) {
  const blockedReason = signupBlockedReason(opportunity);

  return (
    <div>
      <div className="relative aspect-video overflow-hidden">
        <AppOpportunityImage
          imageUrl={opportunity.imageUrl}
          opportunityType={opportunity.opportunityType}
          alt={opportunity.title}
          sizes="(max-width: 640px) 100vw, 448px"
          className="object-cover"
        />
        {opportunity.isSignedUp && (
          <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-xs backdrop-blur-sm">
            <CircleCheck className="size-3.5 text-primary" />
            Signed up
          </span>
        )}
      </div>

      <div className="space-y-6 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold sm:text-xl">
              {opportunity.title}
            </h2>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">
                {opportunity.location || 'Remote'}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <AppOpportunityBadge
              opportunityType={opportunity.opportunityType}
            />
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-muted-foreground" />
            <AppDateTime
              start={opportunity.startTime}
              end={opportunity.endTime}
              timeZone={opportunity.timeZone}
            />
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-muted-foreground" />
            <AppCapacityDisplay
              count={opportunity.signupCount}
              max={opportunity.maxSignupsAllowed}
              showRemaining
            />
          </div>
        </div>

        {(opportunity.mealProvided || opportunity.tshirtProvided) && (
          <div className="flex flex-wrap gap-2">
            {opportunity.mealProvided && (
              <Badge
                variant="outline"
                className="gap-1.5 px-2.5 py-1.5 font-normal"
              >
                <UtensilsCrossed className="size-3.5" />
                Meal provided
              </Badge>
            )}
            {opportunity.tshirtProvided && (
              <Badge
                variant="outline"
                className="gap-1.5 px-2.5 py-1.5 font-normal"
              >
                <Shirt className="size-3.5" />
                T-shirt provided
              </Badge>
            )}
          </div>
        )}

        {opportunity.description && (
          <section>
            <h3 className="mb-2 font-semibold">Description</h3>
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {opportunity.description}
            </p>
          </section>
        )}

        {opportunity.mealProvided && opportunity.mealOptions.length > 0 && (
          <section>
            <h3 className="mb-3 font-semibold">Meal options</h3>
            <div className="flex flex-wrap gap-2">
              {opportunity.mealOptions.map((meal) => (
                <Badge key={meal.id} variant="outline" className="font-normal">
                  {meal.mealName}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-3 font-semibold">Organizer</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="size-4" />
              <span>
                {opportunity.creator.firstName} {opportunity.creator.lastName}
              </span>
            </div>
            <a
              href={`mailto:${opportunity.creator.email}`}
              className="flex items-center gap-2 hover:text-foreground"
            >
              <Mail className="size-4" />
              <span className="truncate">{opportunity.creator.email}</span>
            </a>
          </div>
        </section>

        {opportunity.isSignedUp ? (
          <p className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm font-medium">
            <CircleCheck className="size-4 text-primary" />
            You're signed up for this opportunity.
          </p>
        ) : blockedReason ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            {blockedReason}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
