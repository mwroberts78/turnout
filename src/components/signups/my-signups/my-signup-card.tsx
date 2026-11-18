import { CircleCheck, Clock, Hourglass, MapPin } from 'lucide-react';
import Link from 'next/link';
import { AppDateTime } from '@/components/app-ui/app-date-time';
import { AppOpportunityBadge } from '@/components/app-ui/app-opportunity-badge';
import { AppOpportunityImage } from '@/components/app-ui/app-opportunity-image';
import { Badge } from '@/components/base-ui/badge';
import { Card } from '@/components/base-ui/card';
import { SignupReadOnlySummary } from '@/components/signups/signup-readonly-summary';
import type { OwnSignUp } from '@/lib/dal/signUp';
import { formatHours } from '@/lib/utils/formatHours';
import { MySignupActions } from './my-signup-actions';

function PastStatus({ signUp }: { signUp: OwnSignUp }) {
  if (signUp.workCompleted) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CircleCheck className="text-primary" />
        Completed · {formatHours(signUp.actualHours ?? signUp.estimatedHours)}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Hourglass />
      Awaiting confirmation
    </Badge>
  );
}

export function MySignupCard({
  signUp,
  isUpcoming,
}: {
  signUp: OwnSignUp;
  isUpcoming: boolean;
}) {
  const { opportunity } = signUp;

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row">
      <div className="relative h-36 shrink-0 overflow-hidden rounded-lg sm:h-auto sm:min-h-28 sm:w-40">
        <AppOpportunityImage
          imageUrl={opportunity.imageUrl}
          opportunityType={opportunity.opportunityType}
          alt={opportunity.title}
          sizes="(max-width: 640px) 100vw, 160px"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/opportunities/view/${opportunity.id}`}
              className="font-semibold hover:underline"
            >
              {opportunity.title}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                <AppDateTime
                  start={opportunity.startTime}
                  end={opportunity.endTime}
                  timeZone={opportunity.timeZone}
                  variant="inline"
                />
              </span>
              <span className="flex min-w-0 items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">
                  {opportunity.location || 'Remote'}
                </span>
              </span>
            </div>
          </div>
          <AppOpportunityBadge opportunityType={opportunity.opportunityType} />
        </div>

        {isUpcoming ? (
          <>
            <SignupReadOnlySummary
              estimatedHours={signUp.estimatedHours}
              wantsMeal={signUp.wantsMeal}
              mealName={signUp.selectedMealOption?.mealName ?? null}
              wantsTShirt={signUp.wantsTShirt}
              tshirtSize={signUp.tshirtSize}
              comments={signUp.comments}
            />
            <MySignupActions signUp={signUp} />
          </>
        ) : (
          <div>
            <PastStatus signUp={signUp} />
          </div>
        )}
      </div>
    </Card>
  );
}
