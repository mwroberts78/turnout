import {
  CircleCheck,
  MapPin,
  Shirt,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import Link from 'next/link';
import { AppDateTime } from '@/components/app-ui/app-date-time';
import { AppOpportunityBadge } from '@/components/app-ui/app-opportunity-badge';
import { AppOpportunityImage } from '@/components/app-ui/app-opportunity-image';
import { Card, CardContent } from '@/components/base-ui/card';
import type { PublishedOpportunity } from '@/lib/dal/opportunity';

function spotsLabel(signupCount: number, max: number | null) {
  if (max === null) return 'Unlimited';
  const remaining = max - signupCount;
  if (remaining <= 0) return 'Full';
  return `${remaining} ${remaining === 1 ? 'spot' : 'spots'} left`;
}

export function BrowseOpportunityCard({
  opportunity,
}: {
  opportunity: PublishedOpportunity;
}) {
  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-shadow group-hover:shadow-lg">
        <div className="relative mx-(--card-spacing) h-44 overflow-hidden rounded-lg">
          <AppOpportunityImage
            imageUrl={opportunity.imageUrl}
            opportunityType={opportunity.opportunityType}
            alt={opportunity.title}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover"
          />
          {opportunity.isSignedUp && (
            <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-xs backdrop-blur-sm">
              <CircleCheck className="size-3.5 text-primary" />
              Signed up
            </span>
          )}
          <div className="absolute bottom-2 left-2 rounded-full bg-background/90 px-3 py-1 text-sm shadow-xs backdrop-blur-sm">
            <AppDateTime
              start={opportunity.startTime}
              end={opportunity.endTime}
              timeZone={opportunity.timeZone}
              variant="inline"
            />
          </div>
        </div>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{opportunity.title}</h3>
              <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
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
          <div className="flex items-center gap-4 border-t pt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              {spotsLabel(
                opportunity.signupCount,
                opportunity.maxSignupsAllowed,
              )}
            </span>
            {opportunity.mealProvided && (
              <span className="flex items-center gap-1.5">
                <UtensilsCrossed className="size-3.5" />
                Meal
              </span>
            )}
            {opportunity.tshirtProvided && (
              <span className="flex items-center gap-1.5">
                <Shirt className="size-3.5" />
                T-shirt
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
